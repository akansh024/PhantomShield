"""
PhantomShield – Session Models

Defines the structure of server-side session state.
This module contains NO business logic.
"""

from dataclasses import dataclass, field
from typing import Literal, Dict
from datetime import datetime


Route = Literal["real", "decoy"]


@dataclass
class SessionState:
    """
    Represents the mutable state of an authenticated session.
    """

    # Identity
    session_id: str
    user_id: str

    # Routing
    routing_state: Route = "real"

    # Risk
    risk_score: float = 0.0

    # Flags for policy / debugging
    flags: Dict[str, bool] = field(default_factory=dict)

    # Timing
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_activity_at: datetime = field(default_factory=datetime.utcnow)

    def update_activity(self) -> None:
        """
        Update last activity timestamp.
        """
        self.last_activity_at = datetime.utcnow()
