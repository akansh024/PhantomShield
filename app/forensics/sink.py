"""
Central forensic sink.

Primary sink: JSONL file (v1 default).
Secondary sink: MongoDB collection when configured.
"""

from __future__ import annotations

import json
from pathlib import Path
from threading import Lock
from typing import Any

from pymongo import ASCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from app.core.config import get_settings

DEFAULT_LOG_FILE = Path("app/forensics/logs/storefront_events.jsonl")


class ForensicEventSink:
    def __init__(self, log_file: Path | None = None) -> None:
        self._log_file = log_file or DEFAULT_LOG_FILE
        self._lock = Lock()
        self._mongo_client: MongoClient | None = None
        self._mongo_collection: Collection | None = None
        self._mongo_index_ready = False

    def get_log_file(self) -> Path:
        return self._log_file

    def set_log_file(self, log_file: Path) -> None:
        with self._lock:
            self._log_file = log_file

    def _ensure_log_dir(self) -> None:
        self._log_file.parent.mkdir(parents=True, exist_ok=True)

    def _write_jsonl(self, record: dict[str, Any]) -> None:
        self._ensure_log_dir()
        with self._lock:
            with open(self._log_file, "a", encoding="utf-8") as handle:
                handle.write(json.dumps(record, ensure_ascii=True) + "\n")

    def _get_mongo_collection(self) -> Collection | None:
        if self._mongo_collection is not None:
            return self._mongo_collection

        settings = get_settings()
        if not settings.mongodb_uri:
            return None

        try:
            self._mongo_client = MongoClient(
                settings.mongodb_uri,
                serverSelectionTimeoutMS=settings.mongodb_timeout_ms,
                connectTimeoutMS=settings.mongodb_timeout_ms,
                socketTimeoutMS=settings.mongodb_timeout_ms,
            )
            db = self._mongo_client[settings.mongodb_db_name]
            self._mongo_collection = db[settings.mongodb_forensic_collection]

            if not self._mongo_index_ready:
                self._mongo_collection.create_index(
                    [("session_id", ASCENDING), ("timestamp", ASCENDING)],
                    name="forensic_session_ts_idx",
                )
                self._mongo_collection.create_index(
                    [("mode", ASCENDING), ("action", ASCENDING)],
                    name="forensic_mode_action_idx",
                )
                self._mongo_index_ready = True
        except PyMongoError:
            self._mongo_collection = None
            self._mongo_client = None
            return None

        return self._mongo_collection

    def _write_mongo(self, record: dict[str, Any]) -> None:
        collection = self._get_mongo_collection()
        if collection is None:
            return
        try:
            collection.insert_one(record)
        except PyMongoError:
            # File sink already captured event.
            return

    def write(self, record: dict[str, Any]) -> None:
        self._write_jsonl(record)
        self._write_mongo(record)


forensic_sink = ForensicEventSink()


def write_forensic_event(record: dict[str, Any]) -> None:
    forensic_sink.write(record)
