from typing import List, Dict
from bson import SON


class AttackTimeline:
    def __init__(self, db):
        self.db = db

    async def get_session_timeline(self, session_id: str) -> List[Dict]:
        """
        Retrieve all decoy events for a session in chronological order.
        
        This is a read-only forensic reconstruction method.
        """
        events = await self.db.decoy_events.find(
            {"session_id": session_id}
        ).sort("timestamp", 1).to_list(length=None)

        return events

    async def summarize_session(self, session_id: str) -> Dict:
        """
        Generate a summary of session activity from decoy events.
        
        Returns a structured summary without modifying session state.
        """
        # First, check if session has any events
        event_count = await self.db.decoy_events.count_documents(
            {"session_id": session_id}
        )
        
        if event_count == 0:
            return {
                "session_id": session_id,
                "total_events": 0,
                "first_activity": None,
                "last_activity": None,
                "unique_routes": 0,
                "status_distribution": {},
                "canary_trigger_count": 0
            }
        
        # Use MongoDB aggregation for efficient computation
        pipeline = [
            {"$match": {"session_id": session_id}},
            {"$facet": {
                # Get timeline bounds
                "timeline": [
                    {"$sort": {"timestamp": 1}},
                    {"$group": {
                        "_id": None,
                        "first_activity": {"$first": "$timestamp"},
                        "last_activity": {"$last": "$timestamp"}
                    }}
                ],
                # Count unique routes
                "unique_routes": [
                    {"$group": {"_id": "$route"}},
                    {"$count": "count"}
                ],
                # Distribution of response status codes
                "status_distribution": [
                    {"$group": {
                        "_id": "$response_status",
                        "count": {"$sum": 1}
                    }},
                    {"$sort": SON([("count", -1)])}
                ],
                # Count canary triggers
                "canary_triggers": [
                    {"$match": {"canary_triggered": True}},
                    {"$count": "count"}
                ]
            }}
        ]
        
        results = await self.db.decoy_events.aggregate(pipeline).to_list(length=1)
        result = results[0] if results else {}
        
        # Extract values from aggregation results
        timeline = result.get("timeline", [{}])[0] if result.get("timeline") else {}
        unique_routes_result = result.get("unique_routes", [{}])[0] if result.get("unique_routes") else {}
        status_distribution_raw = result.get("status_distribution", [])
        canary_triggers_result = result.get("canary_triggers", [{}])[0] if result.get("canary_triggers") else {}
        
        # Format status distribution as dictionary
        status_distribution = {
            str(item["_id"]) if item["_id"] is not None else "null": item["count"]
            for item in status_distribution_raw
        }
        
        return {
            "session_id": session_id,
            "total_events": event_count,
            "first_activity": timeline.get("first_activity"),
            "last_activity": timeline.get("last_activity"),
            "unique_routes": unique_routes_result.get("count", 0),
            "status_distribution": status_distribution,
            "canary_trigger_count": canary_triggers_result.get("count", 0)
        }
