"""
PhantomShield – In-Memory Cart Store

Raw session-scoped cart data store.
Stores only product_id + quantity — product details are looked up
at response assembly time from the product catalog.

Two module-level singleton instances are created:
  real_cart_store  → used by RealCartRepository
  decoy_cart_store → used by DecoyCartRepository

They are NEVER mixed. The factory decides which one to pass.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime


# ---------------------------------------------------------------------------
# Raw data model (internal — never serialised to JSON directly)
# ---------------------------------------------------------------------------

@dataclass
class RawCartItem:
    cart_item_id: str
    product_id: str
    quantity: int
    added_at: datetime = field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Store
# ---------------------------------------------------------------------------

class InMemoryCartStore:
    """
    Thread-safe (CPython GIL) in-memory cart store keyed by session_id.
    """

    def __init__(self) -> None:
        self._data: dict[str, list[RawCartItem]] = {}

    def _bucket(self, session_id: str) -> list[RawCartItem]:
        if session_id not in self._data:
            self._data[session_id] = []
        return self._data[session_id]

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    def get_items(self, session_id: str) -> list[RawCartItem]:
        return self._bucket(session_id)[:]

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    def add_or_increment(
        self, session_id: str, product_id: str, quantity: int
    ) -> list[RawCartItem]:
        """
        Add a product. If it already exists, increment quantity.
        Returns updated item list.
        """
        bucket = self._bucket(session_id)
        existing = next((i for i in bucket if i.product_id == product_id), None)
        if existing:
            existing.quantity += quantity
        else:
            bucket.append(
                RawCartItem(
                    cart_item_id=str(uuid.uuid4()),
                    product_id=product_id,
                    quantity=quantity,
                )
            )
        return bucket[:]

    def set_quantity(
        self, session_id: str, product_id: str, quantity: int
    ) -> list[RawCartItem] | None:
        """
        Set exact quantity. Returns None if product not in cart.
        """
        bucket = self._bucket(session_id)
        item = next((i for i in bucket if i.product_id == product_id), None)
        if item is None:
            return None
        item.quantity = quantity
        return bucket[:]

    def remove_item(
        self, session_id: str, product_id: str
    ) -> list[RawCartItem] | None:
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

    # ------------------------------------------------------------------
    # Introspection
    # ------------------------------------------------------------------

    def session_count(self) -> int:
        return len(self._data)
