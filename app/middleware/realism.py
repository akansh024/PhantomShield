"""
PhantomShield - Decoy realism middleware.

Adds slight, believable latency for DECOY-routed sessions so attacker
interactions feel natural while remaining fully functional.
"""

from __future__ import annotations

import asyncio
import random

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

_STORE_PREFIXES = ("/api/store", "/api/auth")

# Slight response delays to mimic realistic backend behavior.
DECOY_MIN_LATENCY = 0.12
DECOY_MAX_LATENCY = 0.45

# Extra delay for write-heavy or sensitive routes.
HEAVY_ROUTE_EXTRA_MIN = 0.20
HEAVY_ROUTE_EXTRA_MAX = 0.55


def _is_store_request(path: str) -> bool:
    return any(path.startswith(prefix) for prefix in _STORE_PREFIXES)


def _compute_delay(request: Request) -> float:
    delay = random.uniform(DECOY_MIN_LATENCY, DECOY_MAX_LATENCY)

    if request.method in {"POST", "PATCH", "DELETE"}:
        delay += random.uniform(HEAVY_ROUTE_EXTRA_MIN, HEAVY_ROUTE_EXTRA_MAX)

    if request.url.path.endswith("/orders") or "/auth/" in request.url.path:
        delay += random.uniform(0.10, 0.30)

    return delay


class DecoyRealismMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore[override]
        if not _is_store_request(request.url.path):
            return await call_next(request)

        session = getattr(request.state, "session", None)
        if session and session.routing_state == "DECOY":
            await asyncio.sleep(_compute_delay(request))

        return await call_next(request)
