"""
PhantomShield – Real Product Repository

Loads product catalog from app/data/real/products.json.
Products are cached at module level — loaded once, served forever.

This class has NO knowledge of routing state.
The factory (repositories/factory.py) decides when to instantiate it.
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


# ---------------------------------------------------------------------------
# Data paths
# ---------------------------------------------------------------------------

_DATA_DIR = Path(__file__).resolve().parents[3] / "app" / "data" / "real"


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

class RealProductRepository(AbstractProductRepository):
    """
    Serves real product data to legitimate sessions.
    """

    def _all(self) -> list[Product]:
        return _load_products()

    def _filter_and_sort(
        self, products: list[Product], filters: ProductFilters
    ) -> list[Product]:
        result = products[:]

        # --- Text search ---
        if filters.q:
            q = filters.q.lower()
            result = [
                p for p in result
                if q in p.name.lower()
                or q in p.short_description.lower()
                or q in p.brand.lower()
                or any(q in t for t in p.tags)
            ]

        # --- Category ---
        if filters.category:
            result = [p for p in result if p.category == filters.category]

        # --- Price range ---
        if filters.min_price is not None:
            result = [p for p in result if p.price >= filters.min_price]
        if filters.max_price is not None:
            result = [p for p in result if p.price <= filters.max_price]

        # --- Rating ---
        if filters.min_rating is not None:
            result = [p for p in result if p.rating >= filters.min_rating]

        # --- Stock ---
        if filters.in_stock_only:
            result = [p for p in result if p.stock > 0]

        # --- Sort ---
        if filters.sort_by == "price_asc":
            result.sort(key=lambda p: p.price)
        elif filters.sort_by == "price_desc":
            result.sort(key=lambda p: p.price, reverse=True)
        elif filters.sort_by == "rating":
            result.sort(key=lambda p: p.rating, reverse=True)
        elif filters.sort_by == "newest":
            result.sort(key=lambda p: p.created_at, reverse=True)
        # "relevance" — keep insertion order (JSON order = editorial order)

        return result

    def get_products(self, filters: ProductFilters) -> ProductListResponse:
        filtered = self._filter_and_sort(self._all(), filters)
        total = len(filtered)

        # Paginate
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
        return next((p for p in self._all() if p.id == product_id), None)

    def get_featured(self, limit: int = 8) -> list[Product]:
        featured = [p for p in self._all() if p.is_featured]
        return featured[:limit]

    def get_categories(self) -> list[Category]:
        return _load_categories()
