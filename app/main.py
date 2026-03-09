from fastapi import FastAPI

from app.api.auth.auth_routes import router as auth_router
from app.api.decoy.routes import router as decoy_router
from app.tests.test import router as test_router
from app.middleware.req_logger import log_requests
from app.middleware.rate_limiter import rate_limiter

app = FastAPI(title="PhantomShield")
app.middleware("http")(log_requests)
app.middleware("http")(rate_limiter)

app.include_router(auth_router)
app.include_router(decoy_router)
app.include_router(test_router)
