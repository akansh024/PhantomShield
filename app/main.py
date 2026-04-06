from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth.auth_routes import router as auth_router
from app.api.admin.routes import router as admin_router
from app.api.store.router import router as store_router
from app.api.store.auth import router as store_auth_router
from app.api.robots import router as robots_router
from app.api.decoy.routes import router as decoy_router
from app.api.sensitive import router as sensitive_router, root_bait as root_bait_router
from app.tests.test import router as test_router
from app.api.dashboard import router as dashboard_router

# Middleware imports
from app.middleware.req_logger import RequestLoggerMiddleware
from app.middleware.rate_limiter import RateLimiterMiddleware
from app.middleware.session import StoreSessionMiddleware
from app.middleware.routing import SessionRoutingMiddleware
from app.middleware.realism import DecoyRealismMiddleware

app = FastAPI(title="PhantomShield")

# --- Register Routers first ---
app.include_router(auth_router)             # Generic/Admin Auth (/auth)
app.include_router(admin_router)            # Admin Dashboard APIs (/api/admin)
app.include_router(store_auth_router)       # Store Auth (/api/auth)
app.include_router(store_router)            # Store Products/Cart (/api/store)
app.include_router(robots_router)           # Robots.txt (/robots.txt)
app.include_router(decoy_router)            # Decoy routes (/decoy)
app.include_router(sensitive_router)         # Sensitive routes (/api/...)
app.include_router(root_bait_router)         # Root-level bait routes (/, /admin, /backup, etc)
app.include_router(dashboard_router)        # Dashboard APIs (/api/dashboard)
app.include_router(test_router)

# --- Register Middleware (Order: Last Added is Outermost) ---
app.add_middleware(RateLimiterMiddleware)
app.add_middleware(RequestLoggerMiddleware)
app.add_middleware(DecoyRealismMiddleware)
app.add_middleware(SessionRoutingMiddleware)
app.add_middleware(StoreSessionMiddleware)

import os

# CORS MUST BE OUTERMOST to handle preflight requests correctly
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        os.getenv("FRONTEND_URL", "https://phantomshield.vercel.app"),
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Optional health routes
@app.get("/")
def root():
    return {
        "message": "PhantomShield backend is running",
        "status": "active"
    }

@app.get("/status")
def status():
    return {
        "project": "PhantomShield",
        "backend": "online",
        "middleware": [
            "CORSMiddleware",
            "StoreSessionMiddleware",
            "SessionRoutingMiddleware",
            "DecoyRealismMiddleware",
            "RequestLoggerMiddleware",
            "RateLimiterMiddleware"
        ],
        "decoy_system": "enabled"
    }
