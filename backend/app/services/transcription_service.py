import os
import asyncio
from groq import AsyncGroq
from pydub import AudioSegment
from app.core.config import settings

# Shared default client
default_client = AsyncGroq(api_key=settings.GROQ_API_KEY)
GROQ_SEMAPHORE = asyncio.Semaphore(3)  # Rate Limit Protector

def get_client(api_key: str = None) -> AsyncGroq:
    """Returns a Groq client for the given key, or the system default."""
    if api_key and api_key.strip():
        return AsyncGroq(api_key=api_key)
    return default_client

# --- CHUNK TRANSCRIPTION ---
async def transcribe_chunk_async(chunk_path, chunk_index, total_chunks, api_key: str = None):
    client = get_client(api_key)
    async with GROQ_SEMAPHORE:
        print(f"   🎤 Processing Chunk {chunk_index + 1}/{total_chunks}...")
        try:
            with open(chunk_path, "rb") as f:
                transcription = await client.audio.transcriptions.create(
                    file=(chunk_path, f.read()), model="whisper-large-v3", response_format="verbose_json"
                )
            return chunk_index, transcription.text
        except Exception as e:
            print(f"   ❌ Error Chunk {chunk_index}: {e}")
            return chunk_index, ""

# --- MAIN TRANSCRIPTION ENGINE ---
async def get_transcript_async(audio_path: str, api_key: str = None) -> str:
    """Handles Chunking automatically for ANY input."""
    client = get_client(api_key)
    file_size_mb = os.path.getsize(audio_path) / (1024 * 1024)
    
    if file_size_mb < 20:
        print(f"   🎤 Transcribing (Single File: {round(file_size_mb,1)}MB)...")
        async with GROQ_SEMAPHORE:
            with open(audio_path, "rb") as f:
                res = await client.audio.transcriptions.create(
                    file=(audio_path, f.read()), model="whisper-large-v3", response_format="verbose_json"
                )
            return res.text
    else:
        # Parallel Chunking Logic
        print(f"   ✂️ File is Large ({round(file_size_mb,1)}MB). Splitting...")
        loop = asyncio.get_running_loop()
        def split_audio():
            song = AudioSegment.from_mp3(audio_path)
            TEN_MINUTES = 10 * 60 * 1000
            return [song[i:i+TEN_MINUTES] for i in range(0, len(song), TEN_MINUTES)]

        chunks = await loop.run_in_executor(None, split_audio)
        print(f"   📊 Created {len(chunks)} Chunks. Parallelizing...")
        
        tasks = []
        temp_files = []
        for i, chunk in enumerate(chunks):
            chunk_name = f"{audio_path}_part{i}.mp3"
            chunk.export(chunk_name, format="mp3")
            temp_files.append(chunk_name)
            tasks.append(transcribe_chunk_async(chunk_name, i, len(chunks), api_key))
        
        results = await asyncio.gather(*tasks)
        for f_path in temp_files:
            if os.path.exists(f_path): os.remove(f_path)
        results.sort(key=lambda x: x[0])
        return " ".join([r[1] for r in results])
