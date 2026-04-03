from fastapi import APIRouter, HTTPException
from app.api.auth.schemas import RegisterRequest, LoginRequest, AuthResponse
from app.core.security import hash_password, verify_password, create_access_token
from app.db.mongo.repo import (
    DuplicateUserError,
    MongoConfigurationError,
    MongoUnavailableError,
    create_user,
    get_user_by_email,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _raise_storage_error(exc: Exception) -> None:
    if isinstance(exc, MongoConfigurationError):
        raise HTTPException(
            status_code=500,
            detail="Backend database is not configured",
        ) from exc

    raise HTTPException(
        status_code=503,
        detail="Database is temporarily unavailable",
    ) from exc

@router.post("/register", response_model=AuthResponse)
def register(data: RegisterRequest):
    try:
        existing = get_user_by_email(data.email)
    except (MongoConfigurationError, MongoUnavailableError) as exc:
        _raise_storage_error(exc)

    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    try:
        create_user(
            name=data.name,
            email=data.email,
            hashed_password=hash_password(data.password),
        )
    except DuplicateUserError as exc:
        raise HTTPException(status_code=400, detail="User already exists") from exc
    except (MongoConfigurationError, MongoUnavailableError) as exc:
        _raise_storage_error(exc)

    token = create_access_token({"sub": data.email, "name": data.name})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/login", response_model=AuthResponse)
def login(data: LoginRequest):
    try:
        user_data = get_user_by_email(data.email)
    except (MongoConfigurationError, MongoUnavailableError) as exc:
        _raise_storage_error(exc)

    if not user_data or not verify_password(data.password, user_data["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": data.email, "name": user_data.get("name", "")})
    return {"access_token": token, "token_type": "bearer"}
