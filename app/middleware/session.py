"""
PhantomShield - Session middleware for storefront APIs.
"""

import re

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.config import get_settings
from app.forensics.tracker import track_event
from app.session.constants import (
    COOKIE_HTTPONLY,
    COOKIE_PATH,
    COOKIE_SAMESITE,
    COOKIE_SECURE,
    COOKIE_SESSION_ID,
    SESSION_MAX_AGE_SECONDS,
)
from app.session.store import session_store

_TRACKED_PREFIXES = ("/api", "/decoy", "/robots.txt")
_LOCAL_HOST_PATTERN = re.compile(r"(localhost|127\.0\.0\.1|::1)", re.IGNORECASE)
_TEST_UA_SIGNALS = (
    "pytest",
    "playwright",
    "selenium",
    "postman",
    "insomnia",
    "python-requests",
    "curl",
    "wget",
)
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


def _resolve_source_host(request: Request) -> str:
    forwarded_host = request.headers.get("x-forwarded-host")
    host_header = request.headers.get("host")
    origin_header = request.headers.get("origin")
    referer_header = request.headers.get("referer")

    for raw in (forwarded_host, host_header, origin_header, referer_header):
        if not raw:
            continue
        value = raw.strip().lower().replace("https://", "").replace("http://", "")
        return value.split("/")[0]

    return (request.url.hostname or "").strip().lower()


def _classify_environment(request: Request, source_host: str) -> str:
    settings = get_settings()
    app_env = (settings.app_environment or "").strip().lower()
    production_host = (settings.production_host or "").strip().lower()

    if _LOCAL_HOST_PATTERN.search(source_host):
        return "local"

    if production_host and production_host in source_host:
        return "production"

    if source_host.endswith(".vercel.app"):
        return "production"

    if app_env in {"local", "development", "dev"}:
        return "local"

    if app_env in {"test", "staging", "qa"}:
        return "test"

    return "production"


def _is_test_session(request: Request, source_host: str, environment: str) -> bool:
    if environment in {"local", "test"}:
        return True

    path = request.url.path.lower()
    if path.startswith("/api/test"):
        return True

    user_agent = request.headers.get("user-agent", "").lower()
    return any(signal in user_agent for signal in _TEST_UA_SIGNALS)


class StoreSessionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore[override]
        path = request.url.path
        if path.startswith(("/api/admin", "/api/dashboard")):
            return await call_next(request)

        if not any(path.startswith(prefix) for prefix in _TRACKED_PREFIXES):
            return await call_next(request)

        incoming_session_id = request.cookies.get(COOKIE_SESSION_ID)
        is_new_session = False

        if incoming_session_id:
            session = session_store.get_session(incoming_session_id)
            if session is None:
                # Reuse the existing ID to prevent duplication loops
                from app.session.models import SessionState
                session = SessionState(session_id=incoming_session_id)
                session.risk_score = _heuristic_risk(request)
                session.routing_state = "REAL"
                is_new_session = True
        else:
            session = session_store.create_session()
            session.risk_score = _heuristic_risk(request)
            session.routing_state = "REAL"
            is_new_session = True

        source_host = _resolve_source_host(request)
        environment = _classify_environment(request, source_host)
        inferred_test = _is_test_session(request, source_host, environment)

        session.source_host = source_host or session.source_host
        session.environment = environment
        session.is_test_session = bool(session.is_test_session or inferred_test)
        session.is_test = bool(session.is_test or session.is_test_session)
        if session.is_test_session:
            session.session_type = "test"
        elif session.user_id:
            session.session_type = "authenticated"
        else:
            session.session_type = "guest"

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

        # Persist session state changes to MongoDB (routing, risk, activity context).
        current_session = getattr(request.state, "session", session)
        session_store.save_session(current_session)

        # Persist session cookie for newly created sessions and rotated sessions.
        if is_new_session or current_session.session_id != incoming_session_id:
            response.set_cookie(
                key=COOKIE_SESSION_ID,
                value=current_session.session_id,
                httponly=COOKIE_HTTPONLY,
                samesite=COOKIE_SAMESITE,
                secure=COOKIE_SECURE,
                max_age=SESSION_MAX_AGE_SECONDS,
                path=COOKIE_PATH,
            )

        return response
