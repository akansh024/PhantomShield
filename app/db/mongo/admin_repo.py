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
        base_filter = {"is_test": {"$ne": True}}
        total_sessions = sessions_coll.count_documents(base_filter)
        active_sessions = sessions_coll.count_documents({**base_filter, "last_activity": {"$gt": active_threshold}})
        real_sessions = sessions_coll.count_documents({**base_filter, "routing_state": "REAL"})
        decoy_sessions = sessions_coll.count_documents({**base_filter, "routing_state": "DECOY"})
        suspicious_sessions = sessions_coll.count_documents({**base_filter, "risk_score": {"$gte": 0.60}})

        # 2. Avg risk score
        avg_risk_pipeline = [
            {"$match": {"is_test": {"$ne": True}}},
            {"$group": {"_id": None, "avg_risk": {"$avg": "$risk_score"}}}
        ]
        avg_risk_result = list(sessions_coll.aggregate(avg_risk_pipeline))
        average_risk_score = avg_risk_result[0]["avg_risk"] if avg_risk_result else 0.0

        # 3. Distribution calculations (REAL vs DECOY / Risk Buckets)
        mode_dist = {
            "REAL": real_sessions,
            "DECOY": decoy_sessions
        }
        
        # Risk buckets: 0.0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1.0
        risk_pipeline = [
            {"$match": {"is_test": {"$ne": True}}},
            {"$project": {
                "bucket": {
                    "$switch": {
                        "branches": [
                            {"case": {"$lte": ["$risk_score", 0.2]}, "then": "0.0-0.2"},
                            {"case": {"$lte": ["$risk_score", 0.4]}, "then": "0.2-0.4"},
                            {"case": {"$lte": ["$risk_score", 0.6]}, "then": "0.4-0.6"},
                            {"case": {"$lte": ["$risk_score", 0.8]}, "then": "0.6-0.8"},
                            {"case": {"$gt": ["$risk_score", 0.8]}, "then": "0.8-1.0"}
                        ],
                        "default": "0.0-0.2"
                    }
                }
            }},
            {"$group": {"_id": "$bucket", "count": {"$sum": 1}}}
        ]
        risk_results = list(sessions_coll.aggregate(risk_pipeline))
        risk_dist = {r["_id"]: r["count"] for r in risk_results}
        
        # Ensure all buckets are present for the frontend
        for label in ["0.0-0.2", "0.2-0.4", "0.4-0.6", "0.6-0.8", "0.8-1.0"]:
            if label not in risk_dist:
                risk_dist[label] = 0

        # 4. forensic event counts
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
            average_risk_score=round(average_risk_score or 0.0, 4),
            mode_distribution=mode_dist,
            risk_distribution=risk_dist
        )

    def get_sessions(
        self, limit: int = 50, skip: int = 0, routing_state: str | None = None, min_risk: float | None = None, filter_mode: str = "live"
    ) -> list[SessionRecord]:
        collections = self._get_collections()
        if not collections:
            return []

        sessions_coll = collections["sessions"]
        query: dict[str, Any] = {}

        now = datetime.utcnow()
        active_threshold = now - timedelta(minutes=15)

        if filter_mode == "test":
            query["is_test"] = True
        elif filter_mode == "ALL":
            pass
        else:
            query["is_test"] = {"$ne": True}
            if filter_mode == "live":
                query["last_activity"] = {"$gt": active_threshold}
            elif filter_mode == "logged_in":
                query["user_id"] = {"$ne": None}
            elif filter_mode == "guest":
                query["user_id"] = None
            elif filter_mode == "suspicious":
                query["risk_score"] = {"$gte": 0.6}
            elif filter_mode == "historical":
                query["last_activity"] = {"$lte": active_threshold}

        if routing_state:
            query["routing_state"] = routing_state
        if min_risk is not None:
            if "risk_score" in query and isinstance(query["risk_score"], dict):
                query["risk_score"]["$gte"] = max(query["risk_score"].get("$gte", 0), min_risk)
            else:
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
                user_name=doc.get("user_name"),
                user_email=doc.get("user_email"),
                is_test=doc.get("is_test", False),
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

    def _get_product_name_map(self) -> dict[str, str]:
        """Loads the real product catalog to map IDs to names."""
        try:
            from app.repositories.real.product_repo import _load_products
            return {p.id: p.name for p in _load_products()}
        except Exception:
            return {}

    def get_top_products(self, metric: str = "view", limit: int = 5) -> list[ProductCount]:
        """
        metric: view | cart | order
        """
        collections = self._get_collections()
        if not collections:
            return []
        
        name_map = self._get_product_name_map()
        results = []
        
        if metric == "cart":
            pipeline = [
                {"$group": {
                    "_id": "$product_id",
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
            # "view" metric — payload is a dict, NOT an array, so no $unwind
            pipeline = [
                {"$match": {"action": "product_view"}},
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
                product_name=r.get("product_name") or name_map.get(str(r["_id"])) or "Unknown Product",
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
            {"$match": {"last_activity": {"$gt": twelve_hours_ago}, "is_test": {"$ne": True}}},
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


    def get_dashboard_overview(self) -> dict[str, int]:
        collections = self._get_collections()
        empty = {"total_sessions": 0, "active_sessions": 0, "total_orders": 0, 
                 "total_cart_items": 0, "total_wishlist_items": 0, 
                 "suspicious_sessions": 0, "decoy_sessions": 0}
        if not collections: return empty

        now = datetime.utcnow()
        sessions = collections["sessions"]
        cart_coll = collections["cart"]
        wishlist_coll = collections["wishlist"]
        orders_coll = collections["orders"]

        # Cart documents are individual items per session, so count_documents gives total line items.
        # Orders documents are single orders.
        # Wishlist documents are single product_ids per session.
        return {
            "total_sessions": sessions.count_documents({"is_test": {"$ne": True}}),
            "active_sessions": sessions.count_documents({"is_test": {"$ne": True}, "last_activity": {"$gt": now - timedelta(minutes=15)}}),
            "total_orders": orders_coll.count_documents({}),
            "total_cart_items": cart_coll.count_documents({}),
            "total_wishlist_items": wishlist_coll.count_documents({}),
            "suspicious_sessions": sessions.count_documents({"is_test": {"$ne": True}, "risk_score": {"$gte": 0.60}}),
            "decoy_sessions": sessions.count_documents({"is_test": {"$ne": True}, "routing_state": "DECOY"})
        }

    def get_dashboard_session_trends(self) -> list[dict[str, Any]]:
        collections = self._get_collections()
        if not collections: return []
        
        twelve_hours_ago = datetime.utcnow() - timedelta(hours=12)
        pipeline = [
            {"$match": {"last_activity": {"$gt": twelve_hours_ago}, "is_test": {"$ne": True}}},
            {"$group": {
                "_id": {
                    "$dateTrunc": {"date": "$last_activity", "unit": "minute", "binSize": 15}
                },
                "active_sessions": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        
        results = list(collections["sessions"].aggregate(pipeline))
        return [
            {
                "time": r["_id"].strftime("%H:%M"),
                "active_sessions": r["active_sessions"]
            }
            for r in results
        ]

    def get_dashboard_forensic_summary(self) -> dict[str, Any]:
        collections = self._get_collections()
        empty = {"common_actions": [], "targeted_routes": [], "suspicious_sessions": []}
        if not collections: return empty
        
        forensics = collections["forensics"]
        sessions = collections["sessions"]
        
        # Most common actions
        actions = list(forensics.aggregate([
            {"$group": {"_id": "$action", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]))
        
        # Most targeted routes
        routes = list(forensics.aggregate([
            {"$match": {"route": {"$ne": None}}},
            {"$group": {"_id": "$route", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]))
        
        # Top suspicious sessions
        suspicious = list(sessions.find(
            {"risk_score": {"$gte": 0.50}, "is_test": {"$ne": True}},
            {"session_id": 1, "risk_score": 1, "routing_state": 1, "last_activity": 1}
        ).sort("risk_score", -1).limit(5))
        
        return {
            "common_actions": [{"action": a["_id"], "count": a["count"]} for a in actions],
            "targeted_routes": [{"route": r["_id"], "count": r["count"]} for r in routes],
            "suspicious_sessions": [
                {
                    "session_id": s["session_id"],
                    "risk_score": s.get("risk_score", 0.0),
                    "mode": s.get("routing_state", "REAL"),
                    "last_activity": s["last_activity"]
                } for s in suspicious
            ]
        }

    def get_dashboard_session_details(self, session_id: str) -> dict[str, Any] | None:
        collections = self._get_collections()
        if not collections: return None
        
        session = collections["sessions"].find_one({"session_id": session_id})
        if not session: return None
        
        timeline = list(collections["forensics"].find(
            {"session_id": session_id},
            {"_id": 0, "timestamp": 1, "action": 1, "route": 1, "payload": 1}
        ).sort("timestamp", 1))
        
        cart = list(collections["cart"].find({"session_id": session_id}, {"_id": 0, "session_id": 0}))
        wishlist = list(collections["wishlist"].find({"session_id": session_id}, {"_id": 0, "session_id": 0}))
        orders = list(collections["orders"].find(
            {"session_id": session_id}, 
            {"_id": 0, "order_id": 1, "total_value": 1, "items": 1, "created_at": 1}
        ).sort("created_at", -1))
        
        return {
            "session_id": session["session_id"],
            "user_id": session.get("user_id"),
            "user_name": session.get("user_name"),
            "user_email": session.get("user_email"),
            "is_test": session.get("is_test", False),
            "mode": session.get("routing_state", "REAL"),
            "risk_score": session.get("risk_score", 0.0),
            "timeline": timeline,
            "cart_activity": cart,
            "wishlist_activity": wishlist,
            "orders": orders
        }

    def get_dashboard_attacks(self) -> dict[str, Any]:
        collections = self._get_collections()
        empty = {"not_found_rate": 0.0, "suspicious_routes_hit": 0, "repeated_hits": [], "canary_triggers": 0}
        if not collections: return empty
        
        forensics = collections["forensics"]
        
        # 404 rate
        total_requests = forensics.count_documents({"action": "api_request"})
        not_found_requests = forensics.count_documents({"action": "api_request", "payload.status_code": 404})
        rate = (not_found_requests / total_requests) if total_requests > 0 else 0.0
        
        # Canary triggers (action = canary_trigger)
        canary = forensics.count_documents({"action": "canary_trigger"})
        
        # Suspicious routes (routing_state = DECOY AND action = api_request)
        suspicious_hits = forensics.count_documents({"routing_state": "DECOY", "action": "api_request"})
        
        # Repeated hits (burst activity: grouping by route and IP/session to find high volume)
        repeats = list(forensics.aggregate([
            {"$match": {"action": "api_request"}},
            {"$group": {
                "_id": {"route": "$route", "session_id": "$session_id"},
                "count": {"$sum": 1}
            }},
            {"$match": {"count": {"$gt": 10}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]))
        
        return {
            "not_found_rate": round(rate, 4),
            "suspicious_routes_hit": suspicious_hits,
            "canary_triggers": canary,
            "repeated_hits": [{"route": r["_id"]["route"], "session_id": r["_id"]["session_id"], "count": r["count"]} for r in repeats]
        }

# Singleton instance
admin_repo = MongoAdminRepository()


def get_admin_repo() -> MongoAdminRepository:
    return admin_repo
