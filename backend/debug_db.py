import sqlite3
import json

def check_db():
    try:
        conn = sqlite3.connect('tasks.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tasks ORDER BY created_at DESC LIMIT 5")
        rows = cursor.fetchall()
        print(f"Total tasks in SQLite: {len(rows)}")
        for i, row in enumerate(rows):
            print(f"Task {i}: ID={row['id']}, Status={row['status']}, Title={row['title']}, Created={row['created_at']}")
        conn.close()
    except Exception as e:
        print(f"Error reading DB: {e}")

if __name__ == "__main__":
    check_db()
