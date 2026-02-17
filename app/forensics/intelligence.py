from typing import Dict, List
from bson import SON


class ThreatIntelligence:
    def _init_(self, db):
        self.db = db

    async def detect_bruteforce(self, session_id: str) -> bool:
        """
        Detect brute-force attempts by counting authentication failures.
        
        Uses response status codes 401 (Unauthorized) and 403 (Forbidden)
        from decoy events to identify repeated failed access attempts.
        """
        # Count documents with authentication failure status codes
        count = await self.db.decoy_events.count_documents({
            "session_id": session_id,
            "response_status": {"$in": [401, 403]}
        })
        
        return count >= 5

    async def detect_scanning(self, session_id: str) -> bool:
        """
        Detect endpoint scanning by counting unique routes accessed.
        
        Uses projection to only fetch the route field, not entire documents.
        """
        # Use aggregation to count distinct routes without loading all documents
        pipeline = [
            {"$match": {"session_id": session_id}},
            {"$group": {"_id": "$route"}},  # Group by route to get unique routes
            {"$count": "unique_routes_count"}
        ]
        
        result = await self.db.decoy_events.aggregate(pipeline).to_list(length=1)
        
        # If aggregation returns a result, check the count
        if result:
            return result[0]["unique_routes_count"] >= 10
        return False

    async def classify_session(self, session_id: str) -> Dict:
        """
        Classify session based on detected threat patterns.
        
        Returns threat classification without modifying session state.
        """
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
        """
        Generate global threat statistics using MongoDB aggregation.
        
        Efficiently processes decoy events without loading entire collection.
        """
        # Count total events efficiently
        total_events = await self.db.decoy_events.count_documents({})
        
        # Aggregate response status distribution
        pipeline = [
            {"$group": {
                "_id": "$response_status",
                "count": {"$sum": 1}
            }},
            {"$sort": SON([("count", -1)])}
        ]
        
        status_results = await self.db.decoy_events.aggregate(pipeline).to_list(length=None)
        
        # Convert aggregation results to dictionary format
        status_distribution = {
            str(result["_id"]) if result["_id"] is not None else "null": result["count"]
            for result in status_results
        }
        
        return {
            "total_events": total_events,
            "status_distribution": status_distribution
        }
