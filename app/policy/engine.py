"""
PhantomShield – Policy Decision Engine

This module contains stateless logic that evaluates
session state against policy rules and risk thresholds
to determine routing decisions.

IMPORTANT:
- This module does NOT modify session state
- This module does NOT calculate risk
- This module does NOT interact with ML
- This module returns decisions only
"""

from dataclasses import dataclass
from typing import Literal

from app.risk.thresholds import (
    LOW_RISK_THRESHOLD,
    HIGH_RISK_THRESHOLD,
)
from app.policy.rules import ONE_WAY_ESCALATION


# =========================
# Decision Model
# =========================

Route = Literal["REAL", "DECOY"]


@dataclass(frozen=True)
class PolicyDecision:
    """
    Represents a routing decision produced by the policy engine.
    """
    route: Route
    reason: str


# =========================
# Policy Evaluation
# =========================

def evaluate_policy(
    *,
    risk_score: float,
    current_route: Route,
    hit_sensitive_route: bool = False,
) -> PolicyDecision:
    """
    Evaluate routing policy for a session.

    Args:
        risk_score: Current cumulative session risk (0.0 – 1.0)
        current_route: Current session routing state ("REAL" or "DECOY")
        hit_sensitive_route: True if restricted route was requested

    Returns:
        PolicyDecision indicating desired route and reason.
    """

    # --- Rule 1: One-way escalation lock ---
    if ONE_WAY_ESCALATION and current_route == "DECOY":
        return PolicyDecision(
            route="DECOY",
            reason="one_way_escalation_lock"
        )

    # --- Rule 2: Sensitive route requested ---
    if hit_sensitive_route:
        return PolicyDecision(
            route="DECOY",
            reason="sensitive_route_requested"
        )

    # --- Rule 3: All other cases remain real ---
    return PolicyDecision(
        route="REAL",
        reason="no_sensitive_route_requested"
    )
