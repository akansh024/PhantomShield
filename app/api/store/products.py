"""
PhantomShield storefront product APIs.

Route handlers never access JSON or database layers directly.
All catalog reads are delegated to repositories from the factory.
"""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.forensics.tracker import track_event
from app.models.store import Category, Product, ProductFilters, ProductListResponse
from app.repositories.base import AbstractProductRepository
from app.repositories.factory import get_product_repo

router = APIRouter(tags=["store-products"])


def _track_listing_events(
    request: Request,
    *,
    q: str | None,
    category: str | None,
    min_price: float | None,
    max_price: float | None,
    min_rating: float | None,
    in_stock_only: bool,
    sort_by: str,
    page: int,
    limit: int,
) -> None:
    track_event(
        request,
        "products_list_view",
        {
            "q": q,
            "category": category,
            "sort_by": sort_by,
            "page": page,
            "limit": limit,
        },
    )

    if q:
        track_event(request, "search_query", {"query": q, "page": page, "limit": limit})

    filters_used = any(
        [
            category is not None,
            min_price is not None,
            max_price is not None,
            min_rating is not None,
            in_stock_only,
            sort_by != "relevance",
        ]
    )
    if filters_used:
        track_event(
            request,
            "filter_applied",
            {
                "category": category,
                "min_price": min_price,
                "max_price": max_price,
                "min_rating": min_rating,
                "in_stock_only": in_stock_only,
                "sort_by": sort_by,
            },
        )

    if page > 1:
        track_event(request, "pagination_click", {"page": page, "limit": limit})


@router.get("/products", response_model=ProductListResponse)
def list_products(
    request: Request,
    q: str | None = Query(default=None, description="Search query"),
    category: str | None = Query(default=None, description="Filter by category ID"),
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    min_rating: float | None = Query(default=None, ge=0, le=5),
    in_stock_only: bool = Query(default=False),
    sort_by: Literal[
        "relevance", "price_asc", "price_desc", "rating", "newest"
    ] = Query(default="relevance"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=50),
    repo: AbstractProductRepository = Depends(get_product_repo),
) -> ProductListResponse:
    filters = ProductFilters(
        q=q,
        category=category,
        min_price=min_price,
        max_price=max_price,
        min_rating=min_rating,
        in_stock_only=in_stock_only,
        sort_by=sort_by,
        page=page,
        limit=limit,
    )

    _track_listing_events(
        request,
        q=q,
        category=category,
        min_price=min_price,
        max_price=max_price,
        min_rating=min_rating,
        in_stock_only=in_stock_only,
        sort_by=sort_by,
        page=page,
        limit=limit,
    )

    return repo.get_products(filters)


@router.get("/products/featured", response_model=list[Product])
def list_featured_products(
    request: Request,
    limit: int = Query(default=8, ge=1, le=20),
    repo: AbstractProductRepository = Depends(get_product_repo),
) -> list[Product]:
    track_event(request, "product_view", {"type": "featured", "limit": limit})
    return repo.get_featured(limit=limit)


@router.get("/products/{product_id}", response_model=Product)
def get_product(
    request: Request,
    product_id: str,
    repo: AbstractProductRepository = Depends(get_product_repo),
) -> Product:
    product = repo.get_product(product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found.")

    track_event(
        request,
        "product_view",
        {
            "product_id": product.id,
            "product_name": product.name,
            "category": product.category,
        },
    )
    return product


@router.get("/categories", response_model=list[Category])
def list_categories(
    request: Request,
    repo: AbstractProductRepository = Depends(get_product_repo),
) -> list[Category]:
    track_event(request, "category_list", {})
    return repo.get_categories()
