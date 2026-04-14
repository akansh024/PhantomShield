import sys
sys.path.append(r"d:\VsCode\PhantomShield")
from pymongo import MongoClient
from app.core.config import get_settings

def main():
    settings = get_settings()
    uri = settings.mongodb_uri
    client = MongoClient(uri)
    db = client[settings.mongodb_db_name]
    sessions = db["sessions"]
    forensics = db["forensic_events"]

    latest_sessions = list(sessions.find().sort("created_at", -1).limit(5))
    
    for s in latest_sessions:
        print("Session ID:", s["session_id"])
        print("Created At:", s.get("created_at"))
        print("Test?", s.get("is_test"))
        
        events = list(forensics.find({"session_id": s["session_id"]}).sort("timestamp", 1))
        print("Events:", len(events))
        for e in events:
            print("  - Action:", e.get("action"), "Route:", e.get("route"))
        print("-" * 40)

if __name__ == "__main__":
    main()
