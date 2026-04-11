"""
PhantomShield session hygiene script.

Purpose:
- Archive local/testing sessions so the default dashboard only shows live production traffic.
- Keep archived data accessible through explicit test/archived filters.

Usage:
- Dry run (default): `python scripts/clean_sessions.py`
- Apply changes: `python scripts/clean_sessions.py --apply`
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from datetime import datetime, timedelta, timezone

from pymongo import MongoClient

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import get_settings

_LOCAL_HOST_PATTERN = re.compile(r"(localhost|127\.0\.0\.1|::1)", re.IGNORECASE)


def _utc_iso(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Archive local/testing sessions for clean dashboard telemetry.")
    parser.add_argument("--apply", action="store_true", help="Apply updates. Default is dry-run.")
    parser.add_argument(
        "--stale-hours",
        type=int,
        default=72,
        help="Mark anonymous legacy sessions older than this as archived test noise (default: 72h).",
    )
    return parser.parse_args()


def migrate_sessions(*, apply_changes: bool, stale_hours: int) -> None:
    settings = get_settings()
    if not settings.mongodb_uri:
        print("Error: MONGODB_URI is not configured.")
        return

    client = MongoClient(settings.mongodb_uri)
    db = client[settings.mongodb_db_name]
    sessions_coll = db[settings.mongodb_sessions_collection]
    forensics_coll = db[settings.mongodb_forensic_collection]

    stale_cutoff = datetime.utcnow() - timedelta(hours=stale_hours)
    stale_cutoff_iso = _utc_iso(stale_cutoff)
    print(f"Session hygiene started (apply={apply_changes})")
    print(f"Legacy anonymous cutoff: {stale_cutoff_iso}")

    local_forensics = forensics_coll.find(
        {"client_ip": {"$in": ["127.0.0.1", "::1", "localhost"]}},
        {"session_id": 1},
    )
    local_session_ids = sorted(
        {
            doc.get("session_id")
            for doc in local_forensics
            if doc.get("session_id")
        }
    )
    print(f"Detected {len(local_session_ids)} sessions tied to localhost forensic traffic.")

    test_local_query = {
        "$or": [
            {"archived": True},
            {"is_test": True},
            {"is_test_session": True},
            {"environment": {"$in": ["test", "local"]}},
            {"source_host": {"$regex": _LOCAL_HOST_PATTERN}},
            {"session_id": {"$in": local_session_ids}} if local_session_ids else {"session_id": {"$in": []}},
        ]
    }

    legacy_anonymous_query = {
        "last_activity": {"$lt": stale_cutoff},
        "user_id": {"$in": [None, ""]},
        "user_email": {"$in": [None, ""]},
        "environment": {"$exists": False},
        "is_test": {"$ne": True},
        "is_test_session": {"$ne": True},
    }

    test_local_count = sessions_coll.count_documents(test_local_query)
    legacy_anonymous_count = sessions_coll.count_documents(legacy_anonymous_query)

    print(f"Candidate local/test sessions: {test_local_count}")
    print(f"Candidate legacy anonymous sessions: {legacy_anonymous_count}")

    if not apply_changes:
        print("Dry run complete. Re-run with --apply to persist changes.")
        return

    result_test_local = sessions_coll.update_many(
        test_local_query,
        {
            "$set": {
                "archived": True,
                "is_test": True,
                "is_test_session": True,
                "session_type": "test",
            }
        },
    )

    result_legacy = sessions_coll.update_many(
        legacy_anonymous_query,
        {
            "$set": {
                "archived": True,
                "is_test": True,
                "is_test_session": True,
                "environment": "test",
                "session_type": "test",
            }
        },
    )

    print(f"Archived local/test sessions: {result_test_local.modified_count}")
    print(f"Archived legacy anonymous sessions: {result_legacy.modified_count}")
    print("Session hygiene completed.")


if __name__ == "__main__":
    args = _parse_args()
    migrate_sessions(apply_changes=args.apply, stale_hours=args.stale_hours)
