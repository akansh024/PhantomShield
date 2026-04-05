"""
PhantomShield – In-Memory Order Store

Session-scoped order storage. Stores fully assembled Order objects.
Two module-level singleton instances: real_order_store, decoy_order_store.

Design note:
  Orders are stored after placement and never deleted per-session.
  This gives the user a persistent order history for the session lifetime.
"""

from __future__ import annotations

from app.models.store import Order


class InMemoryOrderStore:

    def __init__(self) -> None:
        self._data: dict[str, list[Order]] = {}

    def _bucket(self, session_id: str) -> list[Order]:
        if session_id not in self._data:
            self._data[session_id] = []
        return self._data[session_id]

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    def add_order(self, session_id: str, order: Order) -> None:
        self._bucket(session_id).append(order)

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    def get_orders(self, session_id: str) -> list[Order]:
        """Return all orders for session, newest first."""
        return list(reversed(self._bucket(session_id)))

    def get_order(self, session_id: str, order_id: str) -> Order | None:
        return next(
            (o for o in self._bucket(session_id) if o.order_id == order_id),
            None,
        )

    def rebind_session(self, old_session_id: str, new_session_id: str) -> None:
        """
        Move order history from old session to new session.
        """
        if old_session_id == new_session_id:
            return

        old_bucket = self._data.pop(old_session_id, None)
        if not old_bucket:
            return

        new_bucket = self._bucket(new_session_id)
        new_bucket.extend(old_bucket)

    def count(self, session_id: str) -> int:
        return len(self._bucket(session_id))
