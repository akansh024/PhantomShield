import uuid
import datetime
from typing import Dict, Any, Optional


class ForensicLogger:
    def _init_(self, db):
        self.db = db

    async def log_event(
        self,
        session_id: str,
        route: str,
        method: str,
        payload: Dict[str, Any],
        response_status: int,
        risk_score_at_time: Optional[float] = None,
        canary_triggered: Optional[bool] = False,
        canary_name: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Log a forensic event to the decoy_events collection.
        
        This is a pure logging component that records events for forensic analysis.
        No state modification, risk calculation, or routing decisions.
        
        Args:
            session_id: Unique identifier for the session
            route: Request route/path
            method: HTTP method (GET, POST, etc.)
            payload: Request payload/parameters
            response_status: HTTP response status code
            risk_score_at_time: Risk score at the time of the event (optional)
            canary_triggered: Whether a canary was triggered (optional)
            canary_name: Name of the triggered canary (optional)
            ip_address: Client IP address (optional)
            user_agent: Client user agent string (optional)
            
        Returns:
            The logged event document
        """
        event = {
            "event_id": str(uuid.uuid4()),
            "session_id": session_id,
            "route": route,
            "method": method,
            "payload": payload,
            "response_status": response_status,
            "timestamp": datetime.datetime.utcnow(),
            "risk_score_at_time": risk_score_at_time,
            "canary_triggered": canary_triggered,
            "canary_name": canary_name,
            "ip_address": ip_address,
            "user_agent": user_agent,
        }

        await self.db.decoy_events.insert_one(event)
        return event
