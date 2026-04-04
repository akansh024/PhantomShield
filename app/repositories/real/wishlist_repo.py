"""
PhantomShield – Real Wishlist Repository
"""

from __future__ import annotations

from fastapi import HTTPException

from app.models.store import Wishlist, WishlistItem
from app.repositories.base import AbstractWishlistRepository
from app.repositories.real.product_repo import RealProductRepository
from app.session.models import SessionState
from app.stores import real_wishlist_store


class RealWishlistRepository(AbstractWishlistRepository):

    def __init__(self) -> None:
        self._store = real_wishlist_store
        self._products = RealProductRepository()

    def _assemble(self, session_id: str) -> list[WishlistItem]:
        raw_items = self._store.get_items(session_id)
        assembled: list[WishlistItem] = []
        for raw in raw_items:
            product = self._products.get_product(raw.product_id)
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
        items = self._assemble(session.session_id)
        return Wishlist(items=items, item_count=len(items))

    def add_item(self, session: SessionState, product_id: str) -> Wishlist:
        product = self._products.get_product(product_id)
        if product is None:
            raise HTTPException(status_code=404, detail="Product not found.")
        self._store.add_item(session.session_id, product_id)
        items = self._assemble(session.session_id)
        return Wishlist(items=items, item_count=len(items))

    def remove_item(self, session: SessionState, product_id: str) -> Wishlist:
        result = self._store.remove_item(session.session_id, product_id)
        if result is None:
            raise HTTPException(status_code=404, detail="Item not in wishlist.")
        items = self._assemble(session.session_id)
        return Wishlist(items=items, item_count=len(items))
