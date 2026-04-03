import time
from fastapi import Request

async def log_requests(request: Request, call_next):
    start_time = time.time()

    response = await call_next(request)

    process_time = round(time.time() - start_time, 4)

    ip = request.client.host
    method = request.method
    path = request.url.path
    status_code = response.status_code

    print(f"[REQ] {ip} | {method} {path} | {status_code} | {process_time}s")

    return response