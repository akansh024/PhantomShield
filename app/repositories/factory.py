"""
PhantomShield – Repository Factory

THE ONLY PLACE that reads routing_state and decides which concrete
repository implementation to instantiate.

Route handlers never call this directly.
They receive repositories via FastAPI Depends() wrappers defined here.
"""

from __future__ import annotations

from fastapi import Depends, Request

from app.repositories.base import (
    AbstractCartRepository,
    AbstractOrderRepository,
    AbstractProductRepository,
    AbstractWishlistRepository,
)
from app.repositories.real.product_repo import RealProductRepository
from app.repositories.decoy.product_repo import DecoyProductRepository
from app.repositories.real.cart_repo import RealCartRepository
from app.repositories.decoy.cart_repo import DecoyCartRepository
from app.repositories.real.wishlist_repo import RealWishlistRepository
from app.repositories.decoy.wishlist_repo import DecoyWishlistRepository
from app.repositories.real.order_repo import RealOrderRepository
from app.repositories.decoy.order_repo import DecoyOrderRepository
from app.session.models import SessionState


# ---------------------------------------------------------------------------
# Session extractor (reads from request.state — set by StoreSessionMiddleware)
# ---------------------------------------------------------------------------

def _get_session(request: Request) -> SessionState:
    """
    Extract the session from request.state.
    StoreSessionMiddleware guarantees this exists for /api/store/* routes.
    """
    session: SessionState | None = getattr(request.state, "session", None)
    if session is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="No active session.")
    return session


# ---------------------------------------------------------------------------
# Product repository factory
# ---------------------------------------------------------------------------

def get_product_repo(
    session: SessionState = Depends(_get_session),
) -> AbstractProductRepository:
    """
    Returns RealProductRepository or DecoyProductRepository
    based on session routing_state. Route handlers are unaware of which.
    """
    if session.routing_state.upper() == "REAL":
        return RealProductRepository()
    return DecoyProductRepository(session)


# ---------------------------------------------------------------------------
# Cart repository factory
# ---------------------------------------------------------------------------

def get_cart_repo(
    session: SessionState = Depends(_get_session),
) -> AbstractCartRepository:
    """
    Returns RealCartRepository or DecoyCartRepository.
    Decoy repo uses isolated decoy_cart_store and logs all actions.
    """
    if session.routing_state.upper() == "REAL":
        return RealCartRepository()
    return DecoyCartRepository(session)


# ---------------------------------------------------------------------------
# Wishlist repository factory
# ---------------------------------------------------------------------------

def get_wishlist_repo(
    session: SessionState = Depends(_get_session),
) -> AbstractWishlistRepository:
    """
    Returns RealWishlistRepository or DecoyWishlistRepository.
    """
    if session.routing_state.upper() == "REAL":
        return RealWishlistRepository()
    return DecoyWishlistRepository(session)


# ---------------------------------------------------------------------------
# Order repository factory
# ---------------------------------------------------------------------------

def get_order_repo(
    session: SessionState = Depends(_get_session),
) -> AbstractOrderRepository:
    """
    Returns RealOrderRepository or DecoyOrderRepository.
    Decoy repo logs checkout_attempt + order_placed as forensic events.
    """
    if session.routing_state.upper() == "REAL":
        return RealOrderRepository()
    return DecoyOrderRepository(session)
