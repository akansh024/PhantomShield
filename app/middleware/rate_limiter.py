import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

# store request timestamps per IP
request_log = {}

# limits — raised from 8 to accommodate store frontend parallel requests
MAX_REQUESTS = 60
WINDOW_SECONDS = 60


class RateLimiterMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        ip = request.client.host if request.client else "unknown"
        now = time.time()

        if ip not in request_log:
            request_log[ip] = []

        # keep only requests inside time window
        request_log[ip] = [
            t for t in request_log[ip] if now - t < WINDOW_SECONDS
        ]

        if len(request_log[ip]) >= MAX_REQUESTS:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Try again later."},
            )

        request_log[ip].append(now)

        response = await call_next(request)
        return response
