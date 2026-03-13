from fastapi import FastAPI

from app.api.auth.auth_routes import router as auth_router
from app.api.decoy.routes import router as decoy_router
from app.tests.test import router as test_router

app = FastAPI(title="PhantomShield")

app.include_router(auth_router)
app.include_router(decoy_router)
app.include_router(test_router)
