import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
# CRITICAL: Use the SERVICE_ROLE key for the backend so it can bypass RLS 
# (Row Level Security) and update tasks for any user.
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("❌ Supabase credentials missing in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)