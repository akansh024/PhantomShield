"""
PhantomShield – Canary Detector

Detects whether an incoming request triggers a canary action.
"""

from typing import Optional

from app.canary.definitions import CANARY_ACTIONS, CanaryAction


def detect_canary_hit(
    *,
    request_path: str,
    query_params: dict,
) -> Optional[CanaryAction]:
    """
    Check if request triggers a canary action.

    Args:
        request_path: API path being accessed
        query_params: Query parameters of the request

    Returns:
        CanaryAction if triggered, else None
    """

    for canary in CANARY_ACTIONS:
        if request_path in canary.paths:
            return canary

    # Example: deep pagination probe
    page = query_params.get("page")
    if page:
        try:
            if int(page) > 100:
                return next(
                    c for c in CANARY_ACTIONS
                    if c.name == "deep_pagination_probe"
                )
        except ValueError:
            pass

    return None
