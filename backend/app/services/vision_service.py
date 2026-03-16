import os
import subprocess
from pathlib import Path
from pytubefix import YouTube

INPUT_DIR = "input"

def extract_frames(video_path: str, output_dir: str):
    """Extracts 1 frame every 45 seconds from a local video file."""
    print(f"   🖼️  Extracting Slides from {Path(video_path).name}...")
    frames_dir = os.path.join(output_dir, "frames")
    Path(frames_dir).mkdir(parents=True, exist_ok=True)
    try:
        # -vf: fps=1/45 extracts 1 frame every 45s
        # -q:v 2 ensures high quality JPG
        subprocess.run(
            ["ffmpeg", "-i", video_path, "-vf", "fps=1/45", "-q:v", "2", f"{frames_dir}/slide_%03d.jpg"], 
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        print(f"   ✅ {len(os.listdir(frames_dir))} Slides Extracted.")
    except Exception as e:
        print(f"   ⚠️  Slide extraction failed: {e}")

def extract_yt_frames(url: str, output_dir: str):
    """Downloads a temporary low-res stream to extract slides for YouTube videos."""
    print("   🖼️  Extracting Slides (YouTube)...")
    frames_dir = os.path.join(output_dir, "frames")
    Path(frames_dir).mkdir(parents=True, exist_ok=True)
    
    temp_vid_path = os.path.join(INPUT_DIR, f"temp_yt_{os.getpid()}.mp4")
    
    try:
        yt = YouTube(url)
        # Use 360p for fast download since we only need static frames
        stream = yt.streams.filter(res="360p", progressive=True).first()
        if stream:
            v_path = stream.download(output_path=INPUT_DIR, filename=Path(temp_vid_path).name)
            
            # Extract frames
            subprocess.run(
                ["ffmpeg", "-i", v_path, "-vf", "fps=1/45", "-q:v", "2", f"{frames_dir}/slide_%03d.jpg"], 
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
            )
            
            # Cleanup temp video
            if os.path.exists(v_path): 
                os.remove(v_path)
            print(f"   ✅ {len(os.listdir(frames_dir))} Slides Extracted.")
    except Exception as e:
        print(f"   ⚠️  YouTube Slide extraction failed: {e}")
        if os.path.exists(temp_vid_path):
            os.remove(temp_vid_path)
