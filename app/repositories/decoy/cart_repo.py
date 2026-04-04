"""
PhantomShield – Decoy Cart Repository

Structurally identical to RealCartRepository.
Key differences:
  1. Uses decoy_cart_store (isolated from real)
  2. Uses decoy product catalog
  3. Logs every write action to forensics
  4. Never returns errors revealing it's fake — always behaves realistically
"""

from __future__ import annotations

from fastapi import HTTPException

from app.models.store import Cart, CartItem
from app.repositories.base import AbstractCartRepository
from app.repositories.cart_utils import build_cart_response
from app.repositories.decoy.product_repo import DecoyProductRepository
from app.session.models import SessionState
from app.stores import decoy_cart_store


class DecoyCartRepository(AbstractCartRepository):

    def __init__(self, session: SessionState) -> None:
        self._session = session
        self._store = decoy_cart_store
        self._products = DecoyProductRepository(session)

    def _log(self, action: str, payload: dict | None = None) -> None:
        from app.forensics.store_logger import log_store_event
        log_store_event(
            self._session,
            action=action,
            route="/api/store/cart",
            payload=payload,
        )

    def _assemble(self, session_id: str) -> list[CartItem]:
        raw_items = self._store.get_items(session_id)
        assembled: list[CartItem] = []
        for raw in raw_items:
            # Use product repo directly (no forensic log — already fired on add)
            from app.repositories.decoy.product_repo import _load_products
            product = next(
                (p for p in _load_products() if p.id == raw.product_id), None
            )
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

    # ------------------------------------------------------------------
    # AbstractCartRepository implementation
    # ------------------------------------------------------------------

    def get_cart(self, session: SessionState) -> Cart:
        self._log("cart_view")
        return build_cart_response(self._assemble(session.session_id))

    def add_item(
        self, session: SessionState, product_id: str, quantity: int
    ) -> Cart:
        from app.repositories.decoy.product_repo import _load_products
        product = next(
            (p for p in _load_products() if p.id == product_id), None
        )
        if product is None:
            raise HTTPException(status_code=404, detail="Product not found.")
        if product.stock == 0:
            raise HTTPException(status_code=409, detail="Product is out of stock.")

        self._store.add_or_increment(session.session_id, product_id, quantity)
        self._log(
            "add_to_cart",
            {
                "product_id": product_id,
                "product_name": product.name,
                "quantity": quantity,
                "unit_price": product.price,
            },
        )
        return build_cart_response(self._assemble(session.session_id))

    def update_item(
        self, session: SessionState, product_id: str, quantity: int
    ) -> Cart:
        result = self._store.set_quantity(session.session_id, product_id, quantity)
        if result is None:
            raise HTTPException(status_code=404, detail="Item not in cart.")
        self._log(
            "update_cart_item",
            {"product_id": product_id, "new_quantity": quantity},
        )
        return build_cart_response(self._assemble(session.session_id))

    def remove_item(self, session: SessionState, product_id: str) -> Cart:
        result = self._store.remove_item(session.session_id, product_id)
        if result is None:
            raise HTTPException(status_code=404, detail="Item not in cart.")
        self._log("remove_from_cart", {"product_id": product_id})
        return build_cart_response(self._assemble(session.session_id))

    def clear_cart(self, session: SessionState) -> Cart:
        self._store.clear(session.session_id)
        self._log("clear_cart")
        return build_cart_response([])
