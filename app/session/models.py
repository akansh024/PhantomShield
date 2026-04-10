"""
PhantomShield - Session Models.

Canonical session fields for routing:
- session_id
- user_id (optional)
- routing_state (REAL | DECOY)
- risk_score
- created_at
- last_activity
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Literal, Optional

RoutingState = Literal["REAL", "DECOY"]


@dataclass
class SessionState:
    session_id: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    is_test: bool = False
    
    routing_state: RoutingState = "REAL"
    risk_score: float = 0.0
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_activity: datetime = field(default_factory=datetime.utcnow)

    # Optional server-side flags used by risk/policy modules.
    flags: dict[str, bool] = field(default_factory=dict)

    def update_activity(self) -> None:
        self.last_activity = datetime.utcnow()

    @property
    def last_activity_at(self) -> datetime:
        """
        Backward-compatible alias for existing modules.
        """
        return self.last_activity

    @last_activity_at.setter
    def last_activity_at(self, value: datetime) -> None:
        self.last_activity = value
