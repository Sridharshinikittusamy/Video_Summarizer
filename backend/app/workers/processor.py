import asyncio
import os
import uuid
from celery import shared_task
from app.db.supabase_client import supabase
from app.core.security import decrypt_key
from app.services.audio_service import download_youtube_audio, process_local_audio, cleanup_assets
from app.services.transcription_service import get_transcript_async
from app.services.summarizer_service import detect_video_type, generate_report_async, translate_transcript_async, generate_quiz_async, translate_report_async, dict_to_md
from app.services.pdf_service import generate_pdf

def run_async(coro):
    """Helper to run async code in sync celery worker."""
    loop = asyncio.get_event_loop()
    if loop.is_running():
        return asyncio.ensure_future(coro)
    return asyncio.run(coro)

@shared_task(name="app.workers.processor.process_video_task_celery")
def process_video_task_celery(task_id: str, input_type: str, source_value: str, target_lang: str):
    """
    Distributed Celery task for video intelligence processing.
    """
    print(f"🚀 [CELERY] Starting Task {task_id}")
    
    # Run the core logic in an async wrapper
    return run_async(_process_video_logic(task_id, input_type, source_value, target_lang))

async def _process_video_logic(task_id: str, input_type: str, source_value: str, target_lang: str):
    supabase.table("video_tasks").update({"status": "processing"}).eq("id", task_id).execute()

    audio_path = ""
    try:
        title = "Unknown"
        transcript_text = None

        # --- STEP 0: FETCH USER CONFIG ---
        user_key = None
        try:
            res_task = supabase.table("video_tasks").select("user_id").eq("id", task_id).execute()
            u_id = res_task.data[0]['user_id'] if res_task.data else None
            
            if u_id:
                res_config = supabase.table("user_configs").select("groq_api_key").eq("user_id", u_id).execute()
                if res_config.data:
                    encrypted_user_key = res_config.data[0].get('groq_api_key')
                    if encrypted_user_key:
                        user_key = decrypt_key(encrypted_user_key)
        except Exception as e:
            print(f"   ⚠️ [WORKER] Config fetch failed: {e}")

        # --- STEP 1: INGESTION ---
        if input_type == "youtube":
            title, audio_path, transcript_text = download_youtube_audio(source_value, task_id)
        elif input_type == "file":
            title, audio_path = process_local_audio(source_value, task_id)

        # --- STEP 2: TRANSCRIPTION ---
        if not transcript_text:
            if not audio_path or not os.path.exists(audio_path):
                raise Exception("No audio file found on disk for worker to process")
            print(f"🎙️ [WORKER] Transcribing {title}...")
            transcript_text = await get_transcript_async(audio_path, api_key=user_key)
        
        if not transcript_text or len(transcript_text.strip()) < 50:
            raise Exception("Transcript is empty or audio is silent")

        # --- STEP 3: INTELLIGENCE ---
        print(f"🧠 [WORKER] Generating Intelligence...")
        v_type = await detect_video_type(transcript_text, api_key=user_key)
        
        task_report = generate_report_async(transcript_text, v_type, api_key=user_key)
        task_english_trans = translate_transcript_async(transcript_text, "English", api_key=user_key)
        
        task_quiz = None
        if v_type in ["LECTURE", "TUTORIAL"]:
            task_quiz = generate_quiz_async(transcript_text, target_lang, api_key=user_key)
        
        results = await asyncio.gather(*[t for t in [task_report, task_english_trans, task_quiz] if t])
        analysis_json = results[0]
        analysis_json["english_transcript"] = results[1]
        quiz_json = results[2] if task_quiz else None
        
        markdown_report = await translate_report_async(analysis_json, target_lang, v_type, api_key=user_key)

        # --- STEP 5: FINALIZE ---
        english_md = dict_to_md(analysis_json)
        final_md = f"# {analysis_json.get('title', title)}\n**Type:** {v_type} | **Language:** {target_lang}\n\n## 🇬🇧 English Notes\n{english_md}\n\n## 🚩 {target_lang} Notes\n{markdown_report}"
        
        pdf_url = generate_pdf(task_id, title, final_md, quiz_json, target_lang)

        # --- STEP 6: DB UPDATE ---
        supabase.table("video_tasks").update({
            "status": "completed",
            "title": title,
            "content_category": v_type
        }).eq("id", task_id).execute()

        supabase.table("task_artifacts").upsert({
            "task_id": task_id,
            "raw_transcript": transcript_text,
            "report_json": analysis_json,
            "quiz_json": quiz_json,
            "report_markdown": markdown_report,
            "pdf_url": pdf_url 
        }).execute()

        print(f"✅ [WORKER] Task {task_id} Completed")

    except Exception as e:
        print(f"❌ [WORKER] Task {task_id} Failed: {e}")
        supabase.table("video_tasks").update({"status": "failed", "error_msg": str(e)}).eq("id", task_id).execute()
    finally:
        cleanup_assets(task_id, audio_path)
