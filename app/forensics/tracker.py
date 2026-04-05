"""
Unified forensic tracking entrypoints.
"""

from __future__ import annotations

from typing import Any

from fastapi import Request

from app.forensics.schemas import ForensicEvent
from app.forensics.sink import write_forensic_event
from app.session.models import SessionState


def _normalize_mode(raw_mode: str | None) -> str:
    mode = (raw_mode or "REAL").upper()
    return "DECOY" if mode == "DECOY" else "REAL"


def track_session_event(
    *,
    session: SessionState,
    action: str,
    route: str,
    payload: dict[str, Any] | None = None,
    method: str | None = None,
    client_ip: str | None = None,
    notes: str | None = None,
) -> None:
    """
    Write a forensic event when only session context is available.
    """
    event = ForensicEvent(
        session_id=session.session_id,
        user_id=session.user_id,
        action=action,
        route=route,
        payload=payload or {},
        mode=_normalize_mode(session.routing_state),
        method=method,
        client_ip=client_ip,
        risk_score=round(session.risk_score, 4),
        notes=notes,
    )
    write_forensic_event(event.to_record())


def track_event(
    request: Request,
    action: str,
    payload: dict[str, Any] | None = None,
    notes: str | None = None,
) -> None:
    """
    Write a forensic event from a request context.
    """
    session = getattr(request.state, "session", None)
    if session is None:
        return

    track_session_event(
        session=session,
        action=action,
        route=request.url.path,
        payload=payload,
        method=request.method,
        client_ip=request.client.host if request.client else "unknown",
        notes=notes,
    )
