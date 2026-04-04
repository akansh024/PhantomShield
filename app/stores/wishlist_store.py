"""
PhantomShield – In-Memory Wishlist Store

Session-scoped wishlist storage keyed by session_id.
Stores only product_id + metadata — details looked up at assembly time.

Two singleton instances: real_wishlist_store, decoy_wishlist_store.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class RawWishlistItem:
    wishlist_item_id: str
    product_id: str
    added_at: datetime = field(default_factory=datetime.utcnow)


class InMemoryWishlistStore:

    def __init__(self) -> None:
        self._data: dict[str, list[RawWishlistItem]] = {}

    def _bucket(self, session_id: str) -> list[RawWishlistItem]:
        if session_id not in self._data:
            self._data[session_id] = []
        return self._data[session_id]

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    def get_items(self, session_id: str) -> list[RawWishlistItem]:
        return self._bucket(session_id)[:]

    def contains(self, session_id: str, product_id: str) -> bool:
        return any(i.product_id == product_id for i in self._bucket(session_id))

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    def add_item(self, session_id: str, product_id: str) -> list[RawWishlistItem]:
        """
        Add product to wishlist. No-op if already present.
        Returns updated item list.
        """
        bucket = self._bucket(session_id)
        if not any(i.product_id == product_id for i in bucket):
            bucket.append(
                RawWishlistItem(
                    wishlist_item_id=str(uuid.uuid4()),
                    product_id=product_id,
                )
            )
        return bucket[:]

    def remove_item(
        self, session_id: str, product_id: str
    ) -> list[RawWishlistItem] | None:
        """
        Remove item. Returns None if item was not found.
        """
        bucket = self._bucket(session_id)
        original_len = len(bucket)
        self._data[session_id] = [i for i in bucket if i.product_id != product_id]
        if len(self._data[session_id]) == original_len:
            return None
        return self._data[session_id][:]

    def clear(self, session_id: str) -> None:
        self._data[session_id] = []
