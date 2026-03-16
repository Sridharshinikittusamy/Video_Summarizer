from fastapi import APIRouter, BackgroundTasks, HTTPException, Form, UploadFile, File
from app.schemas.task import TaskResponse
from app.db.supabase_client import supabase
from app.services.audio_service import (
    download_youtube_audio, process_local_audio, 
    ensure_input_folder, INPUT_DIR, get_youtube_title_quick
)
from app.services.transcription_service import get_transcript_async
from app.services.summarizer_service import (
    detect_video_type, generate_report_async, generate_quiz_async,
    translate_report_async, translate_transcript_async, dict_to_md
)
from app.services.pdf_service import generate_pdf
from app.services.vision_service import extract_frames, extract_yt_frames
import uuid
import shutil
import asyncio
import json
import os
from pathlib import Path

router = APIRouter(prefix="/analyze", tags=["Tasks"])

# --- HELPERS ---

def cleanup_assets(task_id: str, audio_path: str = None):
    """Cleans up temporary files like audio to save disk space."""
    try:
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)
            print(f"🧹 Temporary audio removed: {audio_path}")
    except Exception as e:
        print(f"⚠️ Cleanup failed for {task_id}: {e}")

# --- DATA FETCHING ENDPOINTS ---

@router.get("/tasks")
async def get_all_tasks(user_id: str):
    """Fetches all tasks for a specific user from Supabase."""
    try:
        res = supabase.table("video_tasks").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        tasks = res.data
        
        for task in tasks:
            # Backward compatibility aliases
            task['input_type'] = task.get('source_type')
            task['video_type'] = task.get('content_category')
            
            # Check for slides
            frames_dir = Path(f"output/{task['id']}/frames")
            if frames_dir.exists():
                task['slides'] = [f"/static/{task['id']}/frames/{f.name}" for f in sorted(frames_dir.glob("*.jpg"))]
            else:
                task['slides'] = []
                
        return tasks
    except Exception as e:
        print(f"❌ DB Fetch Error: {e}")
        raise HTTPException(status_code=500, detail="Synchronization failure with Supabase.")

@router.get("/tasks/{task_id}")
async def get_task_by_id(task_id: str):
    """Fetches a specific task by ID from Supabase."""
    try:
        res = supabase.table("video_tasks").select("*").eq("id", task_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Task not found")
        
        task = res.data[0]
        # Backward compatibility aliases
        task['input_type'] = task.get('source_type')
        task['video_type'] = task.get('content_category')
        
        # Check for slides
        frames_dir = Path(f"output/{task['id']}/frames")
        if frames_dir.exists():
            task['slides'] = [f"/static/{task['id']}/frames/{f.name}" for f in sorted(frames_dir.glob("*.jpg"))]
        else:
            task['slides'] = []
            
        return task
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tasks/{task_id}/artifacts")
async def get_task_artifacts(task_id: str):
    """Fetches the heavy payload artifacts for a specific task."""
    try:
        res = supabase.table("task_artifacts").select("*").eq("task_id", task_id).execute()
        if not res.data:
            return {}
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/settings")
async def get_settings(user_id: str):
    """Fetches user-specific settings from Supabase."""
    try:
        res = supabase.table("user_configs").select("groq_api_key").eq("user_id", user_id).execute()
        if res.data:
            return res.data[0]
        return {"groq_api_key": ""}
    except Exception as e:
        print(f"❌ Settings Fetch Error: {e}")
        return {"groq_api_key": ""}

@router.post("/settings")
async def save_settings(
    user_id: str = Form(...),
    groq_api_key: str = Form(...)
):
    """Persists user-specific settings like API keys in Supabase."""
    try:
        # Upsert logic: Update if user_id exists, else insert
        res = supabase.table("user_configs").upsert({
            "user_id": user_id,
            "groq_api_key": groq_api_key
        }).execute()
        return {"success": True, "message": "Settings updated safely."}
    except Exception as e:
        print(f"❌ Settings Save Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to persist configuration.")

# ============================================================
# BACKGROUND WORKER
# ============================================================
async def process_video_task(
    task_id: str, 
    input_type: str, 
    source_value: str, 
    target_lang: str
):
    print(f"🚀 Starting Task {task_id}")
    supabase.table("video_tasks").update({"status": "processing"}).eq("id", task_id).execute()

    audio_path = ""
    try:
        title = "Unknown"
        transcript_text = None

        # --- STEP 0: FETCH USER CONFIG (Safe Path) ---
        user_key = None
        try:
            res_task = supabase.table("video_tasks").select("user_id").eq("id", task_id).execute()
            u_id = res_task.data[0]['user_id'] if res_task.data else None
            
            if u_id:
                res_config = supabase.table("user_configs").select("groq_api_key").eq("user_id", u_id).execute()
                if res_config.data:
                    user_key = res_config.data[0].get('groq_api_key')
                    print(f"   🔑 Using user-provided API key for {u_id}")
        except Exception as e:
            # Handle scenario where user_configs table might be missing or network error
            print(f"   ⚠️ Could not fetch user config: {e}. Defaulting to system key.")

        # --- STEP 1: INGESTION ---
        if input_type == "youtube":
            title, audio_path, transcript_text = download_youtube_audio(source_value, task_id)
        elif input_type == "file":
            title, audio_path = process_local_audio(source_value, task_id)

        # --- STEP 2: TRANSCRIPTION ---
        if not transcript_text:
            if not audio_path or not os.path.exists(audio_path):
                raise Exception("No audio file to process")
            print(f"🎙️ Transcribing {title}...")
            # Transcription now uses user key if available
            transcript_text = await get_transcript_async(audio_path, api_key=user_key)
        
        if not transcript_text or len(transcript_text.strip()) < 50:
            raise Exception("Transcript is empty or audio is silent")

        # --- STEP 3: INTELLIGENCE ---
        print(f"\n🔹 Step 2: Parallel Intelligence...")
        
        # Auto-detect video type
        v_type = await detect_video_type(transcript_text, api_key=user_key)
        print(f"   🧠 Detected Type: {v_type}")

        # Launch parallel tasks
        task_report = generate_report_async(transcript_text, v_type, api_key=user_key)
        task_trans = translate_transcript_async(transcript_text, target_lang, api_key=user_key)
        
        task_quiz = None
        if v_type in ["LECTURE", "TUTORIAL"]:
            task_quiz = generate_quiz_async(transcript_text, target_lang, api_key=user_key)
        
        # --- STEP 4: VISUAL INTELLIGENCE ---
        project_folder = f"output/{task_id}"
        os.makedirs(project_folder, exist_ok=True)
        visual_task = None
        if input_type == "youtube":
            visual_task = asyncio.to_thread(extract_yt_frames, source_value, project_folder)
        elif input_type == "file" and source_value.lower().endswith(('.mp4', '.mkv', '.mov', '.avi')):
            local_path = f"{INPUT_DIR}/{source_value}"
            visual_task = asyncio.to_thread(extract_frames, local_path, project_folder)

        # Wait for results
        active_tasks = [task_report, task_trans]
        if task_quiz: active_tasks.append(task_quiz)
        if visual_task: active_tasks.append(visual_task)
        
        results = await asyncio.gather(*active_tasks)
        analysis_json = results[0]
        
        translated_text = results[1] # Original translate_transcript_async result
        # Inject translated transcript safely into JSON to avoid DB schema migration
        analysis_json["translated_transcript"] = translated_text
        
        quiz_json = results[2] if task_quiz else None
        
        # Translate the analysis report
        markdown_report = await translate_report_async(analysis_json, target_lang, v_type, api_key=user_key)

        # --- STEP 5: FINALIZE ---
        print(f"\n🔹 Step 3: Finalizing...")
        english_md = dict_to_md(analysis_json)
        final_md = f"# {analysis_json.get('title', title)}\n**Type:** {v_type} | **Language:** {target_lang}\n\n## 🇬🇧 English Notes\n{english_md}\n\n## 🚩 {target_lang} Notes\n{markdown_report}"
        
        # Generate PDF
        print(f"📄 Generating PDF for {title}...")
        pdf_url = generate_pdf(task_id, title, final_md, quiz_json, target_lang)

        # --- STEP 6: DB UPDATE (SUCCESS) ---
        # Update Metadata
        supabase.table("video_tasks").update({
            "status": "completed",
            "title": title,
            "content_category": v_type
        }).eq("id", task_id).execute()

        # Update Payloads
        supabase.table("task_artifacts").upsert({
            "task_id": task_id,
            "raw_transcript": transcript_text,
            "video_duration": 0, # Placeholder for now
            "report_json": analysis_json,
            "quiz_json": quiz_json,
            "report_markdown": markdown_report,
            "pdf_url": pdf_url 
        }).execute()

        print(f"✅ Task {task_id} Completed")

    except Exception as e:
        print(f"❌ Task {task_id} Failed: {e}")
        supabase.table("video_tasks").update({"status": "failed", "error_msg": str(e)}).eq("id", task_id).execute()
    finally:
        # Cleanup temporary audio
        cleanup_assets(task_id, audio_path)


# ============================================================
# ENDPOINTS
# ============================================================

@router.post("/youtube", response_model=TaskResponse)
async def analyze_youtube(
    background_tasks: BackgroundTasks,
    url: str = Form(...),
    language: str = Form("Tamil"),
    user_id: str = Form(...)
):
    try:
        print(f"📥 Received YouTube Task: {url} for user {user_id}")
        
        # FIX: Fetch title quickly BEFORE creating task to avoid "Handshake" placeholder
        video_title = get_youtube_title_quick(url)
        
        res = supabase.table("video_tasks").insert({
            "user_id": user_id,
            "source_type": "youtube",
            "source_url": url,
            "language": language,
            "status": "pending",
            "title": video_title
        }).execute()
        
        task_id = res.data[0]['id']
        
        background_tasks.add_task(
            process_video_task, 
            task_id, "youtube", url, language
        )
        
        return TaskResponse(task_id=task_id, message="Analysis pipeline engaged.")
    except Exception as e:
        print(f"❌ API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/file", response_model=TaskResponse)
async def analyze_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    language: str = Form("Tamil"),
    user_id: str = Form(...)
):
    try:
        file_ext = file.filename.split('.')[-1]
        safe_filename = f"{uuid.uuid4()}.{file_ext}"
        
        ensure_input_folder()
        file_path = f"{INPUT_DIR}/{safe_filename}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        res = supabase.table("video_tasks").insert({
            "user_id": user_id,
            "source_type": "file",
            "source_url": safe_filename,
            "title": file.filename, 
            "language": language,
            "status": "pending"
        }).execute()
        
        task_id = res.data[0]['id']
        
        background_tasks.add_task(
            process_video_task, 
            task_id, "file", safe_filename, language
        )
        
        return TaskResponse(task_id=task_id, message="Ingestion complete. Node processing started.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/validate-groq")
async def validate_groq_key(api_key: str = Form(...)):
    """Validates a provided Groq API key."""
    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        client.models.list()
        return {
            "valid": True, 
            "message": "Groq Cloud connection established.",
            "status": "ready"
        }
    except Exception as e:
        error_msg = str(e).lower()
        if "401" in error_msg or "unauthorized" in error_msg:
            detail = "Authentication failed: Key is invalid."
        elif "rate" in error_msg:
            detail = "Connection blocked: Rate limits exceeded."
        else:
            detail = f"Handshake failed: {str(e)}"
        
        raise HTTPException(status_code=400, detail=detail)

@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    """Permanently deletes a task and all its associated assets."""
    try:
        # 1. Delete from Supabase (Cascade will handle artifacts if configured)
        supabase.table("video_tasks").delete().eq("id", task_id).execute()
        
        # 2. Delete physical assets (output folder)
        project_folder = Path(f"output/{task_id}")
        if project_folder.exists() and project_folder.is_dir():
            shutil.rmtree(project_folder)
            
        print(f"🗑️ Task {task_id} and assets purged.")
        return {"success": True, "message": f"Task {task_id} purged from system."}
    except Exception as e:
        print(f"❌ Deletion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
