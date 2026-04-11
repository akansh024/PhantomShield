"""
PhantomShield storefront authentication APIs.

Auth links identity to the active session.
Routing authority remains server-side in SessionState.
"""

import secrets
from datetime import datetime, timezone

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
from app.stores import (
    decoy_cart_store,
    decoy_order_store,
    decoy_wishlist_store,
    real_cart_store,
    real_order_store,
    real_wishlist_store,
)

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


def _migrate_session_state(*, old_session_id: str, new_session_id: str, routing_state: str) -> None:
    """
    Preserve guest cart/wishlist/order state across session_id rotation on login.
    """
    if routing_state == "DECOY":
        decoy_cart_store.rebind_session(old_session_id, new_session_id)
        decoy_wishlist_store.rebind_session(old_session_id, new_session_id)
        decoy_order_store.rebind_session(old_session_id, new_session_id)
        return

    real_cart_store.rebind_session(old_session_id, new_session_id)
    real_wishlist_store.rebind_session(old_session_id, new_session_id)
    real_order_store.rebind_session(old_session_id, new_session_id)


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
        session.signup_at = session.signup_at or datetime.now(timezone.utc)
        return {"status": "success", "message": "User registered successfully"}

    try:
        user = get_user_by_email(email)
        if user:
            raise HTTPException(status_code=400, detail="User already exists")

        try:
            hashed_password = hash_password(password)
        except ValueError as exc:
            track_event(
                request,
                "signup_validation_failed",
                {"reason": str(exc)},
            )
            raise HTTPException(
                status_code=400,
                detail="Password is invalid. Use a shorter password and try again.",
            ) from exc

        create_user(name=name, email=email, hashed_password=hashed_password)
        session.signup_at = session.signup_at or datetime.now(timezone.utc)
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
        old_session_id = session.session_id

        # Rotate session_id on login as a fixation mitigation requirement.
        new_session = session_store.rotate_session(session.session_id)
        _migrate_session_state(
            old_session_id=old_session_id,
            new_session_id=new_session.session_id,
            routing_state=session.routing_state,
        )
        new_session.user_id = fake_user_id
        new_session.user_name = email.split("@")[0].capitalize()
        new_session.user_email = email
        new_session.session_type = "test" if new_session.is_test_session else "authenticated"
        new_session.authenticated_at = datetime.now(timezone.utc)
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
    old_session_id = session.session_id

    # Rotate first, then mint JWT with the rotated session_id.
    new_session = session_store.rotate_session(session.session_id)
    _migrate_session_state(
        old_session_id=old_session_id,
        new_session_id=new_session.session_id,
        routing_state=session.routing_state,
    )
    new_session.user_id = user_id
    new_session.user_name = user_name
    new_session.user_email = email
    new_session.session_type = "test" if new_session.is_test_session else "authenticated"
    new_session.authenticated_at = datetime.now(timezone.utc)
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
                "email": session.user_email,
            }
            if session.user_id
            else None
        ),
        "user_email": session.user_email,
        "authenticated_at": session.authenticated_at,
        "signup_at": session.signup_at,
        "is_authenticated": session.user_id is not None,
        "session_type": session.session_type,
        "routing_state": session.routing_state,
    }


@router.post("/logout")
async def logout(request: Request, response: Response):
    session = request.state.session
    track_event(request, "logout", {"user_id": session.user_id})

    session.user_id = None
    session.user_name = None
    session.user_email = None
    session.authenticated_at = None
    session.session_type = "test" if session.is_test_session else "guest"

    response.delete_cookie(COOKIE_AUTH_TOKEN, path=COOKIE_PATH)
    return {"status": "success"}
