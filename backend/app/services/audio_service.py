from pathlib import Path
from pytubefix import YouTube
from pytubefix.cli import on_progress
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter
import subprocess
from app.db.supabase_client import supabase

INPUT_DIR = "input"
BUCKET_NAME = "project-files"

def ensure_input_folder():
    Path(INPUT_DIR).mkdir(exist_ok=True)

def upload_to_supabase(local_path: str, storage_path: str):
    """Uploads a local file to Supabase storage and removes the local copy."""
    try:
        with open(local_path, 'rb') as f:
            supabase.storage.from_(BUCKET_NAME).upload(
                path=storage_path,
                file=f,
                file_options={"content-type": "audio/mpeg", "x-upsert": "true"}
            )
        print(f"   ☁️ Uploaded {local_path} to Supabase Storage: {storage_path}")
        if os.path.exists(local_path):
            os.remove(local_path)
    except Exception as e:
        print(f"   ⚠️ Supabase Upload Failed: {e}")
        # Even if cloud fails, we keep the local file as fallback for this process
        pass

def sanitize_filename(name: str) -> str:
    clean = re.sub(r'[^\w\s-]', '', name)
    return clean.strip()[:50]

def get_youtube_title_quick(url: str) -> str:
    """Fetches the title of a YouTube video quickly without downloading."""
    try:
        yt = YouTube(url)
        return sanitize_filename(yt.title)
    except Exception as e:
        print(f"   ⚠️ Quick title fetch failed: {e}")
        return "YouTube Video"

def extract_video_id(url: str) -> str | None:
    patterns = [r'(?:v=|\/|youtu\.be\/)([0-9A-Za-z_-]{11}).*', r'^([0-9A-Za-z_-]{11})$']
    for pattern in patterns:
        match = re.search(pattern, url)
        if match: return match.group(1)
    return None

def convert_to_mp3(input_path: str, output_path: str) -> bool:
    """Robust FFmpeg conversion. Safe against overwriting (uses temp file)."""
    is_same_file = os.path.abspath(input_path) == os.path.abspath(output_path)
    final_output = str(Path(output_path).with_suffix('.temp.mp3')) if is_same_file else output_path

    try:
        cmd = ["ffmpeg", "-i", input_path, "-vn", "-acodec", "libmp3lame", "-ar", "44100", "-y", final_output]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        if is_same_file: shutil.move(final_output, output_path)
        return True
    except Exception as e:
        print(f"   ❌ FFmpeg Conversion Failed: {e}")
        if is_same_file and os.path.exists(final_output): os.remove(final_output)
        return False

def download_youtube_audio(url: str, task_id: str) -> tuple[str, str, str | None]:
    """
    Downloads audio from YouTube.
    Returns (title, audio_path, transcript_text_or_None).
    
    CRITICAL: Tries YouTubeTranscriptApi FIRST (fast, no download).
    Only falls back to pytubefix audio download if transcript API fails.
    This is the EXACT logic from the original core_processor.py.
    """
    ensure_input_folder()
    video_id = extract_video_id(url)
    if not video_id:
        raise Exception(f"Could not extract video ID from URL: {url}")
    
    title = video_id
    audio_path = f"{INPUT_DIR}/{task_id}.mp3"
    transcript_text = None

    # --- STRATEGY 1: Try Transcript API First (Fast Path) ---
    try:
        print(f"   📝 Trying YouTube Transcript API for {video_id}...")
        # YouTubeTranscriptApi.get_transcript(video_id) sometimes fails due to property issues
        # list_transcripts() is more robust for finding available langs
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        try:
            # Try a broad array of common languages first
            common_langs = ['en', 'ta', 'hi', 'te', 'ml', 'kn', 'mr', 'gu', 'bn', 'fr', 'es', 'de', 'ja', 'ko', 'ru', 'pt', 'ar', 'zh', 'it', 'nl']
            transcript = transcript_list.find_transcript(common_langs)
        except Exception:
            # Fallback: grab the first available transcript regardless of language
            available_langs = [t.language_code for t in transcript_list]
            transcript = transcript_list.find_transcript(available_langs)

        transcript_text = TextFormatter().format_transcript(transcript.fetch())
        print("   ✅ Transcript API Success.")
        try:
            yt = YouTube(url)
            title = sanitize_filename(yt.title)
        except:
            pass
        return title, audio_path, transcript_text
    except Exception as e:
        print(f"   ⚠️ Transcript API failed ({e}). Falling back to audio download...")

    # --- STRATEGY 2: Download Audio via pytubefix ---
    try:
        print("   ⬇️ Downloading Audio...")
        yt = YouTube(url, on_progress_callback=on_progress)
        title = sanitize_filename(yt.title)
        stream = yt.streams.get_audio_only()
        raw_path = stream.download(output_path=INPUT_DIR, filename_prefix=f"raw_{task_id}_")
        if not convert_to_mp3(raw_path, audio_path):
            raise Exception("FFmpeg conversion failed")
        if os.path.exists(raw_path):
            os.remove(raw_path)
        
        # Cloud Sync
        storage_path = f"audio/{task_id}.mp3"
        upload_to_supabase(audio_path, storage_path)
        
        return title, storage_path, None  # No pre-fetched transcript
    except Exception as e:
        raise Exception(f"YouTube download failed: {e}")

def process_local_audio(source_value: str, task_id: str) -> tuple[str, str]:
    """Processes locally uploaded file and returns (title, audio_path)."""
    ensure_input_folder()
    local_path = f"{INPUT_DIR}/{source_value}"
    title = sanitize_filename(Path(source_value).stem)
    audio_path = f"{INPUT_DIR}/{task_id}.mp3"
    convert_to_mp3(local_path, audio_path)
    
    # Cloud Sync
    storage_path = f"audio/{task_id}.mp3"
    upload_to_supabase(audio_path, storage_path)
    
    if os.path.exists(local_path):
        os.remove(local_path)
    
    return title, storage_path
