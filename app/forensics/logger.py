"""
Legacy async-compatible forensic logger wrapper.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from app.forensics.sink import write_forensic_event


class ForensicLogger:
    def __init__(self, db=None):
        # db retained for backward compatibility with older call-sites.
        self.db = db

    async def log_event(
        self,
        session_id: str,
        event_type: str,
        endpoint: str,
        method: str,
        payload: dict[str, Any],
        status_code: int,
        mode: str = "REAL",
    ) -> dict[str, Any]:
        event = {
            "event_id": str(uuid4()),
            "session_id": session_id,
            "user_id": None,
            "action": event_type,
            "route": endpoint,
            "method": method,
            "payload": payload,
            "status_code": status_code,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "mode": mode,
        }
        write_forensic_event(event)
        return event
