"""
PhantomShield – Store Cart Routes

All handlers are mode-agnostic. They receive AbstractCartRepository
via Depends() and call its methods. The factory resolves real vs decoy.

Optimistic UX note:
  The frontend applies local state changes immediately for instant feedback.
  These API calls confirm/persist the change server-side.
  On success → frontend confirms local state.
  On error   → frontend rolls back.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.models.store import AddToCartRequest, Cart, UpdateCartRequest
from app.repositories.base import AbstractCartRepository
from app.repositories.factory import get_cart_repo
from app.session.models import SessionState
from app.repositories.factory import _get_session

router = APIRouter(prefix="/cart", tags=["store-cart"])


# ---------------------------------------------------------------------------
# GET /cart
# ---------------------------------------------------------------------------

@router.get("", response_model=Cart)
def get_cart(
    session: SessionState = Depends(_get_session),
    repo: AbstractCartRepository = Depends(get_cart_repo),
) -> Cart:
    """Return the current session's cart."""
    return repo.get_cart(session)


# ---------------------------------------------------------------------------
# POST /cart/add
# ---------------------------------------------------------------------------

@router.post("/add", response_model=Cart)
def add_to_cart(
    body: AddToCartRequest,
    session: SessionState = Depends(_get_session),
    repo: AbstractCartRepository = Depends(get_cart_repo),
) -> Cart:
    """Add a product to cart. Increments quantity if already present."""
    return repo.add_item(session, body.product_id, body.quantity)


# ---------------------------------------------------------------------------
# PATCH /cart/item/{product_id}
# ---------------------------------------------------------------------------

@router.patch("/item/{product_id}", response_model=Cart)
def update_cart_item(
    product_id: str,
    body: UpdateCartRequest,
    session: SessionState = Depends(_get_session),
    repo: AbstractCartRepository = Depends(get_cart_repo),
) -> Cart:
    """Set the exact quantity of a cart item."""
    return repo.update_item(session, product_id, body.quantity)


# ---------------------------------------------------------------------------
# DELETE /cart/item/{product_id}
# ---------------------------------------------------------------------------

@router.delete("/item/{product_id}", response_model=Cart)
def remove_cart_item(
    product_id: str,
    session: SessionState = Depends(_get_session),
    repo: AbstractCartRepository = Depends(get_cart_repo),
) -> Cart:
    """Remove a specific item from cart. Returns updated cart."""
    return repo.remove_item(session, product_id)


# ---------------------------------------------------------------------------
# DELETE /cart
# ---------------------------------------------------------------------------

@router.delete("", response_model=Cart)
def clear_cart(
    session: SessionState = Depends(_get_session),
    repo: AbstractCartRepository = Depends(get_cart_repo),
) -> Cart:
    """Clear all items from the cart."""
    return repo.clear_cart(session)
