from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth.auth_routes import router as auth_router
from app.api.decoy.routes import router as decoy_router
from app.db.mongo.repo import close_mongo_connection
from app.tests.test import router as test_router
from app.api.decoy.routes import router as decoy_router

# Middleware imports
from app.middleware.req_logger import RequestLoggerMiddleware
from app.middleware.rate_limiter import RateLimiterMiddleware

app = FastAPI(title="PhantomShield")

# Register middleware
# Order matters: rate limiter first, request logger after
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimiterMiddleware)
app.add_middleware(RequestLoggerMiddleware)

# Register routers
app.include_router(auth_router)
app.include_router(decoy_router)
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
