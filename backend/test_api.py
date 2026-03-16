import os
from dotenv import load_dotenv
from groq import Groq
from youtube_transcript_api import YouTubeTranscriptApi
import json

load_dotenv()

def test_groq():
    print("--- Testing Groq API ---")
    key = os.getenv("GROQ_API_KEY")
    if not key:
        print("❌ No GROQ_API_KEY found")
        return
    
    try:
        client = Groq(api_key=key)
        res = client.chat.completions.create(
            messages=[{"role": "user", "content": "Say hello!"}],
            model="llama-3.3-70b-versatile",
            max_tokens=10
        )
        print(f"✅ Groq Success: {res.choices[0].message.content}")
    except Exception as e:
        print(f"❌ Groq Failed: {e}")

def test_transcript():
    print("\n--- Testing YouTubeTranscriptApi ---")
    video_id = "vkhjO7fc78g" # The one from the logs
    try:
        print(f"Imported YouTubeTranscriptApi: {YouTubeTranscriptApi}")
        print(f"Methods: {dir(YouTubeTranscriptApi)}")
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        print(f"✅ Transcript Success: {len(transcript)} lines")
    except Exception as e:
        print(f"❌ Transcript Failed: {e}")

if __name__ == "__main__":
    test_groq()
    test_transcript()
