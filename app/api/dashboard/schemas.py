from datetime import datetime
from typing import Any
from pydantic import BaseModel

class DashboardOverview(BaseModel):
    total_sessions: int
    active_sessions: int
    total_orders: int
    total_cart_items: int
    total_wishlist_items: int
    suspicious_sessions: int
    decoy_sessions: int

class TrendPoint(BaseModel):
    time: str
    active_sessions: int

class SessionInfo(BaseModel):
    session_id: str
    risk_score: float
    mode: str
    last_activity: datetime

class ForensicSummary(BaseModel):
    common_actions: list[dict[str, Any]]
    targeted_routes: list[dict[str, Any]]
    suspicious_sessions: list[SessionInfo]

class ActionEvent(BaseModel):
    timestamp: datetime
    action: str
    route: str | None = None
    payload: dict[str, Any] | None = None

class SessionDetails(BaseModel):
    session_id: str
    user_id: str | None = None
    user_name: str | None = None
    user_email: str | None = None
    is_test: bool = False
    mode: str
    risk_score: float
    timeline: list[ActionEvent]
    cart_activity: list[dict[str, Any]]
    wishlist_activity: list[dict[str, Any]]
    orders: list[dict[str, Any]]

class AttackInsights(BaseModel):
    not_found_rate: float
    suspicious_routes_hit: int
    repeated_hits: list[dict[str, Any]]
    canary_triggers: int
