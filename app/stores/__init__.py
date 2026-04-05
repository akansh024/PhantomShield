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

from app.stores.mongo_store import MongoCartStore, MongoWishlistStore, MongoOrderStore

real_cart_store = MongoCartStore(routing_state="REAL")
decoy_cart_store = MongoCartStore(routing_state="DECOY")

real_wishlist_store = MongoWishlistStore(routing_state="REAL")
decoy_wishlist_store = MongoWishlistStore(routing_state="DECOY")

real_order_store = MongoOrderStore(routing_state="REAL")
decoy_order_store = MongoOrderStore(routing_state="DECOY")

__all__ = [
    "real_cart_store",
    "decoy_cart_store",
    "real_wishlist_store",
    "decoy_wishlist_store",
    "real_order_store",
    "decoy_order_store",
]

