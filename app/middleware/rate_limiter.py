import time
from fastapi import Request, HTTPException

# store request timestamps per IP
request_log = {}

# limits
MAX_REQUESTS = 8
WINDOW_SECONDS = 60


async def rate_limiter(request: Request, call_next):
    ip = request.client.host
    now = time.time()

    if ip not in request_log:
        request_log[ip] = []

    # keep only requests inside time window
    request_log[ip] = [
        t for t in request_log[ip] if now - t < WINDOW_SECONDS
    ]

    if len(request_log[ip]) >= MAX_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Try again later."
        )

    request_log[ip].append(now)

    response = await call_next(request)
    return response