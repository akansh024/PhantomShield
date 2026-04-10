"""
PhantomShield - Clean Test Sessions Migration Script
Marks old sessions and local testing sessions as test data, hiding them from the default dashboard.
"""

import sys
import os
from datetime import datetime

# Add root project path to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pymongo import MongoClient
from app.core.config import get_settings

def migrate_sessions():
    print("Starting session cleanup migration...")
    settings = get_settings()
    if not settings.mongodb_uri:
        print("Error: MONGODB_URI not set.")
        return

    client = MongoClient(settings.mongodb_uri)
    db = client[settings.mongodb_db_name]
    sessions_coll = db[settings.mongodb_sessions_collection]
    forensics_coll = db[settings.mongodb_forensic_collection]

    # Deployment timestamp is roughly now. 
    # Any sessions created before this are considered development noise.
    deployment_timestamp = datetime.utcnow()
    
    print(f"Deployment timestamp for migration cutoff: {deployment_timestamp.isoformat()}Z")

    # We update sessions in two batches or with an aggregation if needed.
    # 1. Update all sessions created before deployment timestamp
    result_time = sessions_coll.update_many(
        {"created_at": {"$lt": deployment_timestamp}},
        {"$set": {"is_test": True}}
    )
    print(f"Marked {result_time.modified_count} sessions as test (Created before deployment).")

    # 2. Update sessions that came from localhost (by looking at forensics)
    # Since sessions themselves do not store IP, we look up localhost forensics.
    local_forensics = forensics_coll.find(
        {"client_ip": {"$in": ["127.0.0.1", "::1", "localhost"]}},
        {"session_id": 1}
    )
    local_session_ids = list(set([doc["session_id"] for doc in local_forensics if "session_id" in doc]))
    
    if local_session_ids:
        result_local = sessions_coll.update_many(
            {"session_id": {"$in": local_session_ids}, "is_test": {"$ne": True}},
            {"$set": {"is_test": True}}
        )
        print(f"Marked {result_local.modified_count} sessions as test (Localhost IP detected).")
    else:
        print("No additional localhost sessions found to mark.")

    print("Migration complete.")

if __name__ == "__main__":
    migrate_sessions()
