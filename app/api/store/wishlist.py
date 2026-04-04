"""
PhantomShield – Store Wishlist Routes

Mode-agnostic wishlist endpoints. Repository resolved by factory.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.models.store import AddToWishlistRequest, Wishlist
from app.repositories.base import AbstractWishlistRepository
from app.repositories.factory import get_wishlist_repo, _get_session
from app.session.models import SessionState

router = APIRouter(prefix="/wishlist", tags=["store-wishlist"])


# ---------------------------------------------------------------------------
# GET /wishlist
# ---------------------------------------------------------------------------

@router.get("", response_model=Wishlist)
def get_wishlist(
    session: SessionState = Depends(_get_session),
    repo: AbstractWishlistRepository = Depends(get_wishlist_repo),
) -> Wishlist:
    """Return the current session's wishlist."""
    return repo.get_wishlist(session)


# ---------------------------------------------------------------------------
# POST /wishlist/add
# ---------------------------------------------------------------------------

@router.post("/add", response_model=Wishlist)
def add_to_wishlist(
    body: AddToWishlistRequest,
    session: SessionState = Depends(_get_session),
    repo: AbstractWishlistRepository = Depends(get_wishlist_repo),
) -> Wishlist:
    """
    Add a product to wishlist. No-op if already present (idempotent).
    Returns updated wishlist.
    """
    return repo.add_item(session, body.product_id)


# ---------------------------------------------------------------------------
# DELETE /wishlist/{product_id}
# ---------------------------------------------------------------------------

@router.delete("/{product_id}", response_model=Wishlist)
def remove_from_wishlist(
    product_id: str,
    session: SessionState = Depends(_get_session),
    repo: AbstractWishlistRepository = Depends(get_wishlist_repo),
) -> Wishlist:
    """Remove a product from wishlist. Returns updated wishlist."""
    return repo.remove_item(session, product_id)
