"""
PhantomShield – Store Forensics Logger

Logs every meaningful decoy store interaction to a structured JSONL file.
In production, this writes to MongoDB (ForensicLogger in app/forensics/logger.py).
In v1, writes to app/forensics/logs/store_decoy.jsonl.

Event schema matches the spec:
{
  session_id, route, action, payload, timestamp, mode: "DECOY"
}
"""

import json
from datetime import datetime
from pathlib import Path

from app.session.models import SessionState


# ---------------------------------------------------------------------------
# Log directory (created on first write)
# ---------------------------------------------------------------------------

_LOG_DIR = Path(__file__).parent / "logs"


def _ensure_log_dir() -> None:
    _LOG_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Core logger
# ---------------------------------------------------------------------------

def log_store_event(
    session: SessionState,
    action: str,
    route: str,
    payload: dict | None = None,
) -> None:
    """
    Write a structured forensic event for a decoy store interaction.

    Args:
        session: The active SessionState (must be routing_state == "decoy")
        action:  Event type (e.g. "product_view", "add_to_cart")
        route:   API path that triggered the event
        payload: Optional dict of additional context
    """
    _ensure_log_dir()

    event = {
        "session_id": session.session_id,
        "user_id": session.user_id,
        "risk_score": round(session.risk_score, 4),
        "route": route,
        "action": action,
        "payload": payload or {},
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "mode": "DECOY",
    }

    log_path = _LOG_DIR / "store_decoy.jsonl"
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(event) + "\n")

    # Also emit to stdout for real-time visibility in the PhantomShield console
    short_id = session.session_id[:8]
    print(
        f"[FORENSIC] DECOY | {short_id} | {action} | "
        f"risk={session.risk_score:.2f} | {route}"
    )
