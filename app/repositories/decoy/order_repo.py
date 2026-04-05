"""
PhantomShield decoy order repository.

Decoy checkout always provides a believable success path and logs
high-value behavioral details for forensics.
"""

from __future__ import annotations

import random
from datetime import datetime

from app.models.store import CartItem, Order, OrderItem, PlaceOrderRequest
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


def _build_fallback_cart_items() -> list[CartItem]:
    """
    Generate believable cart items when decoy checkout starts with an empty cart.
    """
    products = _load_products()
    if not products:
        return []

    sample_size = random.randint(1, min(2, len(products)))
    picked = random.sample(products, k=sample_size)
    items: list[CartItem] = []
    for index, product in enumerate(picked, start=1):
        qty = random.randint(1, 2)
        items.append(
            CartItem(
                cart_item_id=f"decoy-cart-{index}",
                product_id=product.id,
                name=product.name,
                thumbnail=product.thumbnail,
                price=product.price,
                original_price=product.original_price,
                quantity=qty,
                subtotal=round(product.price * qty, 2),
            )
        )
    return items


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

    def place_order(self, session: SessionState, request: PlaceOrderRequest) -> Order:
        self._log(
            "checkout_start",
            {
                "shipping_city": request.shipping_address.city,
                "shipping_state": request.shipping_address.state,
                "promo_code": request.promo_code or None,
            },
        )

        cart_items = _assemble_decoy_cart_items(session.session_id)
        fabricated = False
        if not cart_items:
            cart_items = _build_fallback_cart_items()
            fabricated = True

        cart = build_cart_response(cart_items)
        discount = resolve_promo_discount(request.promo_code, cart.subtotal)
        total = round(cart.subtotal - discount + cart.delivery_fee, 2)

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

        decoy_order_store.add_order(session.session_id, order)
        decoy_cart_store.clear(session.session_id)

        self._log(
            "checkout_complete",
            {
                "order_id": order.order_id,
                "item_count": len(order_items),
                "total": order.total,
                "discount": discount,
                "fabricated_from_empty_cart": fabricated,
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
        orders = decoy_order_store.get_orders(session.session_id)
        if orders:
            return orders

        # If no orders exist yet, return believable decoy history.
        fallback = self.place_order(
            session,
            PlaceOrderRequest(
                shipping_address={
                    "full_name": "A. Customer",
                    "phone": "9999999999",
                    "line1": "42 Market Street",
                    "line2": "",
                    "city": "Mumbai",
                    "state": "Maharashtra",
                    "pin": "400001",
                },
                delivery_note="",
                promo_code="WELCOME10",
            ),
        )
        return [fallback]

    def get_order(self, session: SessionState, order_id: str) -> Order | None:
        order = decoy_order_store.get_order(session.session_id, order_id)
        self._log("order_detail_view", {"order_id": order_id, "found": order is not None})
        return order
