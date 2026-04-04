"""
PhantomShield – Store Order Routes

Handles checkout (order placement) and order history.
All handlers are mode-agnostic — repository resolves real vs decoy.

Checkout flow:
  1. POST /orders  →  read cart, validate, place order, clear cart, return Order
  2. GET  /orders  →  list all past orders for session
  3. GET  /orders/{order_id}  →  single order detail

No payment processing. Order status starts as "confirmed".
Promo codes: WELCOME10 (10% off), SAVE15 (15% off), FLAT100, FLAT200.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.models.store import Order, OrderListResponse, PlaceOrderRequest
from app.repositories.base import AbstractOrderRepository
from app.repositories.factory import get_order_repo, _get_session
from app.session.models import SessionState

router = APIRouter(prefix="/orders", tags=["store-orders"])


# ---------------------------------------------------------------------------
# POST /orders  — Place order (simulated checkout)
# ---------------------------------------------------------------------------

@router.post("", response_model=Order, status_code=201)
def place_order(
    body: PlaceOrderRequest,
    session: SessionState = Depends(_get_session),
    repo: AbstractOrderRepository = Depends(get_order_repo),
) -> Order:
    """
    Simulated checkout endpoint.

    Reads the current cart, validates it is non-empty, applies any promo
    discount, generates an order ID, clears the cart, and returns the
    confirmed order. No payment is processed.

    Valid promo codes: WELCOME10, SAVE15, FLAT100, FLAT200
    """
    return repo.place_order(session, body)


# ---------------------------------------------------------------------------
# GET /orders  — List all orders for session
# ---------------------------------------------------------------------------

@router.get("", response_model=OrderListResponse)
def list_orders(
    session: SessionState = Depends(_get_session),
    repo: AbstractOrderRepository = Depends(get_order_repo),
) -> OrderListResponse:
    """Return all past orders for this session, newest first."""
    orders = repo.list_orders(session)
    return OrderListResponse(orders=orders, total=len(orders))


# ---------------------------------------------------------------------------
# GET /orders/{order_id}  — Single order detail
# ---------------------------------------------------------------------------

@router.get("/{order_id}", response_model=Order)
def get_order(
    order_id: str,
    session: SessionState = Depends(_get_session),
    repo: AbstractOrderRepository = Depends(get_order_repo),
) -> Order:
    """Return detail for a specific order. 404 if not found or not owned by session."""
    order = repo.get_order(session, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found.")
    return order
