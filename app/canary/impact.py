"""
PhantomShield – Canary Impact

Applies the risk impact of a triggered canary.
"""

from app.session.manager import SessionManager
from app.canary.definitions import CanaryAction


def apply_canary_impact(
    *,
    session_manager: SessionManager,
    canary: CanaryAction,
) -> None:
    """
    Apply canary risk impact to the session.

    Args:
        session_manager: Active session manager
        canary: Triggered canary action
    """

    session_manager.increase_risk(
        amount=canary.risk_impact,
        reason=f"canary_{canary.name}"
    )
