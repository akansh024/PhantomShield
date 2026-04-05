from collections import Counter
from typing import Any


class ThreatIntelligence:
    def __init__(self, db):
        self.db = db

    def _collection(self):
        collection = getattr(self.db, "forensic_events", None)
        if collection is not None:
            return collection
        return getattr(self.db, "attack_events")

    async def detect_bruteforce(self, session_id: str) -> bool:
        events = await self._collection().find({"session_id": session_id}).to_list(length=None)
        failed_actions = {"LOGIN_FAIL", "login_failed"}
        return sum(1 for event in events if (event.get("action") or event.get("event_type")) in failed_actions) >= 5

    async def detect_scanning(self, session_id: str) -> bool:
        events = await self._collection().find({"session_id": session_id}).to_list(length=None)
        endpoints = {
            event.get("route") or event.get("endpoint")
            for event in events
            if (event.get("route") or event.get("endpoint"))
        }
        return len(endpoints) >= 10

    async def classify_session(self, session_id: str) -> dict[str, Any]:
        threats = []

        if await self.detect_bruteforce(session_id):
            threats.append("Brute Force Attack")
        if await self.detect_scanning(session_id):
            threats.append("Endpoint Scanning")

        return {
            "session_id": session_id,
            "threats_detected": threats,
            "risk_level": "High" if threats else "Low",
        }

    async def global_threat_stats(self) -> dict[str, Any]:
        events = await self._collection().find().to_list(length=None)
        attack_types = Counter((event.get("action") or event.get("event_type")) for event in events)

        return {
            "total_events": len(events),
            "most_common_attack": attack_types.most_common(1),
            "attack_distribution": dict(attack_types),
        }
