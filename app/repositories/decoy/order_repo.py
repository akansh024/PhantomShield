"""
PhantomShield – Decoy Order Repository

Structurally identical to RealOrderRepository.
Key differences:
  1. Reads from decoy_cart_store (fully isolated)
  2. Reads from decoy product catalog
  3. Stores in decoy_order_store (fully isolated)
  4. Clears decoy_cart_store (never touches real cart)
  5. Logs every step to forensics:
       - checkout_attempt (on POST /orders)
       - order_placed     (on successful order)

The attacker sees a real-looking order confirmation.
PhantomShield sees every action they took.
"""

from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException

from app.models.store import (
    CartItem,
    Order,
    OrderItem,
    PlaceOrderRequest,
)
from app.repositories.base import AbstractOrderRepository
from app.repositories.cart_utils import build_cart_response
from app.repositories.decoy.product_repo import _load_products
from app.repositories.order_utils import (
    estimate_delivery,
    generate_order_id,
    resolve_promo_discount,
)
from app.session.models import SessionState
from app.stores import decoy_cart_store, decoy_order_store


def _assemble_decoy_cart_items(session_id: str) -> list[CartItem]:
    """Read raw decoy cart items and join with decoy product catalog."""
    products = _load_products()
    raw_items = decoy_cart_store.get_items(session_id)
    assembled: list[CartItem] = []
    for raw in raw_items:
        product = next((p for p in products if p.id == raw.product_id), None)
        if product is None:
            continue
        assembled.append(
            CartItem(
                cart_item_id=raw.cart_item_id,
                product_id=raw.product_id,
                name=product.name,
                thumbnail=product.thumbnail,
                price=product.price,
                original_price=product.original_price,
                quantity=raw.quantity,
                subtotal=round(product.price * raw.quantity, 2),
            )
        )
    return assembled


class DecoyOrderRepository(AbstractOrderRepository):

    def __init__(self, session: SessionState) -> None:
        self._session = session

    def _log(self, action: str, payload: dict | None = None) -> None:
        from app.forensics.store_logger import log_store_event
        log_store_event(
            self._session,
            action=action,
            route="/api/store/orders",
            payload=payload,
        )

    def place_order(
        self, session: SessionState, request: PlaceOrderRequest
    ) -> Order:
        # Log checkout attempt before any validation
        self._log(
            "checkout_attempt",
            {
                "shipping_city": request.shipping_address.city,
                "shipping_state": request.shipping_address.state,
                "promo_code": request.promo_code or None,
            },
        )

        # 1. Build cart from decoy store
        cart_items = _assemble_decoy_cart_items(session.session_id)
        if not cart_items:
            raise HTTPException(
                status_code=400,
                detail="Your cart is empty. Add items before placing an order.",
            )

        cart = build_cart_response(cart_items)

        # 2. Apply promo discount
        discount = resolve_promo_discount(request.promo_code, cart.subtotal)
        total = round(cart.subtotal - discount + cart.delivery_fee, 2)

        # 3. Assemble order items
        order_items = [
            OrderItem(
                product_id=item.product_id,
                name=item.name,
                thumbnail=item.thumbnail,
                quantity=item.quantity,
                unit_price=item.price,
                subtotal=item.subtotal,
            )
            for item in cart_items
        ]

        # 4. Create decoy order
        order = Order(
            order_id=generate_order_id(),
            status="confirmed",
            items=order_items,
            subtotal=cart.subtotal,
            discount=discount,
            delivery_fee=cart.delivery_fee,
            total=total,
            shipping_address=request.shipping_address,
            delivery_note=request.delivery_note,
            estimated_delivery=estimate_delivery(business_days=4),
            placed_at=datetime.utcnow(),
        )

        # 5. Persist in decoy store
        decoy_order_store.add_order(session.session_id, order)

        # 6. Clear decoy cart
        decoy_cart_store.clear(session.session_id)

        # 7. Log successful placement — HIGH-VALUE forensic event
        self._log(
            "order_placed",
            {
                "order_id": order.order_id,
                "item_count": len(order_items),
                "total": order.total,
                "discount": discount,
                "items": [
                    {"product_id": i.product_id, "name": i.name, "qty": i.quantity}
                    for i in order_items
                ],
                "shipping_address": {
                    "full_name": request.shipping_address.full_name,
                    "phone": request.shipping_address.phone,
                    "city": request.shipping_address.city,
                    "state": request.shipping_address.state,
                    "pin": request.shipping_address.pin,
                },
            },
        )

        return order

    def list_orders(self, session: SessionState) -> list[Order]:
        self._log("order_history_view")
        return decoy_order_store.get_orders(session.session_id)

    def get_order(self, session: SessionState, order_id: str) -> Order | None:
        order = decoy_order_store.get_order(session.session_id, order_id)
        self._log(
            "order_detail_view",
            {"order_id": order_id, "found": order is not None},
        )
        return order
