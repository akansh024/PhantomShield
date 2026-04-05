"""
PhantomShield – Store Pydantic Models

Defines the request/response schemas for the e-commerce store API.

Design rules:
- These models are shared across real and decoy paths
- Response shapes MUST be identical for both routing states
- No routing_state field is ever included in any response model
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Catalog Models
# ---------------------------------------------------------------------------


class Category(BaseModel):
    id: str
    label: str
    icon: str
    product_count: int


class Product(BaseModel):
    id: str
    name: str
    slug: str
    category: str
    subcategory: str
    brand: str
    price: float
    original_price: float
    discount_percent: int
    currency: str = "INR"
    rating: float
    review_count: int
    stock: int
    thumbnail: str
    images: list[str]
    short_description: str
    description: str
    specs: dict[str, str] = Field(default_factory=dict)
    tags: list[str] = Field(default_factory=list)
    is_featured: bool = False
    created_at: str


class ProductFilters(BaseModel):
    q: str | None = None
    category: str | None = None
    min_price: float | None = None
    max_price: float | None = None
    min_rating: float | None = None
    in_stock_only: bool = False
    sort_by: Literal[
        "relevance", "price_asc", "price_desc", "rating", "newest"
    ] = "relevance"
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=50)


class ProductListResponse(BaseModel):
    items: list[Product]
    total: int
    page: int
    limit: int
    has_next: bool


# ---------------------------------------------------------------------------
# Cart Models
# ---------------------------------------------------------------------------


class CartItem(BaseModel):
    cart_item_id: str
    product_id: str
    name: str
    thumbnail: str
    price: float
    original_price: float
    quantity: int
    subtotal: float


class Cart(BaseModel):
    items: list[CartItem] = Field(default_factory=list)
    subtotal: float = 0.0
    discount: float = 0.0
    delivery_fee: float = 0.0
    total: float = 0.0
    item_count: int = 0


class AddToCartRequest(BaseModel):
    product_id: str
    quantity: int = Field(default=1, ge=1)


class UpdateCartRequest(BaseModel):
    quantity: int = Field(ge=1)


# ---------------------------------------------------------------------------
# Wishlist Models
# ---------------------------------------------------------------------------


class WishlistItem(BaseModel):
    wishlist_item_id: str
    product_id: str
    name: str
    thumbnail: str
    price: float
    original_price: float
    added_at: datetime


class Wishlist(BaseModel):
    items: list[WishlistItem] = Field(default_factory=list)
    item_count: int = 0


class AddToWishlistRequest(BaseModel):
    product_id: str


# ---------------------------------------------------------------------------
# Order Models
# ---------------------------------------------------------------------------


class ShippingAddress(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=10, max_length=15)
    line1: str = Field(min_length=5, max_length=200)
    line2: str = ""
    city: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)
    pin: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class OrderItem(BaseModel):
    product_id: str
    name: str
    thumbnail: str
    quantity: int
    unit_price: float
    subtotal: float


class Order(BaseModel):
    order_id: str
    status: Literal["confirmed", "processing", "shipped", "delivered"] = "confirmed"
    items: list[OrderItem]
    subtotal: float
    discount: float = 0.0
    delivery_fee: float = 0.0
    total: float
    shipping_address: ShippingAddress
    delivery_note: str = ""
    estimated_delivery: str
    placed_at: datetime


class PlaceOrderRequest(BaseModel):
    shipping_address: ShippingAddress
    delivery_note: str = ""
    promo_code: str = ""


class OrderListResponse(BaseModel):
    orders: list[Order]
    total: int
