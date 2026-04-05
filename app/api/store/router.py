"""
PhantomShield – Store API Router

Mounts all store sub-routers under /api/store.
"""

from fastapi import APIRouter

from app.api.store.products import router as products_router
from app.api.store.cart import router as cart_router
from app.api.store.wishlist import router as wishlist_router
from app.api.store.orders import router as orders_router

router = APIRouter(prefix="/api/store")

# Phase 1 — Products
router.include_router(products_router)

# Phase 2 — Cart + Wishlist
router.include_router(cart_router)
router.include_router(wishlist_router)

# Phase 3 — Orders
router.include_router(orders_router)

