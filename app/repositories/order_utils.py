"""
PhantomShield – Order Utilities

Shared helpers used by both real and decoy order repositories.
"""

from __future__ import annotations

import random
from datetime import date, timedelta, datetime


# ---------------------------------------------------------------------------
# Order ID generation
# ---------------------------------------------------------------------------

def generate_order_id() -> str:
    """
    Generate a realistic order ID.
    Format: ORD-YYYYMMDD-XXXX  (e.g., ORD-20260404-7823)
    """
    date_part = datetime.utcnow().strftime("%Y%m%d")
    suffix = random.randint(1000, 9999)
    return f"ORD-{date_part}-{suffix}"


# ---------------------------------------------------------------------------
# Estimated delivery (skips weekends)
# ---------------------------------------------------------------------------

def estimate_delivery(business_days: int = 4) -> str:
    """
    Return estimated delivery date string skipping weekends.
    Returns: e.g. "08 Apr 2026"
    """
    delivery = date.today()
    added = 0
    while added < business_days:
        delivery += timedelta(days=1)
        if delivery.weekday() < 5:   # Mon=0 … Fri=4
            added += 1
    return delivery.strftime("%d %b %Y")


# ---------------------------------------------------------------------------
# Promo code resolver (v1 — static codes)
# ---------------------------------------------------------------------------

_PROMO_CODES: dict[str, float | int] = {
    "WELCOME10": 0.10,   # 10% off subtotal
    "FLAT100": 100,      # ₹100 flat discount
    "FLAT200": 200,      # ₹200 flat discount
    "SAVE15": 0.15,      # 15% off subtotal
}


def resolve_promo_discount(code: str, subtotal: float) -> float:
    """
    Apply a promo code to a subtotal.

    Returns:
        Discount amount (float, always ≥ 0, never exceeds subtotal).
        Returns 0.0 for invalid or empty codes silently.
    """
    if not code:
        return 0.0

    value = _PROMO_CODES.get(code.upper().strip())
    if value is None:
        return 0.0

    if isinstance(value, float) and value < 1:
        # Percentage discount
        return round(subtotal * value, 2)

    # Flat discount — never exceed subtotal
    return min(float(value), subtotal)
