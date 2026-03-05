from typing import Dict, List, Any
from collections import Counter
from datetime import datetime


class SessionSnapshotBuilder:

    def __init__(self, repository):
        self.repository = repository

    async def build(self, session_id: str) -> Dict[str, Any]:

        events: List[Dict] = await self.repository.get_events_by_session(session_id)

        if not events:
            return {
                "session_id": session_id,
                "total_events": 0,
                "duration_seconds": 0,
                "unique_routes": [],
                "route_count": 0,
                "status_distribution": {},
                "canary_trigger_count": 0,
                "first_seen": None,
                "last_seen": None
            }

        events = [
            e for e in events
            if isinstance(e.get("timestamp"), datetime)
        ]

        if not events:
            return {
                "session_id": session_id,
                "total_events": 0,
                "duration_seconds": 0,
                "unique_routes": [],
                "route_count": 0,
                "status_distribution": {},
                "canary_trigger_count": 0,
                "first_seen": None,
                "last_seen": None
            }

        events = sorted(events, key=lambda e: e["timestamp"])

        first_seen: datetime = events[0]["timestamp"]
        last_seen: datetime = events[-1]["timestamp"]

        duration_seconds = int((last_seen - first_seen).total_seconds())

        unique_routes = sorted(
            set(e.get("route") for e in events if e.get("route"))
        )

        route_count = len(unique_routes)

        status_distribution = dict(
            Counter(
                e.get("response_status")
                for e in events
                if e.get("response_status") is not None
            )
        )

        canary_trigger_count = sum(
            1 for e in events if e.get("canary_triggered") is True
        )

        return {
            "session_id": session_id,
            "total_events": len(events),
            "duration_seconds": duration_seconds,
            "unique_routes": unique_routes,
            "route_count": route_count,
            "status_distribution": status_distribution,
            "canary_trigger_count": canary_trigger_count,
            "first_seen": first_seen,
            "last_seen": last_seen,
        }
