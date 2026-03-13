import uuid
import datetime
from typing import Dict, Any

class ForensicLogger:
    def __init__(self, db):
        self.db = db

    async def log_event(self, session_id: str, event_type: str,
                        endpoint: str, method: str,
                        payload: Dict[str, Any], status_code: int):
        event = {
            "event_id": str(uuid.uuid4()),
            "session_id": session_id,
            "event_type": event_type,
            "endpoint": endpoint,
            "method": method,
            "payload": payload,
            "status_code": status_code,
            "timestamp": datetime.datetime.utcnow()
        }

        await self.db.attack_events.insert_one(event)
        return event
