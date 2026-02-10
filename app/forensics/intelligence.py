from collections import Counter
from typing import Dict, List

class ThreatIntelligence:
    def __init__(self, db):
        self.db = db

    async def detect_bruteforce(self, session_id: str) -> bool:
        events = await self.db.attack_events.find(
            {"session_id": session_id, "event_type": "LOGIN_FAIL"}
        ).to_list(length=None)

        return len(events) >= 5

    async def detect_scanning(self, session_id: str) -> bool:
        events = await self.db.attack_events.find(
            {"session_id": session_id}
        ).to_list(length=None)

        endpoints = set(e["endpoint"] for e in events)
        return len(endpoints) >= 10

    async def classify_session(self, session_id: str) -> Dict:
        threats = []

        if await self.detect_bruteforce(session_id):
            threats.append("Brute Force Attack")

        if await self.detect_scanning(session_id):
            threats.append("Endpoint Scanning")

        return {
            "session_id": session_id,
            "threats_detected": threats,
            "risk_level": "High" if threats else "Low"
        }

    async def global_threat_stats(self) -> Dict:
        events = await self.db.attack_events.find().to_list(length=None)
        attack_types = Counter(e["event_type"] for e in events)

        return {
            "total_events": len(events),
            "most_common_attack": attack_types.most_common(1),
            "attack_distribution": dict(attack_types)
        }
