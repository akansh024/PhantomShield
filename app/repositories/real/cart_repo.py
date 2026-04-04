"""
PhantomShield – Real Cart Repository

Manages cart state for legitimate sessions.
Uses real_cart_store (isolated from decoy) and real product catalog.
"""

from __future__ import annotations

from fastapi import HTTPException

from app.models.store import Cart, CartItem
from app.repositories.base import AbstractCartRepository
from app.repositories.cart_utils import build_cart_response
from app.repositories.real.product_repo import RealProductRepository
from app.session.models import SessionState
from app.stores import real_cart_store


class RealCartRepository(AbstractCartRepository):

    def __init__(self) -> None:
        self._store = real_cart_store
        self._products = RealProductRepository()

    # ------------------------------------------------------------------
    # Assembly helper — joins raw store items with product catalog
    # ------------------------------------------------------------------

    def _assemble(self, session_id: str) -> list[CartItem]:
        raw_items = self._store.get_items(session_id)
        assembled: list[CartItem] = []
        for raw in raw_items:
            product = self._products.get_product(raw.product_id)
            if product is None:
                # Product removed from catalog — skip silently
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

    # ------------------------------------------------------------------
    # AbstractCartRepository implementation
    # ------------------------------------------------------------------

    def get_cart(self, session: SessionState) -> Cart:
        return build_cart_response(self._assemble(session.session_id))

    def add_item(
        self, session: SessionState, product_id: str, quantity: int
    ) -> Cart:
        product = self._products.get_product(product_id)
        if product is None:
            raise HTTPException(status_code=404, detail="Product not found.")
        if product.stock == 0:
            raise HTTPException(status_code=409, detail="Product is out of stock.")

        self._store.add_or_increment(session.session_id, product_id, quantity)
        return build_cart_response(self._assemble(session.session_id))

    def update_item(
        self, session: SessionState, product_id: str, quantity: int
    ) -> Cart:
        result = self._store.set_quantity(session.session_id, product_id, quantity)
        if result is None:
            raise HTTPException(status_code=404, detail="Item not in cart.")
        return build_cart_response(self._assemble(session.session_id))

    def remove_item(self, session: SessionState, product_id: str) -> Cart:
        result = self._store.remove_item(session.session_id, product_id)
        if result is None:
            raise HTTPException(status_code=404, detail="Item not in cart.")
        return build_cart_response(self._assemble(session.session_id))

    def clear_cart(self, session: SessionState) -> Cart:
        self._store.clear(session.session_id)
        return build_cart_response([])
