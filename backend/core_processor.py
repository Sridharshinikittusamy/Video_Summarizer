import os
import json
import re
import asyncio
import shutil
from pathlib import Path
from dotenv import load_dotenv
from groq import AsyncGroq
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter
from pytubefix import YouTube
from pydub import AudioSegment
import markdown
from weasyprint import HTML, CSS
from supabase import create_client, Client

# Load Env
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") # Use Service Role Key for Backend

async_client = AsyncGroq(api_key=GROQ_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
GROQ_SEMAPHORE = asyncio.Semaphore(3)

INPUT_DIR = "input"
OUTPUT_DIR = "output"

# --- HELPER FUNCTIONS (Kept same as your optimized version) ---
def ensure_folders():
    Path(INPUT_DIR).mkdir(exist_ok=True)
    Path(OUTPUT_DIR).mkdir(exist_ok=True)

def sanitize_filename(name):
    clean = re.sub(r'[^\w\s-]', '', name)
    return clean.strip()[:50]

def extract_video_id(url):
    patterns = [r'(?:v=|\/)([0-9A-Za-z_-]{11}).*', r'^([0-9A-Za-z_-]{11})$']
    for pattern in patterns:
        match = re.search(pattern, url)
        if match: return match.group(1)
    return None

def convert_to_mp3(input_path, output_path):
    """Robust FFmpeg conversion."""
    import subprocess
    is_same_file = os.path.abspath(input_path) == os.path.abspath(output_path)
    final_output = str(Path(output_path).with_suffix('.temp.mp3')) if is_same_file else output_path

    try:
        cmd = ["ffmpeg", "-i", input_path, "-vn", "-acodec", "libmp3lame", "-ar", "44100", "-y", final_output]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        if is_same_file: shutil.move(final_output, output_path)
        return True
    except Exception as e:
        print(f"Error converting: {e}")
        if is_same_file and os.path.exists(final_output): os.remove(final_output)
        return False

# --- ASYNC TRANSCRIPTION & AI (Your Existing Logic) ---
async def get_transcript_async(audio_path):
    # ... (Your existing robust chunking logic here) ...
    # For brevity in this answer, imagine your FULL get_transcript_async code is here.
    # It must handle the checking file size and splitting.
    file_size_mb = os.path.getsize(audio_path) / (1024 * 1024)
    if file_size_mb < 20:
        async with GROQ_SEMAPHORE:
            with open(audio_path, "rb") as f:
                res = await async_client.audio.transcriptions.create(file=(audio_path, f.read()), model="whisper-large-v3", response_format="verbose_json")
            return res.text
    else:
        # Simplified for brevity - insert your full split logic here
        return "TRANSCRIPT_PLACEHOLDER_FOR_LONG_FILE" 

# --- PROMPT ENGINE (Your Existing Logic) ---
def get_system_prompt(video_type):
    # ... (Your existing prompt logic) ...
    base_instruction = "You are analyzing a transcript. You MUST output the JSON values STRICTLY IN ENGLISH."
    if video_type == "NEWS":
        # ... Insert your full NEWS prompt structure ...
        return base_instruction, "{}" 
    return base_instruction, "{}"

async def generate_report_async(text, video_type):
    sys_msg, structure = get_system_prompt(video_type)
    async with GROQ_SEMAPHORE:
        res = await async_client.chat.completions.create(
            messages=[{"role": "system", "content": f"{sys_msg}\nReturn JSON: {structure}"}, {"role": "user", "content": text[:30000]}],
            model="llama-3.3-70b-versatile", response_format={"type": "json_object"}
        )
    return json.loads(res.choices[0].message.content)

async def translate_report_async(english_json, target_lang, video_type):
    # ... (Your logic) ...
    return "# Translated Report"

def dict_to_md(data):
    # ... (Your logic) ...
    return "Markdown String"

def generate_pdf(project_folder, md_content, lang):
    pdf_path = f"{project_folder}/Report.pdf"
    css = CSS(string='@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;700&display=swap"); body { font-family: "Noto Sans Tamil", sans-serif; }')
    HTML(string=markdown.markdown(md_content, extensions=['tables'])).write_pdf(pdf_path, stylesheets=[css])
    return "Report.pdf"

# --- MAIN API WORKER ---

async def process_video_task(task_id: str, input_type: str, source_value: str, target_lang: str):
    """
    This function runs in the background.
    """
    print(f"🚀 Starting Task {task_id}")
    ensure_folders()
    
    # Update DB: Processing
    supabase.table("tasks").update({"status": "processing"}).eq("id", task_id).execute()

    try:
        title = "Unknown"
        audio_path = f"{INPUT_DIR}/{task_id}.mp3"

        # 1. INGESTION
        if input_type == "youtube":
            try:
                video_id = extract_video_id(source_value)
                yt = YouTube(source_value)
                title = sanitize_filename(yt.title)
                stream = yt.streams.get_audio_only()
                raw_path = stream.download(output_path=INPUT_DIR, filename=f"raw_{task_id}")
                convert_to_mp3(raw_path, audio_path)
                os.remove(raw_path)
            except Exception as e:
                raise Exception(f"Download failed: {str(e)}")

        elif input_type == "file":
            # The file is already uploaded to input/source_value by the API route
            local_path = f"{INPUT_DIR}/{source_value}"
            title = sanitize_filename(Path(source_value).stem)
            convert_to_mp3(local_path, audio_path)

        # 2. TRANSCRIPTION
        transcript_text = await get_transcript_async(audio_path)
        if not transcript_text or len(transcript_text) < 50:
            raise Exception("Transcript empty or silent audio")

        # 3. ANALYSIS
        # Detect Type
        v_type = "GENERAL" # Simplified, add your classifier logic back here
        
        # Reports
        analysis_json = await generate_report_async(transcript_text, v_type)
        md_report = await translate_report_async(analysis_json, target_lang, v_type)
        
        # 4. OUTPUT
        project_folder = f"{OUTPUT_DIR}/{task_id}"
        Path(project_folder).mkdir(parents=True, exist_ok=True)
        
        final_md = f"# {title}\n{md_report}" # Simplify for example
        generate_pdf(project_folder, final_md, target_lang)

        # 5. DB UPDATE (SUCCESS)
        # Store results in Supabase
        supabase.table("tasks").update({
            "status": "completed",
            "title": title,
            "report_json": analysis_json,
            "pdf_url": f"/static/{task_id}/Report.pdf" 
        }).eq("id", task_id).execute()

        print(f"✅ Task {task_id} Completed")

    except Exception as e:
        print(f"❌ Task {task_id} Failed: {e}")
        supabase.table("tasks").update({"status": "failed"}).eq("id", task_id).execute()