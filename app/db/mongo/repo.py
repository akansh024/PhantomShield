from __future__ import annotations

from datetime import datetime, timezone
from threading import Lock
from typing import Any

from pymongo import ASCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError, PyMongoError

from app.core.config import get_settings


class MongoRepositoryError(Exception):
    """Base error for Mongo-backed repository operations."""


class MongoConfigurationError(MongoRepositoryError):
    """Raised when MongoDB settings are missing or invalid."""


class MongoUnavailableError(MongoRepositoryError):
    """Raised when MongoDB is unreachable."""


class DuplicateUserError(MongoRepositoryError):
    """Raised when trying to create a user that already exists."""


class MongoUserRepository:
    def __init__(self) -> None:
        self._client: MongoClient | None = None
        self._collection: Collection | None = None
        self._lock = Lock()
        self._index_ensured = False

    def _get_collection(self) -> Collection:
        if self._collection is not None:
            return self._collection

        with self._lock:
            if self._collection is not None:
                return self._collection

            settings = get_settings()
            if not settings.mongodb_uri:
                raise MongoConfigurationError(
                    "MONGODB_URI is not configured. Set it in your environment."
                )

            try:
                self._client = MongoClient(
                    settings.mongodb_uri,
                    serverSelectionTimeoutMS=settings.mongodb_timeout_ms,
                    connectTimeoutMS=settings.mongodb_timeout_ms,
                    socketTimeoutMS=settings.mongodb_timeout_ms,
                )
                db = self._client[settings.mongodb_db_name]
                self._collection = db[settings.mongodb_users_collection]

                if not self._index_ensured:
                    self._collection.create_index(
                        [("email", ASCENDING)],
                        unique=True,
                        name="users_email_unique",
                    )
                    self._index_ensured = True
            except PyMongoError as exc:
                self._collection = None
                self._client = None
                raise MongoUnavailableError("Unable to connect to MongoDB.") from exc

        return self._collection

    def get_user_by_email(self, email: str) -> dict[str, Any] | None:
        try:
            user = self._get_collection().find_one({"email": email})
        except PyMongoError as exc:
            raise MongoUnavailableError("Unable to read user from MongoDB.") from exc

        if not user:
            return None

        user["_id"] = str(user["_id"])
        return user

    def create_user(self, name: str, email: str, hashed_password: str) -> dict[str, Any]:
        document: dict[str, Any] = {
            "name": name,
            "email": email,
            "hashed_password": hashed_password,
            "created_at": datetime.now(timezone.utc),
        }

        try:
            result = self._get_collection().insert_one(document)
        except DuplicateKeyError as exc:
            raise DuplicateUserError("User already exists.") from exc
        except PyMongoError as exc:
            raise MongoUnavailableError("Unable to create user in MongoDB.") from exc

        document["_id"] = str(result.inserted_id)
        return document

    def close(self) -> None:
        with self._lock:
            if self._client is not None:
                self._client.close()
            self._client = None
            self._collection = None
            self._index_ensured = False


_repo = MongoUserRepository()


def get_user_by_email(email: str) -> dict[str, Any] | None:
    return _repo.get_user_by_email(email)


def create_user(name: str, email: str, hashed_password: str) -> dict[str, Any]:
    return _repo.create_user(name=name, email=email, hashed_password=hashed_password)


def close_mongo_connection() -> None:
    _repo.close()
