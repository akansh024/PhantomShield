"""
PhantomShield – Canary Definitions

Defines all canary actions exposed by the system.
These are high-signal, low-noise indicators of attacker intent.

IMPORTANT:
- Canary actions must NOT be linked in UI
- Canary actions must NOT affect real data
- Canary actions must be harmless if triggered
"""

from dataclasses import dataclass
from typing import List


@dataclass(frozen=True)
class CanaryAction:
    """
    Represents a single canary action definition.
    """
    name: str
    description: str
    risk_impact: float
    paths: List[str]


# =========================
# Canary Action Registry
# =========================

CANARY_ACTIONS: List[CanaryAction] = [

    CanaryAction(
        name="hidden_export_endpoint",
        description="Access to non-UI export endpoint",
        risk_impact=0.35,
        paths=[
            "/api/v1/export",
            "/api/v1/export-summary",
        ],
    ),

    CanaryAction(
        name="privilege_probe",
        description="Attempt to access or modify privilege-related fields",
        risk_impact=0.40,
        paths=[
            "/api/v1/admin",
            "/api/v1/roles",
        ],
    ),

    CanaryAction(
        name="deep_pagination_probe",
        description="Unusually deep pagination access",
        risk_impact=0.25,
        paths=[
            "/api/v1/data",
        ],
    ),
]
