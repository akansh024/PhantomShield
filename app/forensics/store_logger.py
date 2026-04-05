"""
Compatibility wrapper for repository-level forensic logging.
"""

from __future__ import annotations

from app.forensics.tracker import track_session_event
from app.session.models import SessionState


def log_store_event(
    session: SessionState,
    action: str,
    route: str,
    payload: dict | None = None,
) -> None:
    track_session_event(
        session=session,
        action=action,
        route=route,
        payload=payload or {},
        method="INTERNAL",
        client_ip=None,
    )
