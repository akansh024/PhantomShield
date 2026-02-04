from fastapi import FastAPI
from app.api.auth.auth_routes import router as auth_router
from app.test import router as test_router

app = FastAPI(title="PhantomShield")

app.include_router(auth_router)
app.include_router(test_router)

