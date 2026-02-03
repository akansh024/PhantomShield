"""
PhantomShield – Risk Decay Logic

Handles controlled reduction of session risk over time.

Design goals:
- Prevent trust farming
- Be forgiving to legitimate users
- Never instantly reset risk
- Never override one-way decoy routing
"""

from datetime import datetime, timedelta


# =========================
# Decay Configuration
# =========================

# How long a session must remain clean before decay applies
DECAY_GRACE_PERIOD = timedelta(minutes=2)

# How much risk decays per decay step
DECAY_STEP = 0.01

# Maximum decay allowed in a single cycle
MAX_DECAY_PER_CYCLE = 0.03

# Minimum risk floor (never decay below this in-session)
MIN_RISK_FLOOR = 0.05


# =========================
# Decay Logic
# =========================

def apply_risk_decay(
    *,
    current_risk: float,
    last_activity_at: datetime,
) -> float:
    """
    Apply controlled risk decay based on inactivity and time.

    Args:
        current_risk: Current session risk score (0.0 – 1.0)
        last_activity_at: Timestamp of last session activity

    Returns:
        Updated risk score after decay
    """

    now = datetime.utcnow()

    # If activity was recent, do not decay
    if now - last_activity_at < DECAY_GRACE_PERIOD:
        return current_risk

    # Calculate decay amount
    decay_amount = min(
        MAX_DECAY_PER_CYCLE,
        DECAY_STEP
    )

    # Apply decay but respect minimum floor
    new_risk = max(
        MIN_RISK_FLOOR,
        current_risk - decay_amount
    )

    return new_risk
