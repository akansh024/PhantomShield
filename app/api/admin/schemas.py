"""
Pydantic schemas for PhantomShield admin dashboard APIs.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class DashboardSummary(BaseModel):
    total_sessions: int
    active_sessions: int
    real_sessions: int
    decoy_sessions: int
    suspicious_sessions: int
    total_events: int
    total_cart_actions: int
    total_wishlist_actions: int
    total_orders: int
    average_risk_score: float
    mode_distribution: dict[str, int] = Field(default_factory=dict)
    risk_distribution: dict[str, int] = Field(default_factory=dict)


class SessionRecord(BaseModel):
    session_id: str
    user_id: str | None = None
    user_name: str | None = None
    user_email: str | None = None
    is_test: bool = False
    routing_state: Literal["REAL", "DECOY"]
    risk_score: float
    created_at: datetime
    last_activity: datetime
    status: Literal["active", "idle", "expired"]
    action_count: int = 0


class ForensicEventRecord(BaseModel):
    session_id: str
    user_id: str | None = None
    action: str
    route: str
    payload: dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime
    mode: Literal["REAL", "DECOY"]
    method: str | None = None
    client_ip: str | None = None
    risk_score: float | None = None
    notes: str | None = None


class SessionTimelinePoint(BaseModel):
    timestamp: datetime
    risk_score: float | None = None
    mode: Literal["REAL", "DECOY"]
    action: str


class SessionDetail(BaseModel):
    session: SessionRecord
    last_event_timestamp: datetime | None = None
    behavior_summary: dict[str, Any]
    route_history: list[dict[str, Any]]
    mode_changes: list[dict[str, Any]]
    risk_timeline: list[SessionTimelinePoint]
    cart_activity: list[ForensicEventRecord]
    wishlist_activity: list[ForensicEventRecord]
    order_activity: list[ForensicEventRecord]


class ProductCount(BaseModel):
    product_id: str
    product_name: str
    count: int


class DistributionBucket(BaseModel):
    label: str
    count: int


class SessionTrendPoint(BaseModel):
    bucket: datetime
    active_sessions: int
    unique_users: int


class AdminLoginRequest(BaseModel):
    operator_id: str
    passcode: str


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    operator_name: str
    role: str
