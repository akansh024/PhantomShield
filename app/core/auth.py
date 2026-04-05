"""
PhantomShield – Authentication Utilities (Corrected)

Handles JWT generation and identity proofing.
Strict rule: JWT must only contain identity (user_id, session_id).
Authority remains with the server-side session.
"""

from __future__ import annotations
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext

from app.core.config import get_settings

# Config
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_identity_token(user_id: str, session_id: str) -> str:
    """
    Creates a JWT containing ONLY identity proof.
    Never includes routing_state, risk_score, or permissions.
    """
    settings = get_settings()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Payload is identity-only as per architectural rule #2
    payload = {
        "sub": user_id,
        "sid": session_id,
        "iat": datetime.utcnow(),
        "exp": expire
    }
    
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)

def decode_identity_token(token: str) -> dict | None:
    """
    Decodes and validates a JWT identity proof.
    """
    settings = get_settings()
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
    except JWTError:
        return None
