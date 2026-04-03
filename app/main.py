from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth.auth_routes import router as auth_router
from app.api.decoy.routes import router as decoy_router
from app.db.mongo.repo import close_mongo_connection
from app.tests.test import router as test_router

app = FastAPI(title="PhantomShield")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(decoy_router)
app.include_router(test_router)


@app.on_event("shutdown")
def shutdown_event() -> None:
    close_mongo_connection()
