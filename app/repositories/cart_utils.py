"""
PhantomShield – Cart Assembly Utilities

Shared cart response builder used by both real and decoy repos.
Keeps calculation logic DRY without coupling real to decoy.
"""

from __future__ import annotations

from app.models.store import Cart, CartItem

_FREE_DELIVERY_THRESHOLD = 499.0
_DELIVERY_FEE = 49.0


def build_cart_response(items: list[CartItem]) -> Cart:
    """
    Compute subtotal, delivery fee, and total from a list of CartItems.

    Delivery is free for orders over ₹499.
    No promo code discount at this stage (applied during checkout).
    """
    subtotal = round(sum(i.price * i.quantity for i in items), 2)
    delivery_fee = 0.0 if subtotal >= _FREE_DELIVERY_THRESHOLD else _DELIVERY_FEE
    total = round(subtotal + delivery_fee, 2)
    item_count = sum(i.quantity for i in items)

    return Cart(
        items=items,
        subtotal=subtotal,
        discount=0.0,
        delivery_fee=delivery_fee,
        total=total,
        item_count=item_count,
    )
