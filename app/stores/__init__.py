"""
PhantomShield – Stores Package

Exposes six singleton store instances, strictly isolated by mode:

  real_cart_store      → RealCartRepository only
  decoy_cart_store     → DecoyCartRepository only
  real_wishlist_store  → RealWishlistRepository only
  decoy_wishlist_store → DecoyWishlistRepository only
  real_order_store     → RealOrderRepository only
  decoy_order_store    → DecoyOrderRepository only

These are NEVER cross-accessed. factory.py controls which one is used.
"""

from app.stores.cart_store import InMemoryCartStore
from app.stores.wishlist_store import InMemoryWishlistStore
from app.stores.order_store import InMemoryOrderStore

real_cart_store = InMemoryCartStore()
decoy_cart_store = InMemoryCartStore()

real_wishlist_store = InMemoryWishlistStore()
decoy_wishlist_store = InMemoryWishlistStore()

real_order_store = InMemoryOrderStore()
decoy_order_store = InMemoryOrderStore()

__all__ = [
    "real_cart_store",
    "decoy_cart_store",
    "real_wishlist_store",
    "decoy_wishlist_store",
    "real_order_store",
    "decoy_order_store",
]

