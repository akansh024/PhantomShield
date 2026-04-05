"""
PhantomShield – MongoDB Store Implementations

Replaces the in-memory stores to persist cart, wishlist, and orders to MongoDB.
Maintains the exact same interface as InMemoryCartStore, etc., but maps
the reads and writes to collections specified in config.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from threading import Lock
from typing import Any

from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.collection import Collection

from app.core.config import get_settings
from app.stores.cart_store import RawCartItem
from app.stores.wishlist_store import RawWishlistItem
from app.models.store import Order, OrderItem, ShippingAddress


class MongoStoreBase:
    _client_lock = Lock()
    _client: MongoClient | None = None
    _db: Any = None

    @classmethod
    def get_collection(cls, collection_name: str) -> Collection | None:
        with cls._client_lock:
            if cls._client is None:
                settings = get_settings()
                if not settings.mongodb_uri:
                    return None
                cls._client = MongoClient(
                    settings.mongodb_uri,
                    serverSelectionTimeoutMS=settings.mongodb_timeout_ms,
                )
                cls._db = cls._client[settings.mongodb_db_name]
            return cls._db[collection_name]


class MongoCartStore:
    def __init__(self, routing_state: str) -> None:
        self.routing_state = routing_state

    def _get_coll(self) -> Collection | None:
        settings = get_settings()
        return MongoStoreBase.get_collection(settings.mongodb_cart_collection)

    def get_items(self, session_id: str) -> list[RawCartItem]:
        coll = self._get_coll()
        if coll is None:
            return []
        
        cursor = coll.find({"session_id": session_id, "routing_state": self.routing_state}).sort("added_at", ASCENDING)
        items = []
        for doc in cursor:
            items.append(
                RawCartItem(
                    cart_item_id=doc.get("cart_item_id", str(doc["_id"])),
                    product_id=doc["product_id"],
                    quantity=doc["quantity"],
                    added_at=doc.get("added_at", datetime.now(timezone.utc)),
                )
            )
        return items

    def add_or_increment(self, session_id: str, product_id: str, quantity: int) -> list[RawCartItem]:
        coll = self._get_coll()
        if coll is None:
            return []
            
        doc = coll.find_one({"session_id": session_id, "product_id": product_id, "routing_state": self.routing_state})
        if doc:
            coll.update_one(
                {"_id": doc["_id"]},
                {"$inc": {"quantity": quantity}}
            )
        else:
            coll.insert_one({
                "cart_item_id": str(uuid.uuid4()),
                "session_id": session_id,
                "product_id": product_id,
                "quantity": quantity,
                "added_at": datetime.now(timezone.utc),
                "routing_state": self.routing_state
            })
        return self.get_items(session_id)

    def set_quantity(self, session_id: str, product_id: str, quantity: int) -> list[RawCartItem] | None:
        coll = self._get_coll()
        if coll is None:
            return None
            
        result = coll.update_one(
            {"session_id": session_id, "product_id": product_id, "routing_state": self.routing_state},
            {"$set": {"quantity": quantity}}
        )
        if result.matched_count == 0:
            return None
        return self.get_items(session_id)

    def remove_item(self, session_id: str, product_id: str) -> list[RawCartItem] | None:
        coll = self._get_coll()
        if coll is None:
            return None
            
        result = coll.delete_one({"session_id": session_id, "product_id": product_id, "routing_state": self.routing_state})
        if result.deleted_count == 0:
            return None
        return self.get_items(session_id)

    def clear(self, session_id: str) -> None:
        coll = self._get_coll()
        if coll is not None:
            coll.delete_many({"session_id": session_id, "routing_state": self.routing_state})

    def rebind_session(self, old_session_id: str, new_session_id: str) -> None:
        coll = self._get_coll()
        if coll is None or old_session_id == new_session_id:
            return
            
        old_items = list(coll.find({"session_id": old_session_id, "routing_state": self.routing_state}))
        if not old_items:
            return
            
        for old_item in old_items:
            # Check if this product is already in the new session's cart
            existing = coll.find_one({"session_id": new_session_id, "product_id": old_item["product_id"], "routing_state": self.routing_state})
            if existing:
                coll.update_one(
                    {"_id": existing["_id"]},
                    {"$inc": {"quantity": old_item["quantity"]}}
                )
                coll.delete_one({"_id": old_item["_id"]})
            else:
                coll.update_one(
                    {"_id": old_item["_id"]},
                    {"$set": {"session_id": new_session_id}}
                )


class MongoWishlistStore:
    def __init__(self, routing_state: str) -> None:
        self.routing_state = routing_state

    def _get_coll(self) -> Collection | None:
        settings = get_settings()
        return MongoStoreBase.get_collection(settings.mongodb_wishlist_collection)

    def get_items(self, session_id: str) -> list[RawWishlistItem]:
        coll = self._get_coll()
        if coll is None:
            return []
            
        cursor = coll.find({"session_id": session_id, "routing_state": self.routing_state}).sort("added_at", ASCENDING)
        items = []
        for doc in cursor:
            items.append(
                RawWishlistItem(
                    wishlist_item_id=doc.get("wishlist_item_id", str(doc["_id"])),
                    product_id=doc["product_id"],
                    added_at=doc.get("added_at", datetime.now(timezone.utc)),
                )
            )
        return items

    def contains(self, session_id: str, product_id: str) -> bool:
        coll = self._get_coll()
        if coll is None:
            return False
        return coll.count_documents({"session_id": session_id, "product_id": product_id, "routing_state": self.routing_state}) > 0

    def add_item(self, session_id: str, product_id: str) -> list[RawWishlistItem]:
        coll = self._get_coll()
        if coll is None:
            return []
            
        if not self.contains(session_id, product_id):
            coll.insert_one({
                "wishlist_item_id": str(uuid.uuid4()),
                "session_id": session_id,
                "product_id": product_id,
                "added_at": datetime.now(timezone.utc),
                "routing_state": self.routing_state
            })
        return self.get_items(session_id)

    def remove_item(self, session_id: str, product_id: str) -> list[RawWishlistItem] | None:
        coll = self._get_coll()
        if coll is None:
            return None
            
        result = coll.delete_one({"session_id": session_id, "product_id": product_id, "routing_state": self.routing_state})
        if result.deleted_count == 0:
            return None
        return self.get_items(session_id)

    def clear(self, session_id: str) -> None:
        coll = self._get_coll()
        if coll is not None:
            coll.delete_many({"session_id": session_id, "routing_state": self.routing_state})

    def rebind_session(self, old_session_id: str, new_session_id: str) -> None:
        coll = self._get_coll()
        if coll is None or old_session_id == new_session_id:
            return
            
        old_items = list(coll.find({"session_id": old_session_id, "routing_state": self.routing_state}))
        for old_item in old_items:
            existing = coll.find_one({"session_id": new_session_id, "product_id": old_item["product_id"], "routing_state": self.routing_state})
            if existing:
                # Duplicates not allowed in wishlist, just delete old one
                coll.delete_one({"_id": old_item["_id"]})
            else:
                coll.update_one(
                    {"_id": old_item["_id"]},
                    {"$set": {"session_id": new_session_id}}
                )


class MongoOrderStore:
    def __init__(self, routing_state: str) -> None:
        self.routing_state = routing_state

    def _get_coll(self) -> Collection | None:
        settings = get_settings()
        return MongoStoreBase.get_collection(settings.mongodb_orders_collection)

    def add_order(self, session_id: str, order: Order) -> None:
        coll = self._get_coll()
        if coll is None:
            return
            
        order_dict = order.model_dump()
        order_dict["session_id"] = session_id
        order_dict["routing_state"] = self.routing_state
        order_dict["created_at"] = datetime.now(timezone.utc)
        coll.insert_one(order_dict)

    def get_orders(self, session_id: str) -> list[Order]:
        coll = self._get_coll()
        if coll is None:
            return []
            
        cursor = coll.find({"session_id": session_id, "routing_state": self.routing_state}).sort("created_at", DESCENDING)
        orders = []
        for doc in cursor:
            # Reconstruct the order. model_validate makes it easy.
            try:
                orders.append(Order.model_validate(doc))
            except Exception:
                pass
        return orders

    def get_order(self, session_id: str, order_id: str) -> Order | None:
        coll = self._get_coll()
        if coll is None:
            return None
            
        doc = coll.find_one({"session_id": session_id, "order_id": order_id, "routing_state": self.routing_state})
        if doc:
            try:
                return Order.model_validate(doc)
            except Exception:
                return None
        return None

    def rebind_session(self, old_session_id: str, new_session_id: str) -> None:
        coll = self._get_coll()
        if coll is None or old_session_id == new_session_id:
            return
            
        coll.update_many(
            {"session_id": old_session_id, "routing_state": self.routing_state},
            {"$set": {"session_id": new_session_id}}
        )

    def count(self, session_id: str) -> int:
        coll = self._get_coll()
        if coll is None:
            return 0
        return coll.count_documents({"session_id": session_id, "routing_state": self.routing_state})
