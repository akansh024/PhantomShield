"""
PhantomShield – Decoy Wishlist Repository

Identical interface to RealWishlistRepository.
Uses decoy_wishlist_store + decoy catalog + forensic logging.
"""

from __future__ import annotations

from fastapi import HTTPException

from app.models.store import Wishlist, WishlistItem
from app.repositories.base import AbstractWishlistRepository
from app.repositories.decoy.product_repo import _load_products
from app.session.models import SessionState
from app.stores import decoy_wishlist_store


class DecoyWishlistRepository(AbstractWishlistRepository):

    def __init__(self, session: SessionState) -> None:
        self._session = session
        self._store = decoy_wishlist_store

    def _log(self, action: str, payload: dict | None = None) -> None:
        from app.forensics.store_logger import log_store_event
        log_store_event(
            self._session,
            action=action,
            route="/api/store/wishlist",
            payload=payload,
        )

    def _assemble(self, session_id: str) -> list[WishlistItem]:
        raw_items = self._store.get_items(session_id)
        products = _load_products()
        assembled: list[WishlistItem] = []
        for raw in raw_items:
            product = next((p for p in products if p.id == raw.product_id), None)
            if product is None:
                continue
            assembled.append(
                WishlistItem(
                    wishlist_item_id=raw.wishlist_item_id,
                    product_id=raw.product_id,
                    name=product.name,
                    thumbnail=product.thumbnail,
                    price=product.price,
                    original_price=product.original_price,
                    added_at=raw.added_at,
                )
            )
        return assembled

    def get_wishlist(self, session: SessionState) -> Wishlist:
        self._log("wishlist_view")
        items = self._assemble(session.session_id)
        return Wishlist(items=items, item_count=len(items))

    def add_item(self, session: SessionState, product_id: str) -> Wishlist:
        products = _load_products()
        product = next((p for p in products if p.id == product_id), None)
        if product is None:
            raise HTTPException(status_code=404, detail="Product not found.")

        self._store.add_item(session.session_id, product_id)
        self._log(
            "add_to_wishlist",
            {"product_id": product_id, "product_name": product.name},
        )
        items = self._assemble(session.session_id)
        return Wishlist(items=items, item_count=len(items))

    def remove_item(self, session: SessionState, product_id: str) -> Wishlist:
        result = self._store.remove_item(session.session_id, product_id)
        if result is None:
            raise HTTPException(status_code=404, detail="Item not in wishlist.")
        self._log("remove_from_wishlist", {"product_id": product_id})
        items = self._assemble(session.session_id)
        return Wishlist(items=items, item_count=len(items))
