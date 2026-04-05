"""
Compatibility module for canary definitions.

The original file name is kept as `defnitions.py` for backward compatibility.
New imports should use this canonical module.
"""

from app.canary.defnitions import CANARY_ACTIONS, CanaryAction

__all__ = ["CanaryAction", "CANARY_ACTIONS"]
