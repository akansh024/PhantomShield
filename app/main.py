from fastapi import FastAPI
from app.api.auth.auth_routes import router as auth_router
from app.tests.test import router as test_router
from app.api.decoy.routes import router as decoy_router

# Middleware imports
from app.middleware.req_logger import RequestLoggerMiddleware
from app.middleware.rate_limiter import RateLimiterMiddleware

app = FastAPI(title="PhantomShield")

# Register middleware
# Order matters: rate limiter first, request logger after
app.add_middleware(RateLimiterMiddleware)
app.add_middleware(RequestLoggerMiddleware)

# Register routers
app.include_router(auth_router)
app.include_router(test_router)
app.include_router(decoy_router)

# Optional health route
@app.get("/")
def root():
    return {
        "message": "PhantomShield backend is running",
        "status": "active"
    }

# Optional demo status route
@app.get("/status")
def status():
    return {
        "project": "PhantomShield",
        "backend": "online",
        "middleware": [
            "RequestLoggerMiddleware",
            "RateLimiterMiddleware"
        ],
        "decoy_system": "enabled"
    }
