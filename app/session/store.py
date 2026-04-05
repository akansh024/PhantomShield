"""
PhantomShield - Server-side persistent session store using MongoDB.
"""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta
from threading import Lock
from typing import Any, Optional

from pymongo import ASCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from app.core.config import get_settings
from app.session.constants import SESSION_EXPIRY_SECONDS
from app.session.models import SessionState

SESSION_ID_BYTES = 32


class MongoSessionStore:
    def __init__(self) -> None:
        self._client: MongoClient | None = None
        self._collection: Collection | None = None
        self._lock = Lock()
        self._index_ensured = False

    def _get_collection(self) -> Collection | None:
        if self._collection is not None:
            return self._collection

        with self._lock:
            if self._collection is not None:
                return self._collection

            settings = get_settings()
            if not settings.mongodb_uri:
                return None

            try:
                self._client = MongoClient(
                    settings.mongodb_uri,
                    serverSelectionTimeoutMS=settings.mongodb_timeout_ms,
                    connectTimeoutMS=settings.mongodb_timeout_ms,
                    socketTimeoutMS=settings.mongodb_timeout_ms,
                )
                db = self._client[settings.mongodb_db_name]
                self._collection = db[settings.mongodb_sessions_collection]

                if not self._index_ensured:
                    # Index for fast lookup and TTL for automatic cleanup
                    self._collection.create_index([("session_id", ASCENDING)], unique=True)
                    # MongoDB TTL index to automatically expire sessions
                    self._collection.create_index(
                        [("last_activity", ASCENDING)],
                        expireAfterSeconds=SESSION_EXPIRY_SECONDS,
                    )
                    self._index_ensured = True
            except PyMongoError:
                self._collection = None
                self._client = None
                return None

        return self._collection

    def _new_session_id(self) -> str:
        return secrets.token_urlsafe(SESSION_ID_BYTES)

    def _is_valid_session_id(self, session_id: str) -> bool:
        return bool(session_id and len(session_id) >= 20)

    def _serialize(self, state: SessionState) -> dict[str, Any]:
        return {
            "session_id": state.session_id,
            "user_id": state.user_id,
            "routing_state": state.routing_state,
            "risk_score": state.risk_score,
            "created_at": state.created_at,
            "last_activity": state.last_activity,
            "user_name": state.user_name,
            "flags": state.flags,
        }

    def _deserialize(self, doc: dict[str, Any]) -> SessionState:
        return SessionState(
            session_id=doc["session_id"],
            user_id=doc.get("user_id"),
            routing_state=doc.get("routing_state", "REAL"),
            risk_score=doc.get("risk_score", 0.0),
            created_at=doc.get("created_at", datetime.utcnow()),
            last_activity=doc.get("last_activity", datetime.utcnow()),
            user_name=doc.get("user_name"),
            flags=doc.get("flags", {}),
        )

    def get_session(self, session_id: str) -> Optional[SessionState]:
        if not self._is_valid_session_id(session_id):
            return None

        collection = self._get_collection()
        if collection is None:
            return None

        try:
            doc = collection.find_one({"session_id": session_id})
            if not doc:
                return None

            state = self._deserialize(doc)
            state.update_activity()
            # Update last_activity in DB
            collection.update_one(
                {"session_id": session_id}, {"$set": {"last_activity": state.last_activity}}
            )
            return state
        except PyMongoError:
            return None

    def create_session(self) -> SessionState:
        session = SessionState(session_id=self._new_session_id())
        collection = self._get_collection()
        if collection is not None:
            try:
                collection.insert_one(self._serialize(session))
            except PyMongoError:
                pass
        return session

    def save_session(self, state: SessionState) -> None:
        """
        Manually save session state changes (routing, risk, etc).
        """
        collection = self._get_collection()
        if collection is None:
            return

        try:
            collection.replace_one(
                {"session_id": state.session_id}, self._serialize(state), upsert=True
            )
        except PyMongoError:
            pass

    def rotate_session(self, old_id: str) -> SessionState:
        collection = self._get_collection()
        
        # 1. Fetch old state
        old_doc = None
        if collection is not None:
            try:
                old_doc = collection.find_one({"session_id": old_id})
            except PyMongoError:
                pass

        # 2. Create new state based on old state or fresh
        if not old_doc:
            new_state = SessionState(session_id=self._new_session_id())
        else:
            old_state = self._deserialize(old_doc)
            new_state = SessionState(
                session_id=self._new_session_id(),
                user_id=old_state.user_id,
                routing_state=old_state.routing_state,
                risk_score=old_state.risk_score,
                created_at=old_state.created_at,
                last_activity=datetime.utcnow(),
                user_name=old_state.user_name,
                flags=old_state.flags.copy(),
            )

        # 3. Save new and cleanup old
        if collection is not None:
            try:
                collection.insert_one(self._serialize(new_state))
                collection.delete_one({"session_id": old_id})
            except PyMongoError:
                pass

        return new_state

    def cleanup_expired(self) -> int:
        """
        MongoDB TTL index handles this automatically, 
        but we keep the method for interface compatibility.
        """
        return 0


# Singleton instance
session_store = MongoSessionStore()


def get_session_store() -> MongoSessionStore:
    return session_store
