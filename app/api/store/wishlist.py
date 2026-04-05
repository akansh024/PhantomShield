"""
PhantomShield storefront wishlist APIs.

All handlers are mode-agnostic and repository-driven.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.forensics.tracker import track_event
from app.models.store import AddToWishlistRequest, Wishlist
from app.repositories.base import AbstractWishlistRepository
from app.repositories.factory import _get_session, get_wishlist_repo
from app.session.models import SessionState

router = APIRouter(prefix="/wishlist", tags=["store-wishlist"])


@router.get("", response_model=Wishlist)
def get_wishlist(
    request: Request,
    session: SessionState = Depends(_get_session),
    repo: AbstractWishlistRepository = Depends(get_wishlist_repo),
) -> Wishlist:
    track_event(request, "wishlist_view", {"session_id": session.session_id})
    return repo.get_wishlist(session)


@router.post("/add", response_model=Wishlist)
def add_to_wishlist(
    request: Request,
    body: AddToWishlistRequest,
    session: SessionState = Depends(_get_session),
    repo: AbstractWishlistRepository = Depends(get_wishlist_repo),
) -> Wishlist:
    track_event(request, "wishlist_add", {"product_id": body.product_id})
    return repo.add_item(session, body.product_id)


@router.delete("/{product_id}", response_model=Wishlist)
def remove_from_wishlist(
    request: Request,
    product_id: str,
    session: SessionState = Depends(_get_session),
    repo: AbstractWishlistRepository = Depends(get_wishlist_repo),
) -> Wishlist:
    track_event(request, "wishlist_remove", {"product_id": product_id})
    return repo.remove_item(session, product_id)
