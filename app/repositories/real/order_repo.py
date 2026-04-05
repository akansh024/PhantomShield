"""
PhantomShield – Real Order Repository

Handles order placement for legitimate sessions:
  1. Reads cart from real_cart_store
  2. Validates cart is not empty
  3. Assembles Order from CartItems + ShippingAddress
  4. Applies promo code discount if provided
  5. Stores Order in real_order_store
  6. Clears real_cart_store for this session
  7. Returns completed Order

Order history and single-order lookup are scoped to session_id.
"""

from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException

from app.models.store import (
    Cart,
    CartItem,
    Order,
    OrderItem,
    PlaceOrderRequest,
)
from app.repositories.base import AbstractOrderRepository
from app.repositories.cart_utils import build_cart_response
from app.repositories.order_utils import (
    estimate_delivery,
    generate_order_id,
    resolve_promo_discount,
)
from app.repositories.real.product_repo import RealProductRepository
from app.session.models import SessionState
from app.stores import real_cart_store, real_order_store


def _assemble_cart_items(session_id: str) -> list[CartItem]:
    """Read raw cart items and join with real product catalog."""
    products = RealProductRepository()
    raw_items = real_cart_store.get_items(session_id)
    assembled: list[CartItem] = []
    for raw in raw_items:
        product = products.get_product(raw.product_id)
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


class RealOrderRepository(AbstractOrderRepository):

    def place_order(
        self, session: SessionState, request: PlaceOrderRequest
    ) -> Order:
        # 1. Build cart
        cart_items = _assemble_cart_items(session.session_id)
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

        # 4. Create order
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

        # 5. Persist order
        real_order_store.add_order(session.session_id, order)

        # 6. Clear cart after successful order
        real_cart_store.clear(session.session_id)

        return order

    def list_orders(self, session: SessionState) -> list[Order]:
        return real_order_store.get_orders(session.session_id)

    def get_order(self, session: SessionState, order_id: str) -> Order | None:
        return real_order_store.get_order(session.session_id, order_id)
