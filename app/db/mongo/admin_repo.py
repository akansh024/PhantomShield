"""
PhantomShield - Admin repository for dashboard aggregations and analytics.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from threading import Lock
from typing import Any

from pymongo import DESCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from app.api.admin.schemas import (
    DashboardSummary,
    ProductCount,
    SessionRecord,
    SessionTrendPoint,
)
from app.core.config import get_settings


class MongoAdminRepository:
    def __init__(self) -> None:
        self._client: MongoClient | None = None
        self._sessions: Collection | None = None
        self._forensics: Collection | None = None
        self._cart: Collection | None = None
        self._wishlist: Collection | None = None
        self._orders: Collection | None = None
        self._lock = Lock()

    def _get_collections(self) -> dict[str, Collection] | None:
        if self._sessions is not None and self._forensics is not None:
            return {
                "sessions": self._sessions,
                "forensics": self._forensics,
                "cart": self._cart,
                "wishlist": self._wishlist,
                "orders": self._orders,
            }

        with self._lock:
            if self._sessions is not None and self._forensics is not None:
                return {
                    "sessions": self._sessions,
                    "forensics": self._forensics,
                    "cart": self._cart,
                    "wishlist": self._wishlist,
                    "orders": self._orders,
                }

            settings = get_settings()
            if not settings.mongodb_uri:
                return None

            try:
                self._client = MongoClient(
                    settings.mongodb_uri,
                    serverSelectionTimeoutMS=settings.mongodb_timeout_ms,
                )
                db = self._client[settings.mongodb_db_name]
                self._sessions = db[settings.mongodb_sessions_collection]
                self._forensics = db[settings.mongodb_forensic_collection]
                self._cart = db[settings.mongodb_cart_collection]
                self._wishlist = db[settings.mongodb_wishlist_collection]
                self._orders = db[settings.mongodb_orders_collection]
                return {
                    "sessions": self._sessions,
                    "forensics": self._forensics,
                    "cart": self._cart,
                    "wishlist": self._wishlist,
                    "orders": self._orders,
                }
            except PyMongoError:
                return None

    def get_summary_stats(self) -> DashboardSummary:
        collections = self._get_collections()
        if not collections:
            # Fallback to zero values
            return DashboardSummary(
                total_sessions=0, active_sessions=0, real_sessions=0,
                decoy_sessions=0, suspicious_sessions=0, total_events=0,
                total_cart_actions=0, total_wishlist_actions=0, total_orders=0,
                average_risk_score=0.0
            )

        sessions_coll = collections["sessions"]
        forensics_coll = collections["forensics"]
        cart_coll = collections["cart"]
        wishlist_coll = collections["wishlist"]
        orders_coll = collections["orders"]

        now = datetime.utcnow()
        active_threshold = now - timedelta(minutes=15)

        # 1. Session counts
        total_sessions = sessions_coll.count_documents({})
        active_sessions = sessions_coll.count_documents({"last_activity": {"$gt": active_threshold}})
        real_sessions = sessions_coll.count_documents({"routing_state": "REAL"})
        decoy_sessions = sessions_coll.count_documents({"routing_state": "DECOY"})
        suspicious_sessions = sessions_coll.count_documents({"risk_score": {"$gte": 0.60}})

        # 2. Avg risk score
        avg_risk_pipeline = [
            {"$group": {"_id": None, "avg_risk": {"$avg": "$risk_score"}}}
        ]
        avg_risk_result = list(sessions_coll.aggregate(avg_risk_pipeline))
        average_risk_score = avg_risk_result[0]["avg_risk"] if avg_risk_result else 0.0

        # 3. forensic event counts
        total_events = forensics_coll.count_documents({})
        total_cart_actions = cart_coll.count_documents({})
        total_wishlist_actions = wishlist_coll.count_documents({})
        total_orders = orders_coll.count_documents({})

        return DashboardSummary(
            total_sessions=total_sessions,
            active_sessions=active_sessions,
            real_sessions=real_sessions,
            decoy_sessions=decoy_sessions,
            suspicious_sessions=suspicious_sessions,
            total_events=total_events,
            total_cart_actions=total_cart_actions,
            total_wishlist_actions=total_wishlist_actions,
            total_orders=total_orders,
            average_risk_score=round(average_risk_score or 0.0, 4)
        )

    def get_sessions(
        self, limit: int = 50, skip: int = 0, routing_state: str | None = None, min_risk: float | None = None
    ) -> list[SessionRecord]:
        collections = self._get_collections()
        if not collections:
            return []

        sessions_coll = collections["sessions"]
        query: dict[str, Any] = {}

        if routing_state:
            query["routing_state"] = routing_state
        if min_risk is not None:
            query["risk_score"] = {"$gte": min_risk}

        cursor = sessions_coll.find(query).sort("last_activity", DESCENDING).skip(skip).limit(limit)
        
        now = datetime.utcnow()
        results = []
        for doc in cursor:
            # Determine status
            activity_delta = now - doc["last_activity"]
            if activity_delta < timedelta(minutes=15):
                status = "active"
            elif activity_delta < timedelta(minutes=60):
                status = "idle"
            else:
                status = "expired"

            results.append(SessionRecord(
                session_id=doc["session_id"],
                user_id=doc.get("user_id"),
                routing_state=doc.get("routing_state", "REAL"),
                risk_score=doc.get("risk_score", 0.0),
                created_at=doc["created_at"],
                last_activity=doc["last_activity"],
                status=status,
                action_count=0  # To be calculated if needed, or stored
            ))
        
        return results

    def get_session_events(self, session_id: str) -> list[dict[str, Any]]:
        collections = self._get_collections()
        if not collections:
            return []
        
        forensics_coll = collections["forensics"]
        cursor = forensics_coll.find({"session_id": session_id}).sort("timestamp", DESCENDING)
        
        return list(cursor)

    def get_top_products(self, metric: str = "view", limit: int = 5) -> list[ProductCount]:
        """
        metric: view | cart | order
        """
        collections = self._get_collections()
        if not collections:
            return []
        
        results = []
        if metric == "cart":
            pipeline = [
                {"$group": {
                    "_id": "$product_id",
                    "product_name": {"$first": "Unknown Product"},
                    "count": {"$sum": "$quantity"}
                }},
                {"$sort": {"count": -1}},
                {"$limit": limit}
            ]
            results = list(collections["cart"].aggregate(pipeline))
        elif metric == "order":
            pipeline = [
                {"$unwind": "$items"},
                {"$group": {
                    "_id": "$items.product_id",
                    "product_name": {"$first": "$items.name"},
                    "count": {"$sum": "$items.quantity"}
                }},
                {"$sort": {"count": -1}},
                {"$limit": limit}
            ]
            results = list(collections["orders"].aggregate(pipeline))
        else:
            pipeline = [
                {"$match": {"action": "product_view"}},
                {"$unwind": "$payload"},
                {"$group": {
                    "_id": "$payload.product_id", 
                    "product_name": {"$first": "$payload.product_name"},
                    "count": {"$sum": 1}
                }},
                {"$sort": {"count": -1}},
                {"$limit": limit}
            ]
            results = list(collections["forensics"].aggregate(pipeline))
        
        return [
            ProductCount(
                product_id=str(r["_id"]),
                product_name=r.get("product_name", "Unknown Product"),
                count=r["count"]
            )
            for r in results if r["_id"]
        ]

    def get_sessions_trend(self) -> list[SessionTrendPoint]:
        collections = self._get_collections()
        if not collections:
            return []
        
        sessions_coll = collections["sessions"]
        
        # Group sessions by hour for the last 12 hours
        twelve_hours_ago = datetime.utcnow() - timedelta(hours=12)
        
        pipeline = [
            {"$match": {"last_activity": {"$gt": twelve_hours_ago}}},
            {"$project": {
                "user_id": 1,
                "hour": {
                    "$dateTrunc": {
                        "date": "$last_activity",
                        "unit": "hour"
                    }
                }
            }},
            {"$group": {
                "_id": "$hour",
                "active_sessions": {"$sum": 1},
                "unique_users": {"$addToSet": "$user_id"}
            }},
            {"$project": {
                "bucket": "$_id",
                "active_sessions": 1,
                "unique_users": {"$size": "$unique_users"}
            }},
            {"$sort": {"bucket": 1}}
        ]
        
        results = list(sessions_coll.aggregate(pipeline))
        return [
            SessionTrendPoint(
                bucket=r["bucket"],
                active_sessions=r["active_sessions"],
                unique_users=r["unique_users"]
            )
            for r in results
        ]


# Singleton instance
admin_repo = MongoAdminRepository()


def get_admin_repo() -> MongoAdminRepository:
    return admin_repo
