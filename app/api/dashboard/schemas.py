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

class ForensicActionSummary(BaseModel):
    action: str
    label: str
    category: str
    description: str
    count: int
    suspicious: bool = False

class ForensicCategorySummary(BaseModel):
    category: str
    description: str
    count: int

class ForensicSummary(BaseModel):
    common_actions: list[ForensicActionSummary]
    category_breakdown: list[ForensicCategorySummary] = []
    targeted_routes: list[dict[str, Any]]
    suspicious_sessions: list[SessionInfo]
    window_minutes: int = 0
    total_events: int = 0

class ActionEvent(BaseModel):
    timestamp: datetime
    action: str
    route: str | None = None
    payload: dict[str, Any] | None = None
    action_label: str | None = None
    category: str | None = None
    description: str | None = None
    suspicious: bool = False

class RiskHistoryPoint(BaseModel):
    timestamp: datetime
    score_before: float | None = None
    score_after: float
    reason: str | None = None

class SessionDetails(BaseModel):
    session_id: str
    user_id: str | None = None
    user_name: str | None = None
    user_email: str | None = None
    is_test: bool = False
    is_test_session: bool = False
    archived: bool = False
    environment: str = "production"
    session_type: str = "guest"
    mode: str
    risk_score: float
    status: str = "active"
    created_at: datetime
    last_activity: datetime
    authenticated_at: datetime | None = None
    signup_at: datetime | None = None
    identity_label: str = "Guest / Anonymous session"
    state_label: str = "Live"
    risk_history: list[RiskHistoryPoint] = []
    recent_actions: list[ActionEvent] = []
    timeline: list[ActionEvent]
    cart_activity: list[dict[str, Any]]
    wishlist_activity: list[dict[str, Any]]
    orders: list[dict[str, Any]]

class AttackInsights(BaseModel):
    not_found_rate: float
    suspicious_routes_hit: int
    repeated_hits: list[dict[str, Any]]
    canary_triggers: int
