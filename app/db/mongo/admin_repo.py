"""
PhantomShield - Admin repository for dashboard aggregations and analytics.
"""

from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
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

LIVE_ACTIVITY_WINDOW_MINUTES = 15
RECENT_SESSION_WINDOW_HOURS = 24
RECENT_FORENSIC_WINDOW_MINUTES = 180
DEFAULT_EVENTS_LIMIT = 100

_LOCAL_HOST_PATTERN = re.compile(r"(localhost|127\.0\.0\.1|::1)", re.IGNORECASE)

_ACTION_CATALOG: dict[str, dict[str, Any]] = {
    "request_processed": {
        "label": "Page/API request handled",
        "category": "Browsing",
        "description": "A visitor request was successfully processed.",
        "suspicious": False,
    },
    "api_request": {
        "label": "API endpoint called",
        "category": "Browsing",
        "description": "A backend API endpoint was accessed.",
        "suspicious": False,
    },
    "products_list_view": {
        "label": "Product listing viewed",
        "category": "Browsing",
        "description": "The visitor viewed a product listing page.",
        "suspicious": False,
    },
    "product_view": {
        "label": "Product page viewed",
        "category": "Browsing",
        "description": "The visitor opened a product detail page.",
        "suspicious": False,
    },
    "product_search": {
        "label": "Search performed",
        "category": "Search",
        "description": "The visitor searched the catalog.",
        "suspicious": False,
    },
    "cart_add": {
        "label": "Item added to cart",
        "category": "Cart actions",
        "description": "A product was added to the shopping cart.",
        "suspicious": False,
    },
    "cart_remove": {
        "label": "Item removed from cart",
        "category": "Cart actions",
        "description": "A product was removed from the shopping cart.",
        "suspicious": False,
    },
    "wishlist_add": {
        "label": "Item saved to wishlist",
        "category": "Wishlist actions",
        "description": "A product was saved for later.",
        "suspicious": False,
    },
    "wishlist_remove": {
        "label": "Item removed from wishlist",
        "category": "Wishlist actions",
        "description": "A product was removed from the wishlist.",
        "suspicious": False,
    },
    "signup_attempt": {
        "label": "Signup submitted",
        "category": "Login/Signup",
        "description": "A visitor submitted account registration.",
        "suspicious": False,
    },
    "login_attempt": {
        "label": "Login attempted",
        "category": "Login/Signup",
        "description": "A visitor attempted to sign in.",
        "suspicious": False,
    },
    "login_success": {
        "label": "Login successful",
        "category": "Login/Signup",
        "description": "A visitor authenticated successfully.",
        "suspicious": False,
    },
    "login_failed": {
        "label": "Login failed",
        "category": "Suspicious behavior",
        "description": "Authentication failed for supplied credentials.",
        "suspicious": True,
    },
    "checkout_started": {
        "label": "Checkout started",
        "category": "Checkout",
        "description": "The visitor started checkout.",
        "suspicious": False,
    },
    "order_completed": {
        "label": "Order completed",
        "category": "Checkout",
        "description": "The visitor completed a purchase.",
        "suspicious": False,
    },
    "risk_evaluated": {
        "label": "Security score updated",
        "category": "Security checks",
        "description": "Behavioral risk scoring was recalculated.",
        "suspicious": False,
    },
    "routing_state_changed": {
        "label": "Routing state changed",
        "category": "Security checks",
        "description": "Traffic routing switched between REAL and DECOY.",
        "suspicious": True,
    },
    "canary_triggered": {
        "label": "Canary trap triggered",
        "category": "Suspicious behavior",
        "description": "A honeypot/canary endpoint was touched.",
        "suspicious": True,
    },
}

_CATEGORY_DESCRIPTIONS = {
    "Browsing": "Normal browsing and page/API navigation signals.",
    "Search": "Catalog lookup and product discovery behavior.",
    "Cart actions": "Add/remove operations that indicate purchase intent.",
    "Wishlist actions": "Save-for-later actions and preference signals.",
    "Login/Signup": "Identity lifecycle events for authentication.",
    "Checkout": "Conversion and order completion behavior.",
    "Security checks": "Automated risk evaluations and routing safeguards.",
    "Suspicious behavior": "Events that may indicate probing or abuse.",
}


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

    def _iso_utc(self, value: datetime) -> str:
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")

    def _parse_datetime(self, value: Any) -> datetime | None:
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError:
                return None
        return None

    def _activity_threshold(self) -> datetime:
        return datetime.utcnow() - timedelta(minutes=LIVE_ACTIVITY_WINDOW_MINUTES)

    def _recent_session_threshold(self) -> datetime:
        return datetime.utcnow() - timedelta(hours=RECENT_SESSION_WINDOW_HOURS)

    def _event_window_threshold_iso(self, window_minutes: int) -> str:
        return self._iso_utc(datetime.utcnow() - timedelta(minutes=window_minutes))

    def _resolve_environment(self, doc: dict[str, Any]) -> str:
        environment = str(doc.get("environment", "")).strip().lower()
        if environment in {"production", "test", "local"}:
            return environment

        source_host = str(doc.get("source_host", "")).strip().lower()
        if source_host and _LOCAL_HOST_PATTERN.search(source_host):
            return "local"

        if doc.get("is_test") or doc.get("is_test_session") or doc.get("archived"):
            return "test"

        return "production"

    def _resolve_session_type(self, doc: dict[str, Any], environment: str) -> str:
        session_type = str(doc.get("session_type", "")).strip().lower()
        if session_type in {"guest", "authenticated", "test"}:
            return session_type

        if environment in {"test", "local"} or doc.get("is_test") or doc.get("is_test_session"):
            return "test"

        return "authenticated" if doc.get("user_id") else "guest"

    def _build_identity_label(self, doc: dict[str, Any], session_type: str) -> str:
        user_name = doc.get("user_name")
        user_email = doc.get("user_email")
        session_id = doc.get("session_id", "")
        if session_type == "authenticated" and (user_name or user_email):
            if user_name and user_email:
                return f"{user_name} ({user_email})"
            if user_name:
                return str(user_name)
            return str(user_email)

        if session_type == "test":
            return f"Test/Archived session ({session_id})"

        return "Guest / Anonymous session"

    def _build_status(self, last_activity: datetime | str | None) -> str:
        now = datetime.utcnow()
        parsed = self._parse_datetime(last_activity)
        if parsed is None:
            return "expired"

        if parsed.tzinfo is not None:
            parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)

        delta = now - parsed
        if delta < timedelta(minutes=LIVE_ACTIVITY_WINDOW_MINUTES):
            return "active"
        if delta < timedelta(minutes=60):
            return "idle"
        return "expired"

    def _build_state_label(self, *, routing_state: str, risk_score: float, status: str) -> str:
        normalized_mode = "DECOY" if str(routing_state).upper() == "DECOY" else "REAL"
        if normalized_mode == "DECOY":
            return "Suspicious traffic diverted to decoy"
        if risk_score >= 0.6:
            return "High-risk session under watch"
        if status == "active":
            return "Live normal traffic"
        if status == "idle":
            return "Idle production session"
        return "Inactive historical session"

    def _map_action(self, action: str) -> dict[str, Any]:
        meta = _ACTION_CATALOG.get(action)
        if not meta:
            return {
                "action": action,
                "label": action.replace("_", " ").title(),
                "category": "Browsing",
                "description": "Operational event captured by telemetry.",
                "suspicious": False,
            }
        return {
            "action": action,
            "label": meta["label"],
            "category": meta["category"],
            "description": meta["description"],
            "suspicious": bool(meta.get("suspicious", False)),
        }

    def _base_production_query(self) -> dict[str, Any]:
        return {
            "archived": {"$ne": True},
            "is_test": {"$ne": True},
            "is_test_session": {"$ne": True},
            "environment": {"$nin": ["test", "local"]},
            "source_host": {"$not": {"$regex": _LOCAL_HOST_PATTERN}},
        }

    def _test_or_archived_query(self) -> dict[str, Any]:
        return {
            "$or": [
                {"archived": True},
                {"is_test": True},
                {"is_test_session": True},
                {"environment": {"$in": ["test", "local"]}},
                {"source_host": {"$regex": _LOCAL_HOST_PATTERN}},
            ]
        }

    def _build_session_query(
        self,
        *,
        filter_mode: str,
        routing_state: str | None,
        min_risk: float | None,
    ) -> dict[str, Any]:
        mode = str(filter_mode or "live")
        query: dict[str, Any]
        active_threshold = self._activity_threshold()

        if mode == "ALL":
            query = {}
        elif mode == "test":
            query = self._test_or_archived_query()
        else:
            query = self._base_production_query()
            if mode == "live":
                query["last_activity"] = {"$gt": active_threshold}
            elif mode == "logged_in":
                query["user_id"] = {"$nin": [None, ""]}
            elif mode == "guest":
                query["$or"] = [{"user_id": None}, {"user_id": ""}]
            elif mode == "suspicious":
                query["risk_score"] = {"$gte": 0.6}
            elif mode == "historical":
                query["last_activity"] = {"$lte": active_threshold}

        if routing_state:
            query["routing_state"] = str(routing_state).upper()

        if min_risk is not None:
            existing_risk = query.get("risk_score")
            if isinstance(existing_risk, dict):
                existing_risk["$gte"] = max(min_risk, float(existing_risk.get("$gte", 0.0)))
            else:
                query["risk_score"] = {"$gte": min_risk}

        return query

    def _find_session_ids(self, sessions_coll: Collection, query: dict[str, Any], limit: int = 5000) -> list[str]:
        cursor = sessions_coll.find(query, {"session_id": 1}).limit(limit)
        return [str(doc.get("session_id")) for doc in cursor if doc.get("session_id")]

    def _build_forensic_query(
        self,
        *,
        session_ids: list[str] | None = None,
        recent_minutes: int = RECENT_FORENSIC_WINDOW_MINUTES,
        exclude_admin_noise: bool = True,
    ) -> dict[str, Any]:
        query: dict[str, Any] = {}
        if session_ids is not None:
            if not session_ids:
                return {"session_id": {"$in": []}}
            query["session_id"] = {"$in": session_ids}

        query["timestamp"] = {"$gte": self._event_window_threshold_iso(recent_minutes)}

        if exclude_admin_noise:
            query["route"] = {"$not": {"$regex": r"^/api/(admin|dashboard)"}}
        return query

    def _load_action_counts(
        self,
        *,
        forensics_coll: Collection,
        session_ids: list[str],
        recent_minutes: int = RECENT_FORENSIC_WINDOW_MINUTES,
    ) -> dict[str, int]:
        if not session_ids:
            return {}

        query = self._build_forensic_query(
            session_ids=session_ids,
            recent_minutes=recent_minutes,
            exclude_admin_noise=True,
        )
        pipeline = [
            {"$match": query},
            {"$group": {"_id": "$session_id", "count": {"$sum": 1}}},
        ]
        results = list(forensics_coll.aggregate(pipeline))
        return {
            str(item["_id"]): int(item["count"])
            for item in results
            if item.get("_id") is not None
        }

    def _to_session_record(self, doc: dict[str, Any], action_count: int = 0) -> SessionRecord:
        environment = self._resolve_environment(doc)
        session_type = self._resolve_session_type(doc, environment)
        status = self._build_status(doc.get("last_activity"))
        risk_score = float(doc.get("risk_score", 0.0) or 0.0)
        routing_state = "DECOY" if str(doc.get("routing_state", "REAL")).upper() == "DECOY" else "REAL"

        return SessionRecord(
            session_id=str(doc.get("session_id", "")),
            user_id=doc.get("user_id"),
            user_name=doc.get("user_name"),
            user_email=doc.get("user_email"),
            is_test=bool(doc.get("is_test", False)),
            is_test_session=bool(doc.get("is_test_session", False)),
            archived=bool(doc.get("archived", False)),
            environment=environment,
            session_type=session_type,
            routing_state=routing_state,
            risk_score=risk_score,
            created_at=doc.get("created_at") or datetime.utcnow(),
            last_activity=doc.get("last_activity") or datetime.utcnow(),
            authenticated_at=doc.get("authenticated_at"),
            signup_at=doc.get("signup_at"),
            status=status,
            action_count=int(action_count),
            identity_label=self._build_identity_label(doc, session_type),
            state_label=self._build_state_label(
                routing_state=routing_state,
                risk_score=risk_score,
                status=status,
            ),
        )

    def get_summary_stats(self) -> DashboardSummary:
        collections = self._get_collections()
        if not collections:
            return DashboardSummary(
                total_sessions=0,
                active_sessions=0,
                real_sessions=0,
                decoy_sessions=0,
                suspicious_sessions=0,
                total_events=0,
                total_cart_actions=0,
                total_wishlist_actions=0,
                total_orders=0,
                average_risk_score=0.0,
                mode_distribution={"REAL": 0, "DECOY": 0},
                risk_distribution={
                    "0.0-0.2": 0,
                    "0.2-0.4": 0,
                    "0.4-0.6": 0,
                    "0.6-0.8": 0,
                    "0.8-1.0": 0,
                },
            )

        sessions_coll = collections["sessions"]
        forensics_coll = collections["forensics"]
        cart_coll = collections["cart"]
        wishlist_coll = collections["wishlist"]
        orders_coll = collections["orders"]

        active_threshold = self._activity_threshold()
        recent_threshold = self._recent_session_threshold()
        base_filter = self._base_production_query()
        recent_filter = {**base_filter, "last_activity": {"$gte": recent_threshold}}

        total_sessions = sessions_coll.count_documents(recent_filter)
        active_sessions = sessions_coll.count_documents({**recent_filter, "last_activity": {"$gt": active_threshold}})
        real_sessions = sessions_coll.count_documents({**recent_filter, "routing_state": "REAL"})
        decoy_sessions = sessions_coll.count_documents({**recent_filter, "routing_state": "DECOY"})
        suspicious_sessions = sessions_coll.count_documents({**recent_filter, "risk_score": {"$gte": 0.60}})

        avg_risk_pipeline = [
            {"$match": recent_filter},
            {"$group": {"_id": None, "avg_risk": {"$avg": "$risk_score"}}},
        ]
        avg_risk_result = list(sessions_coll.aggregate(avg_risk_pipeline))
        average_risk_score = float(avg_risk_result[0]["avg_risk"]) if avg_risk_result else 0.0

        risk_pipeline = [
            {"$match": recent_filter},
            {
                "$project": {
                    "bucket": {
                        "$switch": {
                            "branches": [
                                {"case": {"$lte": ["$risk_score", 0.2]}, "then": "0.0-0.2"},
                                {"case": {"$lte": ["$risk_score", 0.4]}, "then": "0.2-0.4"},
                                {"case": {"$lte": ["$risk_score", 0.6]}, "then": "0.4-0.6"},
                                {"case": {"$lte": ["$risk_score", 0.8]}, "then": "0.6-0.8"},
                                {"case": {"$gt": ["$risk_score", 0.8]}, "then": "0.8-1.0"},
                            ],
                            "default": "0.0-0.2",
                        }
                    }
                }
            },
            {"$group": {"_id": "$bucket", "count": {"$sum": 1}}},
        ]
        risk_results = list(sessions_coll.aggregate(risk_pipeline))
        risk_dist = {str(r["_id"]): int(r["count"]) for r in risk_results if r.get("_id")}
        for label in ("0.0-0.2", "0.2-0.4", "0.4-0.6", "0.6-0.8", "0.8-1.0"):
            risk_dist.setdefault(label, 0)

        session_ids = self._find_session_ids(sessions_coll, recent_filter, limit=5000)
        forensic_query = self._build_forensic_query(
            session_ids=session_ids,
            recent_minutes=RECENT_FORENSIC_WINDOW_MINUTES,
            exclude_admin_noise=True,
        )
        total_events = forensics_coll.count_documents(forensic_query)

        if session_ids:
            total_cart_actions = cart_coll.count_documents({"session_id": {"$in": session_ids}})
            total_wishlist_actions = wishlist_coll.count_documents({"session_id": {"$in": session_ids}})
            total_orders = orders_coll.count_documents({"session_id": {"$in": session_ids}})
        else:
            total_cart_actions = 0
            total_wishlist_actions = 0
            total_orders = 0

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
            average_risk_score=round(average_risk_score, 4),
            mode_distribution={"REAL": real_sessions, "DECOY": decoy_sessions},
            risk_distribution=risk_dist,
        )

    def get_sessions(
        self,
        limit: int = 50,
        skip: int = 0,
        routing_state: str | None = None,
        min_risk: float | None = None,
        filter_mode: str = "live",
    ) -> list[SessionRecord]:
        collections = self._get_collections()
        if not collections:
            return []

        sessions_coll = collections["sessions"]
        forensics_coll = collections["forensics"]
        query = self._build_session_query(
            filter_mode=filter_mode,
            routing_state=routing_state,
            min_risk=min_risk,
        )

        docs = list(
            sessions_coll.find(query)
            .sort("last_activity", DESCENDING)
            .skip(skip)
            .limit(limit)
        )
        session_ids = [str(doc.get("session_id")) for doc in docs if doc.get("session_id")]
        action_counts = self._load_action_counts(
            forensics_coll=forensics_coll,
            session_ids=session_ids,
            recent_minutes=RECENT_FORENSIC_WINDOW_MINUTES,
        )

        return [
            self._to_session_record(doc, action_count=action_counts.get(str(doc.get("session_id")), 0))
            for doc in docs
        ]

    def get_session_by_id(self, session_id: str) -> SessionRecord | None:
        collections = self._get_collections()
        if not collections:
            return None

        sessions_coll = collections["sessions"]
        forensics_coll = collections["forensics"]
        doc = sessions_coll.find_one({"session_id": session_id})
        if not doc:
            return None

        action_counts = self._load_action_counts(
            forensics_coll=forensics_coll,
            session_ids=[session_id],
            recent_minutes=RECENT_FORENSIC_WINDOW_MINUTES,
        )
        return self._to_session_record(doc, action_count=action_counts.get(session_id, 0))

    def get_session_events(
        self,
        session_id: str,
        *,
        limit: int = DEFAULT_EVENTS_LIMIT,
        recent_minutes: int | None = None,
    ) -> list[dict[str, Any]]:
        collections = self._get_collections()
        if not collections:
            return []

        forensics_coll = collections["forensics"]
        query: dict[str, Any] = {"session_id": session_id}
        if recent_minutes:
            query["timestamp"] = {"$gte": self._event_window_threshold_iso(recent_minutes)}

        cursor = forensics_coll.find(query, {"_id": 0}).sort("timestamp", DESCENDING).limit(limit)
        return list(cursor)

    def _get_product_name_map(self) -> dict[str, str]:
        try:
            from app.repositories.real.product_repo import _load_products

            return {p.id: p.name for p in _load_products()}
        except Exception:
            return {}

    def get_top_products(self, metric: str = "view", limit: int = 5) -> list[ProductCount]:
        collections = self._get_collections()
        if not collections:
            return []

        sessions_coll = collections["sessions"]
        name_map = self._get_product_name_map()
        session_ids = self._find_session_ids(sessions_coll, self._base_production_query(), limit=5000)
        if not session_ids:
            return []

        results: list[dict[str, Any]]
        if metric == "cart":
            pipeline = [
                {"$match": {"session_id": {"$in": session_ids}}},
                {"$group": {"_id": "$product_id", "count": {"$sum": "$quantity"}}},
                {"$sort": {"count": -1}},
                {"$limit": limit},
            ]
            results = list(collections["cart"].aggregate(pipeline))
        elif metric == "order":
            pipeline = [
                {"$match": {"session_id": {"$in": session_ids}}},
                {"$unwind": "$items"},
                {
                    "$group": {
                        "_id": "$items.product_id",
                        "product_name": {"$first": "$items.name"},
                        "count": {"$sum": "$items.quantity"},
                    }
                },
                {"$sort": {"count": -1}},
                {"$limit": limit},
            ]
            results = list(collections["orders"].aggregate(pipeline))
        else:
            pipeline = [
                {
                    "$match": {
                        "action": "product_view",
                        "session_id": {"$in": session_ids},
                    }
                },
                {
                    "$group": {
                        "_id": "$payload.product_id",
                        "product_name": {"$first": "$payload.product_name"},
                        "count": {"$sum": 1},
                    }
                },
                {"$sort": {"count": -1}},
                {"$limit": limit},
            ]
            results = list(collections["forensics"].aggregate(pipeline))

        return [
            ProductCount(
                product_id=str(r["_id"]),
                product_name=r.get("product_name") or name_map.get(str(r["_id"])) or "Unknown Product",
                count=int(r.get("count", 0)),
            )
            for r in results
            if r.get("_id")
        ]

    def get_sessions_trend(self) -> list[SessionTrendPoint]:
        collections = self._get_collections()
        if not collections:
            return []

        sessions_coll = collections["sessions"]
        twelve_hours_ago = datetime.utcnow() - timedelta(hours=12)
        base_query = self._base_production_query()
        base_query["last_activity"] = {"$gt": twelve_hours_ago}

        pipeline = [
            {"$match": base_query},
            {
                "$project": {
                    "user_id": 1,
                    "hour": {
                        "$dateTrunc": {
                            "date": "$last_activity",
                            "unit": "hour",
                        }
                    },
                }
            },
            {
                "$group": {
                    "_id": "$hour",
                    "active_sessions": {"$sum": 1},
                    "unique_users": {"$addToSet": "$user_id"},
                }
            },
            {
                "$project": {
                    "bucket": "$_id",
                    "active_sessions": 1,
                    "unique_users": {"$size": "$unique_users"},
                }
            },
            {"$sort": {"bucket": 1}},
        ]

        results = list(sessions_coll.aggregate(pipeline))
        return [
            SessionTrendPoint(
                bucket=r["bucket"],
                active_sessions=int(r["active_sessions"]),
                unique_users=int(r["unique_users"]),
            )
            for r in results
        ]

    def get_dashboard_overview(self) -> dict[str, int]:
        collections = self._get_collections()
        empty = {
            "total_sessions": 0,
            "active_sessions": 0,
            "total_orders": 0,
            "total_cart_items": 0,
            "total_wishlist_items": 0,
            "suspicious_sessions": 0,
            "decoy_sessions": 0,
        }
        if not collections:
            return empty

        sessions = collections["sessions"]
        cart_coll = collections["cart"]
        wishlist_coll = collections["wishlist"]
        orders_coll = collections["orders"]
        base_filter = self._base_production_query()
        recent_filter = {**base_filter, "last_activity": {"$gte": self._recent_session_threshold()}}
        active_filter = {**recent_filter, "last_activity": {"$gt": self._activity_threshold()}}

        session_ids = self._find_session_ids(sessions, recent_filter, limit=5000)
        cart_count = cart_coll.count_documents({"session_id": {"$in": session_ids}}) if session_ids else 0
        wishlist_count = wishlist_coll.count_documents({"session_id": {"$in": session_ids}}) if session_ids else 0
        orders_count = orders_coll.count_documents({"session_id": {"$in": session_ids}}) if session_ids else 0

        return {
            "total_sessions": sessions.count_documents(recent_filter),
            "active_sessions": sessions.count_documents(active_filter),
            "total_orders": orders_count,
            "total_cart_items": cart_count,
            "total_wishlist_items": wishlist_count,
            "suspicious_sessions": sessions.count_documents({**recent_filter, "risk_score": {"$gte": 0.60}}),
            "decoy_sessions": sessions.count_documents({**recent_filter, "routing_state": "DECOY"}),
        }

    def get_dashboard_session_trends(self) -> list[dict[str, Any]]:
        collections = self._get_collections()
        if not collections:
            return []

        twelve_hours_ago = datetime.utcnow() - timedelta(hours=12)
        base_query = self._base_production_query()
        base_query["last_activity"] = {"$gt": twelve_hours_ago}
        pipeline = [
            {"$match": base_query},
            {
                "$group": {
                    "_id": {
                        "$dateTrunc": {"date": "$last_activity", "unit": "minute", "binSize": 15}
                    },
                    "active_sessions": {"$sum": 1},
                }
            },
            {"$sort": {"_id": 1}},
        ]

        results = list(collections["sessions"].aggregate(pipeline))
        return [
            {"time": r["_id"].strftime("%H:%M"), "active_sessions": int(r["active_sessions"])}
            for r in results
        ]

    def _forensic_sessions_query(
        self,
        *,
        include_historical: bool,
        include_test: bool,
    ) -> dict[str, Any]:
        if include_test:
            return {}
        base = self._base_production_query()
        if include_historical:
            return base
        return {**base, "last_activity": {"$gt": self._activity_threshold()}}

    def get_dashboard_forensic_summary(
        self,
        *,
        window_minutes: int = RECENT_FORENSIC_WINDOW_MINUTES,
        include_historical: bool = False,
        include_test: bool = False,
    ) -> dict[str, Any]:
        collections = self._get_collections()
        empty = {
            "common_actions": [],
            "category_breakdown": [],
            "targeted_routes": [],
            "suspicious_sessions": [],
            "window_minutes": window_minutes,
            "total_events": 0,
        }
        if not collections:
            return empty

        sessions = collections["sessions"]
        forensics = collections["forensics"]
        session_query = self._forensic_sessions_query(
            include_historical=include_historical,
            include_test=include_test,
        )
        session_ids = self._find_session_ids(sessions, session_query, limit=5000)
        if not session_ids:
            return empty

        forensic_query = self._build_forensic_query(
            session_ids=session_ids,
            recent_minutes=window_minutes,
            exclude_admin_noise=True,
        )

        actions = list(
            forensics.aggregate(
                [
                    {"$match": forensic_query},
                    {"$group": {"_id": "$action", "count": {"$sum": 1}}},
                    {"$sort": {"count": -1}},
                    {"$limit": 8},
                ]
            )
        )

        mapped_actions: list[dict[str, Any]] = []
        category_totals: dict[str, int] = {}
        for item in actions:
            raw_action = str(item.get("_id", "unknown"))
            count = int(item.get("count", 0))
            mapped = self._map_action(raw_action)
            mapped["count"] = count
            mapped_actions.append(mapped)
            category_totals[mapped["category"]] = category_totals.get(mapped["category"], 0) + count

        category_breakdown = [
            {
                "category": category,
                "description": _CATEGORY_DESCRIPTIONS.get(category, "Operational behavior bucket."),
                "count": total,
            }
            for category, total in sorted(category_totals.items(), key=lambda item: item[1], reverse=True)
        ]

        routes = list(
            forensics.aggregate(
                [
                    {"$match": {**forensic_query, "route": {"$ne": None}}},
                    {"$group": {"_id": "$route", "count": {"$sum": 1}}},
                    {"$sort": {"count": -1}},
                    {"$limit": 5},
                ]
            )
        )

        suspicious_filter = {**session_query, "risk_score": {"$gte": 0.50}}
        suspicious = list(
            sessions.find(
                suspicious_filter,
                {"session_id": 1, "risk_score": 1, "routing_state": 1, "last_activity": 1},
            )
            .sort("risk_score", -1)
            .limit(5)
        )

        total_events = forensics.count_documents(forensic_query)
        return {
            "common_actions": mapped_actions,
            "category_breakdown": category_breakdown,
            "targeted_routes": [{"route": r.get("_id"), "count": int(r.get("count", 0))} for r in routes],
            "suspicious_sessions": [
                {
                    "session_id": s["session_id"],
                    "risk_score": float(s.get("risk_score", 0.0)),
                    "mode": s.get("routing_state", "REAL"),
                    "last_activity": s.get("last_activity", datetime.utcnow()),
                }
                for s in suspicious
            ],
            "window_minutes": window_minutes,
            "total_events": int(total_events),
        }

    def get_dashboard_session_details(self, session_id: str) -> dict[str, Any] | None:
        collections = self._get_collections()
        if not collections:
            return None

        session = collections["sessions"].find_one({"session_id": session_id})
        if not session:
            return None

        events = list(
            collections["forensics"]
            .find({"session_id": session_id}, {"_id": 0})
            .sort("timestamp", 1)
            .limit(400)
        )

        mapped_events: list[dict[str, Any]] = []
        risk_history: list[dict[str, Any]] = []
        for event in events:
            mapped = self._map_action(str(event.get("action", "unknown")))
            event_payload = event.get("payload") or {}
            mapped_events.append(
                {
                    "timestamp": event.get("timestamp"),
                    "action": event.get("action"),
                    "route": event.get("route"),
                    "payload": event_payload,
                    "action_label": mapped["label"],
                    "category": mapped["category"],
                    "description": mapped["description"],
                    "suspicious": mapped["suspicious"],
                }
            )

            if str(event.get("action")) == "risk_evaluated":
                updates = event_payload.get("updates") or []
                reason = None
                if updates and isinstance(updates, list):
                    reason = ", ".join(str(item.get("reason")) for item in updates if item.get("reason"))
                score_after = event_payload.get("to_risk", event.get("risk_score", session.get("risk_score", 0.0)))
                risk_history.append(
                    {
                        "timestamp": event.get("timestamp"),
                        "score_before": event_payload.get("from_risk"),
                        "score_after": float(score_after or 0.0),
                        "reason": reason or "security update",
                    }
                )

        recent_actions = list(reversed(mapped_events[-12:]))
        cart = list(collections["cart"].find({"session_id": session_id}, {"_id": 0, "session_id": 0}))
        wishlist = list(collections["wishlist"].find({"session_id": session_id}, {"_id": 0, "session_id": 0}))
        orders = list(
            collections["orders"]
            .find(
                {"session_id": session_id},
                {"_id": 0, "order_id": 1, "total_value": 1, "items": 1, "created_at": 1},
            )
            .sort("created_at", -1)
        )

        record = self._to_session_record(session, action_count=len(mapped_events))
        return {
            "session_id": record.session_id,
            "user_id": record.user_id,
            "user_name": record.user_name,
            "user_email": record.user_email,
            "is_test": record.is_test,
            "is_test_session": record.is_test_session,
            "archived": record.archived,
            "environment": record.environment,
            "session_type": record.session_type,
            "mode": record.routing_state,
            "risk_score": record.risk_score,
            "status": record.status,
            "created_at": record.created_at,
            "last_activity": record.last_activity,
            "authenticated_at": record.authenticated_at,
            "signup_at": record.signup_at,
            "identity_label": record.identity_label,
            "state_label": record.state_label,
            "risk_history": risk_history,
            "recent_actions": recent_actions,
            "timeline": mapped_events,
            "cart_activity": cart,
            "wishlist_activity": wishlist,
            "orders": orders,
        }

    def get_dashboard_attacks(self) -> dict[str, Any]:
        collections = self._get_collections()
        empty = {"not_found_rate": 0.0, "suspicious_routes_hit": 0, "repeated_hits": [], "canary_triggers": 0}
        if not collections:
            return empty

        sessions_coll = collections["sessions"]
        forensics = collections["forensics"]
        session_ids = self._find_session_ids(
            sessions_coll,
            self._forensic_sessions_query(include_historical=False, include_test=False),
            limit=5000,
        )
        if not session_ids:
            return empty

        base_forensic_query = self._build_forensic_query(
            session_ids=session_ids,
            recent_minutes=RECENT_FORENSIC_WINDOW_MINUTES,
            exclude_admin_noise=True,
        )

        total_requests = forensics.count_documents({**base_forensic_query, "action": "api_request"})
        not_found_requests = forensics.count_documents(
            {**base_forensic_query, "action": "api_request", "payload.status_code": 404}
        )
        rate = (not_found_requests / total_requests) if total_requests > 0 else 0.0

        canary = forensics.count_documents({**base_forensic_query, "action": "canary_triggered"})
        suspicious_hits = forensics.count_documents(
            {**base_forensic_query, "mode": "DECOY", "action": {"$in": ["api_request", "routing_state_changed"]}}
        )

        repeats = list(
            forensics.aggregate(
                [
                    {"$match": {**base_forensic_query, "action": "api_request"}},
                    {
                        "$group": {
                            "_id": {"route": "$route", "session_id": "$session_id"},
                            "count": {"$sum": 1},
                        }
                    },
                    {"$match": {"count": {"$gt": 10}}},
                    {"$sort": {"count": -1}},
                    {"$limit": 5},
                ]
            )
        )

        return {
            "not_found_rate": round(rate, 4),
            "suspicious_routes_hit": int(suspicious_hits),
            "canary_triggers": int(canary),
            "repeated_hits": [
                {
                    "route": r.get("_id", {}).get("route"),
                    "session_id": r.get("_id", {}).get("session_id"),
                    "count": int(r.get("count", 0)),
                }
                for r in repeats
            ],
        }


admin_repo = MongoAdminRepository()


def get_admin_repo() -> MongoAdminRepository:
    return admin_repo
