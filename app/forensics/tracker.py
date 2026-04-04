"""
PhantomShield – Forensic Tracker

Unified event logging for all storefront interactions.
Captures session context, user identity, and routing mode.
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional
from fastapi import Request

# Constants
FORENSIC_LOG_DIR = Path("app/forensics/logs")
FORENSIC_LOG_FILE = FORENSIC_LOG_DIR / "storefront_events.jsonl"

def track_event(
    request: Request,
    action: str,
    payload: Optional[Dict[str, Any]] = None,
    notes: Optional[str] = None
) -> None:
    """
    Records a structured forensic event.
    Safe to call from any route handler—automatically extracts session context.
    """
    try:
        # 1. Extract context from request state (attached by middleware)
        session = getattr(request.state, "session", None)
        if not session:
            return

        # 2. Build structured event
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "session_id": session.session_id,
            "user_id": session.user_id,
            "action": action,
            "route": request.url.path,
            "method": request.method,
            "payload": payload or {},
            "mode": session.routing_state,  # REAL or DECOY
            "risk_score": session.risk_score,
            "client_ip": request.client.host if request.client else "unknown",
            "notes": notes
        }

        # 3. Ensure log directory exists
        FORENSIC_LOG_DIR.mkdir(parents=True, exist_ok=True)

        # 4. Append to JSONL log
        with open(FORENSIC_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(event) + "\n")

    except Exception as e:
        # Fail silently to avoid interrupting the user experience
        # In a real system, we would log this to a secondary error log
        print(f"Forensic Logging Error: {e}")
