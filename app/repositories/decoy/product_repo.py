"""
PhantomShield – Decoy Product Repository

Structurally identical to RealProductRepository.
Key differences:
1. Reads from app/data/decoy/products.json
2. Calls log_store_event() for every read operation

The caller (factory.py) passes the SessionState so this
repository can write forensic events without any special wiring.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from app.models.store import (
    Category,
    Product,
    ProductFilters,
    ProductListResponse,
)
from app.repositories.base import AbstractProductRepository
from app.session.models import SessionState


# ---------------------------------------------------------------------------
# Data paths
# ---------------------------------------------------------------------------

_DATA_DIR = Path(__file__).resolve().parents[3] / "app" / "data" / "decoy"


# ---------------------------------------------------------------------------
# Module-level cache (load once per process)
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def _load_products() -> list[Product]:
    with open(_DATA_DIR / "products.json", encoding="utf-8") as f:
        raw = json.load(f)
    return [Product(**p) for p in raw]


@lru_cache(maxsize=1)
def _load_categories() -> list[Category]:
    with open(_DATA_DIR / "categories.json", encoding="utf-8") as f:
        raw = json.load(f)
    return [Category(**c) for c in raw]


# ---------------------------------------------------------------------------
# Repository
# ---------------------------------------------------------------------------

class DecoyProductRepository(AbstractProductRepository):
    """
    Serves fake product data to suspicious sessions.
    Logs every interaction to the forensics pipeline.
    """

    def __init__(self, session: SessionState) -> None:
        self._session = session

    def _log(self, action: str, route: str, payload: dict | None = None) -> None:
        """Fire-and-forget forensic logging. Import is lazy to avoid cycles."""
        from app.forensics.store_logger import log_store_event
        log_store_event(self._session, action=action, route=route, payload=payload)

    def _all(self) -> list[Product]:
        return _load_products()

    def _filter_and_sort(
        self, products: list[Product], filters: ProductFilters
    ) -> list[Product]:
        result = products[:]

        if filters.q:
            q = filters.q.lower()
            result = [
                p for p in result
                if q in p.name.lower()
                or q in p.short_description.lower()
                or q in p.brand.lower()
                or any(q in t for t in p.tags)
            ]
        if filters.category:
            result = [p for p in result if p.category == filters.category]
        if filters.min_price is not None:
            result = [p for p in result if p.price >= filters.min_price]
        if filters.max_price is not None:
            result = [p for p in result if p.price <= filters.max_price]
        if filters.min_rating is not None:
            result = [p for p in result if p.rating >= filters.min_rating]
        if filters.in_stock_only:
            result = [p for p in result if p.stock > 0]

        if filters.sort_by == "price_asc":
            result.sort(key=lambda p: p.price)
        elif filters.sort_by == "price_desc":
            result.sort(key=lambda p: p.price, reverse=True)
        elif filters.sort_by == "rating":
            result.sort(key=lambda p: p.rating, reverse=True)
        elif filters.sort_by == "newest":
            result.sort(key=lambda p: p.created_at, reverse=True)

        return result

    def get_products(self, filters: ProductFilters) -> ProductListResponse:
        self._log(
            action="products_list_view",
            route="/api/store/products",
            payload={
                "q": filters.q,
                "category": filters.category,
                "sort_by": filters.sort_by,
                "page": filters.page,
            },
        )
        filtered = self._filter_and_sort(self._all(), filters)
        total = len(filtered)
        start = (filters.page - 1) * filters.limit
        page_items = filtered[start : start + filters.limit]

        return ProductListResponse(
            items=page_items,
            total=total,
            page=filters.page,
            limit=filters.limit,
            has_next=(start + filters.limit) < total,
        )

    # Backward-compatible alias.
    def list_products(self, filters: ProductFilters) -> ProductListResponse:
        return self.get_products(filters)

    def get_product(self, product_id: str) -> Product | None:
        product = next((p for p in self._all() if p.id == product_id), None)
        self._log(
            action="product_view",
            route=f"/api/store/products/{product_id}",
            payload={"product_id": product_id, "found": product is not None},
        )
        return product

    def get_featured(self, limit: int = 8) -> list[Product]:
        self._log(action="featured_view", route="/api/store/products/featured")
        featured = [p for p in self._all() if p.is_featured]
        return featured[:limit]

    def get_categories(self) -> list[Category]:
        self._log(action="category_list", route="/api/store/categories")
        return _load_categories()
