"""
Forensic event schema used across PhantomShield.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, Field


class ForensicEvent(BaseModel):
    session_id: str
    user_id: str | None = None
    action: str
    route: str
    payload: dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    mode: Literal["REAL", "DECOY"]

    # Optional metadata for richer investigations.
    method: str | None = None
    client_ip: str | None = None
    risk_score: float | None = None
    notes: str | None = None

    def to_record(self) -> dict[str, Any]:
        record = self.model_dump()
        record["timestamp"] = (
            self.timestamp.astimezone(timezone.utc)
            .isoformat()
            .replace("+00:00", "Z")
        )
        return record
