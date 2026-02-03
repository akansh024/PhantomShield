"""
PhantomShield – Risk Threshold Definitions

This module defines static risk thresholds used by the
Policy Engine to make routing decisions.

IMPORTANT RULES:
- Thresholds are constants, not learned values
- Thresholds are NOT modified at runtime
- ML does NOT change thresholds
"""

# =========================
# Risk Thresholds (0.0 – 1.0)
# =========================

# Below this value, sessions are considered low risk
LOW_RISK_THRESHOLD: float = 0.30

# At or above this value, sessions are considered high risk
# and eligible for decoy routing
HIGH_RISK_THRESHOLD: float = 0.60


# =========================
# Validation (defensive)
# =========================

def validate_thresholds() -> None:
    """
    Ensures threshold configuration is sane.
    Called once at application startup.
    """
    if not 0.0 <= LOW_RISK_THRESHOLD < HIGH_RISK_THRESHOLD <= 1.0:
        raise ValueError(
            "Invalid risk thresholds: "
            "Ensure 0.0 <= LOW < HIGH <= 1.0"
        )
