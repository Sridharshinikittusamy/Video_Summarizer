from app.db.supabase_client import supabase
import json

def test_supabase():
    try:
        print("🔍 Deep inspection of tasks...")
        res = supabase.table("tasks").select("*").order("created_at", desc=True).limit(5).execute()
        print(f"✅ Tasks found: {len(res.data)}")
        for i, task in enumerate(res.data):
            print(f"--- Task {i} ---")
            print(f"ID: {task['id']}")
            print(f"User ID: {task['user_id']}")
            print(f"Status: {task['status']}")
            print(f"Title: {task.get('title')}")
            print(f"Input Type: {task.get('input_type')}")
            print(f"Source: {task.get('source_url')}")
            print(f"Error: {task.get('error_msg')}")
            print(f"Created: {task['created_at']}")
            
        print("\n🔍 Checking user_configs table...")
        try:
            res_config = supabase.table("user_configs").select("*").execute()
            print(f"✅ user_configs found: {len(res_config.data)}")
            for config in res_config.data:
                print(f"User: {config['user_id']}, Has Key: {'Yes' if config.get('groq_api_key') else 'No'}")
        except Exception as e:
            print(f"⚠️ user_configs table error (might not exist): {e}")

    except Exception as e:
        print(f"❌ Supabase error: {e}")

if __name__ == "__main__":
    test_supabase()
