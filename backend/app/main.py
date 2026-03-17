from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.routers import tasks
from app.db.supabase_client import supabase
from pathlib import Path

app = FastAPI(title="Multipurpose Video Summarizer API", version="2.0.0")

# --- STARTUP HANDLER ---
@app.on_event("startup")
async def startup_event():
    """Cleans up tasks that were interrupted by a server crash/restart."""
    try:
        print("🔍 Checking for interrupted tasks...")
        res = supabase.table("video_tasks").update({
            "status": "failed", 
            "error_msg": "Server node was interrupted during processing. Please try again."
        }).in_("status", ["processing", "pending"]).execute()
        if res.data:
            print(f"🧹 Cleaned up {len(res.data)} stale tasks.")
    except Exception as e:
        print(f"⚠️ Startup cleanup skipped: {e}")

# --- CORS SETUP ---
from app.core.config import settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],  # Restrict this in true production environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- STATIC FILES ---
# Ensure output directory exists before mounting
Path("output").mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory="output"), name="static")

# --- ROUTERS ---
app.include_router(tasks.router)

@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Video Summarizer API is ONLINE",
        "health_check": "/health",
        "docs": "/docs"
    }

from fastapi import HTTPException
@app.get("/health", tags=["Health"])
def health_check():
    try:
        # Lightweight ping to Supabase to verify DB health
        supabase.table("video_tasks").select("id").limit(1).execute()
        return {"status": "ok", "service": "Multipurpose Video Summarizer API", "database": "connected"}
    except Exception as e:
        print(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Database connection failed")
