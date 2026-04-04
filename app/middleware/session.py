"""
PhantomShield - Session middleware for storefront APIs.
"""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.forensics.tracker import track_event
from app.risk.thresholds import HIGH_RISK_THRESHOLD
from app.session.constants import (
    COOKIE_HTTPONLY,
    COOKIE_PATH,
    COOKIE_SAMESITE,
    COOKIE_SESSION_ID,
    SESSION_MAX_AGE_SECONDS,
)
from app.session.store import session_store

_STORE_PREFIXES = ("/api/store", "/api/auth")
_BOT_UA_SIGNALS = (
    "bot",
    "crawler",
    "spider",
    "scraper",
    "wget",
    "curl",
    "python-requests",
    "go-http-client",
    "java/",
    "libwww",
    "mechanize",
    "scrapy",
    "httpclient",
)


def _heuristic_risk(request: Request) -> float:
    """
    Lightweight first-pass risk scoring for session routing.
    """
    user_agent = request.headers.get("user-agent", "").lower()

    if any(signal in user_agent for signal in _BOT_UA_SIGNALS):
        return 0.85

    if user_agent == "" or "headlesschrome" in user_agent or "phantomjs" in user_agent:
        return 0.90

    if not request.headers.get("accept-language"):
        return 0.70

    if not request.headers.get("accept"):
        return 0.55

    return 0.05


class StoreSessionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore[override]
        if not any(request.url.path.startswith(prefix) for prefix in _STORE_PREFIXES):
            return await call_next(request)

        incoming_session_id = request.cookies.get(COOKIE_SESSION_ID)
        is_new_session = False

        session = (
            session_store.get_session(incoming_session_id)
            if incoming_session_id
            else None
        )

        if session is None:
            session = session_store.create_session()
            session.risk_score = _heuristic_risk(request)
            session.routing_state = (
                "DECOY" if session.risk_score >= HIGH_RISK_THRESHOLD else "REAL"
            )
            is_new_session = True

        request.state.session = session

        # Phase 1 tracking hook for session lifecycle visibility.
        track_event(
            request=request,
            action="session_created" if is_new_session else "session_validated",
            payload={
                "incoming_session_id": incoming_session_id,
                "active_session_id": session.session_id,
                "path": request.url.path,
            },
        )

        response = await call_next(request)

        # Persist session cookie for newly created sessions and rotated sessions.
        current_session = getattr(request.state, "session", session)
        if is_new_session or current_session.session_id != incoming_session_id:
            response.set_cookie(
                key=COOKIE_SESSION_ID,
                value=current_session.session_id,
                httponly=COOKIE_HTTPONLY,
                samesite=COOKIE_SAMESITE,
                max_age=SESSION_MAX_AGE_SECONDS,
                path=COOKIE_PATH,
            )

        return response
