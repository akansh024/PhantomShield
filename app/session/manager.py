"""
PhantomShield – Session Manager

Responsible for:
- Updating session state
- Applying risk updates
- Applying risk decay
- Calling policy engine
- Escalating routing state (one-way only)

This module is the ONLY place allowed to mutate SessionState.
"""

from datetime import datetime
from typing import Optional

from app.session.models import SessionState
from app.policy.engine import evaluate_policy
from app.risk.thresholds import LOW_RISK_THRESHOLD
from app.session.decay import apply_risk_decay


class SessionManager:
    """
    Orchestrates all session-level state changes.
    """

    def __init__(self, session: SessionState):
        self.session = session

    # =========================
    # Activity Tracking
    # =========================

    def record_activity(self) -> None:
        """
        Update session activity timestamp.
        """
        self.session.last_activity_at = datetime.utcnow()

    # =========================
    # Risk Updates
    # =========================

    def increase_risk(
        self,
        amount: float,
        reason: Optional[str] = None,
    ) -> None:
        """
        Increase session risk score.

        Args:
            amount: Risk increment (must be positive)
            reason: Optional reason flag
        """
        if amount <= 0:
            return

        self.session.risk_score = min(
            1.0,
            self.session.risk_score + amount
        )

        if reason:
            self.session.flags[f"risk_{reason}"] = True

    def decrease_risk(self, amount: float) -> None:
        """
        Decrease session risk score safely.

        Args:
            amount: Risk decrement (must be positive)
        """
        if amount <= 0:
            return

        self.session.risk_score = max(
            LOW_RISK_THRESHOLD,
            self.session.risk_score - amount
        )

    # =========================
    # Risk Decay
    # =========================

    def apply_decay(self) -> None:
        """
        Apply risk decay if conditions allow.
        """
        new_risk = apply_risk_decay(
            current_risk=self.session.risk_score,
            last_activity_at=self.session.last_activity_at,
        )

        self.session.risk_score = new_risk

    # =========================
    # Policy Evaluation
    # =========================

    def evaluate_routing(self) -> None:
        """
        Evaluate policy engine and apply routing escalation
        if required.
        """
        decision = evaluate_policy(
            risk_score=self.session.risk_score,
            current_route=self.session.routing_state,
        )

        # Apply escalation ONLY if moving to decoy
        if decision.route == "decoy" and self.session.routing_state != "decoy":
            self.session.routing_state = "decoy"
            self.session.flags["routed_to_decoy"] = True

    # =========================
    # Main Update Cycle
    # =========================

    def process_cycle(self) -> None:
        """
        Full session update cycle.
        Call this once per request.
        """
        self.record_activity()
        self.apply_decay()
        self.evaluate_routing()
