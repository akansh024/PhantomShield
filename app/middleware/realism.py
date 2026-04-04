"""
PhantomShield – Decoy Realism Middleware

Injects intentional, realistic latency and behavior for DECOY-routed sessions.
The goal is to simulate normal system processing and keep the attacker
convinced the environment is a legitimate production store.
"""

import asyncio
import random
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

# Config
DECOY_MIN_LATENCY = 0.2  # 200ms
DECOY_MAX_LATENCY = 1.8  # 1.8s

class DecoyRealismMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds randomized latency to responses for
    DECOY-routed sessions.
    """
    
    async def dispatch(self, request: Request, call_next) -> Response:
        # 1. Skip non-storefront APIs (Store and Auth)
        if not any(request.url.path.startswith(p) for p in ["/api/store", "/api/auth"]):
            return await call_next(request)

        # 2. Get session context (attached by StoreSessionMiddleware)
        session = getattr(request.state, "session", None)
        
        # 3. Only apply to DECOY-routed sessions
        if session and session.routing_state == "DECOY":
            # Simulate processing delay
            delay = random.uniform(DECOY_MIN_LATENCY, DECOY_MAX_LATENCY)
            
            # Slightly longer delay for heavy operations (signup/login/order)
            if any(p in request.url.path for p in ["/auth", "/checkout"]):
                delay += random.uniform(0.5, 1.0)
            
            await asyncio.sleep(delay)

        # 4. Proceed with request
        response = await call_next(request)
        
        # 5. Add custom header for internal tracing (optional, helps development)
        # response.headers["X-PS-Mode"] = session.routing_state if session else "NONE"
        
        return response
