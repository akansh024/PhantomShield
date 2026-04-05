"""
PhantomShield – Abstract Repository Interfaces

Defines the contracts that both RealProductRepository and
DecoyProductRepository must fulfill.

Rules:
- No routing logic lives here
- No JSON loading lives here
- No reference to "real" or "decoy" in method signatures
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from app.models.store import (
    Cart,
    Order,
    PlaceOrderRequest,
    Product,
    ProductFilters,
    ProductListResponse,
    Wishlist,
    Category,
)
from app.session.models import SessionState


class AbstractProductRepository(ABC):

    @abstractmethod
    def get_products(self, filters: ProductFilters) -> ProductListResponse:
        ...

    # Backward-compatible alias while we migrate call-sites.
    def list_products(self, filters: ProductFilters) -> ProductListResponse:
        return self.get_products(filters)

    @abstractmethod
    def get_product(self, product_id: str) -> Product | None:
        ...

    @abstractmethod
    def get_featured(self, limit: int = 8) -> list[Product]:
        ...

    @abstractmethod
    def get_categories(self) -> list[Category]:
        ...


class AbstractCartRepository(ABC):

    @abstractmethod
    def get_cart(self, session: SessionState) -> Cart:
        ...

    @abstractmethod
    def add_item(self, session: SessionState, product_id: str, quantity: int) -> Cart:
        ...

    @abstractmethod
    def update_item(self, session: SessionState, product_id: str, quantity: int) -> Cart:
        ...

    @abstractmethod
    def remove_item(self, session: SessionState, product_id: str) -> Cart:
        ...

    @abstractmethod
    def clear_cart(self, session: SessionState) -> Cart:
        ...


class AbstractWishlistRepository(ABC):

    @abstractmethod
    def get_wishlist(self, session: SessionState) -> Wishlist:
        ...

    @abstractmethod
    def add_item(self, session: SessionState, product_id: str) -> Wishlist:
        ...

    @abstractmethod
    def remove_item(self, session: SessionState, product_id: str) -> Wishlist:
        ...


class AbstractOrderRepository(ABC):

    @abstractmethod
    def place_order(
        self, session: SessionState, request: PlaceOrderRequest
    ) -> Order:
        ...

    @abstractmethod
    def list_orders(self, session: SessionState) -> list[Order]:
        ...

    @abstractmethod
    def get_order(self, session: SessionState, order_id: str) -> Order | None:
        ...
