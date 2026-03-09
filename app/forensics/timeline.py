from typing import List, Dict

class AttackTimeline:
    def __init__(self, db):
        self.db = db

    async def get_session_timeline(self, session_id: str) -> List[Dict]:
        events = await self.db.attack_events.find(
            {"session_id": session_id}
        ).sort("timestamp", 1).to_list(length=None)

        return events

    async def summarize_session(self, session_id: str) -> Dict:
        events = await self.get_session_timeline(session_id)

        if not events:
            return {"session_id": session_id, "summary": "No activity found"}

        return {
            "session_id": session_id,
            "total_events": len(events),
            "first_activity": events[0]["timestamp"],
            "last_activity": events[-1]["timestamp"],
            "unique_endpoints": len(set(e["endpoint"] for e in events)),
            "event_types": list(set(e["event_type"] for e in events))
        }
