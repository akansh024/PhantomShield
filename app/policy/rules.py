"""
PhantomShield – Policy Rules

This module defines invariant policy rules that govern
how routing decisions are allowed to behave.

These rules represent architectural guarantees and must
NOT change at runtime.
"""

# =========================
# Routing Policies
# =========================

# Once a session is routed to the decoy system,
# it must NEVER be allowed to return to the real system.
ONE_WAY_ESCALATION: bool = True


# =========================
# Enforcement Policies
# =========================

# The system must not block, log out, or challenge users
# as part of PhantomShield routing decisions.
NO_BLOCKING: bool = True


# =========================
# ML Authority Policies
# =========================

# Machine learning is advisory only.
# ML outputs may influence risk scoring but must never
# directly control routing or access decisions.
ML_ADVISORY_ONLY: bool = True
