from typing import Any


class AttackTimeline:
    def __init__(self, db):
        self.db = db

    def _collection(self):
        # Prefer modern collection name; fall back for compatibility.
        collection = getattr(self.db, "forensic_events", None)
        if collection is not None:
            return collection
        return getattr(self.db, "attack_events")

    async def get_session_timeline(self, session_id: str) -> list[dict[str, Any]]:
        events = (
            await self._collection()
            .find({"session_id": session_id})
            .sort("timestamp", 1)
            .to_list(length=None)
        )
        return events

    async def summarize_session(self, session_id: str) -> dict[str, Any]:
        events = await self.get_session_timeline(session_id)
        if not events:
            return {"session_id": session_id, "summary": "No activity found"}

        unique_routes = {event.get("route") or event.get("endpoint") for event in events}
        event_types = {event.get("action") or event.get("event_type") for event in events}
        return {
            "session_id": session_id,
            "total_events": len(events),
            "first_activity": events[0]["timestamp"],
            "last_activity": events[-1]["timestamp"],
            "unique_endpoints": len(unique_routes),
            "event_types": [evt for evt in event_types if evt],
        }
