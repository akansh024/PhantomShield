from fastapi import APIRouter, HTTPException, Depends
from app.api.auth.schemas import RegisterRequest, LoginRequest, AuthResponse
from app.api.auth.auth_service import (
    hash_password,
    verify_password,
    create_access_token
)

router = APIRouter(prefix="/auth", tags=["auth"])

# Temporary will replace with real DB later
fake_users_db = {}

@router.post("/register", response_model=AuthResponse)
def register(data: RegisterRequest):
    if data.email in fake_users_db:
        raise HTTPException(status_code=400, detail="User already exists")

    fake_users_db[data.email] = hash_password(data.password)

    token = create_access_token({"sub": data.email})
    return {"access_token": token}

@router.post("/login", response_model=AuthResponse)
def login(data: LoginRequest):
    hashed = fake_users_db.get(data.email)

    if not hashed or not verify_password(data.password, hashed):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": data.email})
    return {"access_token": token}
