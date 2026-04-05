"""
PhantomShield storefront cart APIs.

All handlers are mode-agnostic and repository-driven.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.forensics.tracker import track_event
from app.models.store import AddToCartRequest, Cart, UpdateCartRequest
from app.repositories.base import AbstractCartRepository
from app.repositories.factory import _get_session, get_cart_repo
from app.session.models import SessionState

router = APIRouter(prefix="/cart", tags=["store-cart"])


@router.get("", response_model=Cart)
def get_cart(
    request: Request,
    session: SessionState = Depends(_get_session),
    repo: AbstractCartRepository = Depends(get_cart_repo),
) -> Cart:
    track_event(request, "cart_view", {"session_id": session.session_id})
    return repo.get_cart(session)


@router.post("/add", response_model=Cart)
def add_to_cart(
    request: Request,
    body: AddToCartRequest,
    session: SessionState = Depends(_get_session),
    repo: AbstractCartRepository = Depends(get_cart_repo),
) -> Cart:
    track_event(
        request,
        "add_to_cart",
        {"product_id": body.product_id, "quantity": body.quantity},
    )
    return repo.add_item(session, body.product_id, body.quantity)


@router.patch("/item/{product_id}", response_model=Cart)
def update_cart_item(
    request: Request,
    product_id: str,
    body: UpdateCartRequest,
    session: SessionState = Depends(_get_session),
    repo: AbstractCartRepository = Depends(get_cart_repo),
) -> Cart:
    track_event(
        request,
        "update_quantity",
        {"product_id": product_id, "quantity": body.quantity},
    )
    return repo.update_item(session, product_id, body.quantity)


@router.delete("/item/{product_id}", response_model=Cart)
def remove_cart_item(
    request: Request,
    product_id: str,
    session: SessionState = Depends(_get_session),
    repo: AbstractCartRepository = Depends(get_cart_repo),
) -> Cart:
    track_event(request, "remove_from_cart", {"product_id": product_id})
    return repo.remove_item(session, product_id)


@router.delete("", response_model=Cart)
def clear_cart(
    request: Request,
    session: SessionState = Depends(_get_session),
    repo: AbstractCartRepository = Depends(get_cart_repo),
) -> Cart:
    track_event(request, "cart_cleared", {"session_id": session.session_id})
    return repo.clear_cart(session)
