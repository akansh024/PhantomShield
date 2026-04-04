"""
PhantomShield storefront authentication APIs.

Auth links identity to the active session.
Routing authority remains server-side in SessionState.
"""

import secrets

from fastapi import APIRouter, Body, HTTPException, Request, Response
from pydantic import EmailStr

from app.core.auth import create_identity_token, hash_password, verify_password
from app.db.mongo.repo import DuplicateUserError, create_user, get_user_by_email
from app.forensics.tracker import track_event
from app.session.constants import (
    COOKIE_AUTH_TOKEN,
    COOKIE_HTTPONLY,
    COOKIE_PATH,
    COOKIE_SAMESITE,
    COOKIE_SESSION_ID,
    SESSION_MAX_AGE_SECONDS,
)
from app.session.store import session_store

router = APIRouter(prefix="/api/auth", tags=["store-auth"])


def _set_identity_cookies(response: Response, *, session_id: str, token: str) -> None:
    response.set_cookie(
        key=COOKIE_SESSION_ID,
        value=session_id,
        httponly=COOKIE_HTTPONLY,
        samesite=COOKIE_SAMESITE,
        max_age=SESSION_MAX_AGE_SECONDS,
        path=COOKIE_PATH,
    )
    response.set_cookie(
        key=COOKIE_AUTH_TOKEN,
        value=token,
        httponly=COOKIE_HTTPONLY,
        samesite=COOKIE_SAMESITE,
        max_age=SESSION_MAX_AGE_SECONDS,
        path=COOKIE_PATH,
    )


@router.post("/signup")
async def signup(
    request: Request,
    name: str = Body(...),
    email: EmailStr = Body(...),
    password: str = Body(...),
):
    session = request.state.session
    is_decoy = session.routing_state == "DECOY"

    track_event(
        request,
        "signup_attempt",
        {
            "name": name,
            "email": email,
            "password_length": len(password),
            "is_decoy": is_decoy,
        },
    )

    if is_decoy:
        # Decoy auth always succeeds and never touches real user DB.
        return {"status": "success", "message": "User registered successfully"}

    try:
        user = get_user_by_email(email)
        if user:
            raise HTTPException(status_code=400, detail="User already exists")

        create_user(name=name, email=email, hashed_password=hash_password(password))
        return {"status": "success", "message": "User registered successfully"}
    except DuplicateUserError:
        raise HTTPException(status_code=400, detail="User already exists")
    except HTTPException:
        raise
    except Exception as exc:
        track_event(request, "signup_error", {"error": str(exc)})
        raise HTTPException(status_code=500, detail="Internal server error") from exc


@router.post("/login")
async def login(
    request: Request,
    response: Response,
    email: EmailStr = Body(...),
    password: str = Body(...),
):
    session = request.state.session
    is_decoy = session.routing_state == "DECOY"

    track_event(request, "login_attempt", {"email": email, "is_decoy": is_decoy})

    if is_decoy:
        fake_user_id = f"fake_{secrets.token_urlsafe(8)}"

        # Rotate session_id on login as a fixation mitigation requirement.
        new_session = session_store.rotate_session(session.session_id)
        new_session.user_id = fake_user_id
        new_session.user_name = email.split("@")[0].capitalize()
        request.state.session = new_session

        token = create_identity_token(
            user_id=fake_user_id,
            session_id=new_session.session_id,
        )
        _set_identity_cookies(
            response,
            session_id=new_session.session_id,
            token=token,
        )

        return {
            "status": "success",
            "user": {
                "id": fake_user_id,
                "name": new_session.user_name,
                "email": email,
            },
        }

    user = get_user_by_email(email)
    if not user or not verify_password(password, user["hashed_password"]):
        track_event(request, "login_failed", {"email": email})
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_id = str(user["_id"])
    user_name = user["name"]

    # Rotate first, then mint JWT with the rotated session_id.
    new_session = session_store.rotate_session(session.session_id)
    new_session.user_id = user_id
    new_session.user_name = user_name
    request.state.session = new_session

    token = create_identity_token(
        user_id=user_id,
        session_id=new_session.session_id,
    )
    _set_identity_cookies(
        response,
        session_id=new_session.session_id,
        token=token,
    )

    track_event(request, "login_success", {"user_id": user_id})

    return {
        "status": "success",
        "user": {"id": user_id, "name": user_name, "email": email},
    }


@router.get("/me")
async def get_me(request: Request):
    session = request.state.session
    return {
        "session_id": session.session_id,
        "user": (
            {
                "id": session.user_id,
                "name": session.user_name,
            }
            if session.user_id
            else None
        ),
        "is_authenticated": session.user_id is not None,
    }


@router.post("/logout")
async def logout(request: Request, response: Response):
    session = request.state.session
    track_event(request, "logout", {"user_id": session.user_id})

    session.user_id = None
    session.user_name = None

    response.delete_cookie(COOKIE_AUTH_TOKEN, path=COOKIE_PATH)
    return {"status": "success"}
