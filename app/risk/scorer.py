"""
PhantomShield - Request-level risk scoring helpers.

This module scores high-signal request probes and returns additive risk deltas.
It does not mutate session state or make routing decisions.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from urllib.parse import unquote_plus

from fastapi import Request


@dataclass(frozen=True)
class RiskSignal:
    reason: str
    delta: float
    details: dict[str, Any]


_SUSPICIOUS_TOKENS = (
    " union ",
    " select ",
    " drop ",
    " information_schema",
    "' or '1'='1",
    "\" or \"1\"=\"1",
    "--",
    "/*",
    "*/",
    "<script",
    "onerror=",
    "sleep(",
    "benchmark(",
    "../",
    "..\\",
    "%2e%2e",
)

_PROTECTED_STORE_PREFIXES = ("/api/store", "/api/auth")


def _is_store_request(path: str) -> bool:
    return any(path.startswith(prefix) for prefix in _PROTECTED_STORE_PREFIXES)


def _decode_text(value: str) -> str:
    return unquote_plus(value).lower()


def score_request_signals(request: Request) -> list[RiskSignal]:
    """
    Return request-level risk signals.

    Signals are intentionally conservative and additive.
    """
    path = request.url.path
    if not _is_store_request(path):
        return []

    signals: list[RiskSignal] = []
    decoded_path = _decode_text(path)

    if any(token in decoded_path for token in ("../", "..\\", "%2e%2e")):
        signals.append(
            RiskSignal(
                reason="path_traversal_probe",
                delta=0.45,
                details={"path": path},
            )
        )

    query_values = [_decode_text(str(v)) for v in request.query_params.values()]
    query_blob = " ".join(query_values)
    hit_tokens = [token for token in _SUSPICIOUS_TOKENS if token in query_blob]
    if hit_tokens:
        signals.append(
            RiskSignal(
                reason="suspicious_query_pattern",
                delta=0.35,
                details={"tokens": hit_tokens[:5]},
            )
        )

    page_raw = request.query_params.get("page")
    if page_raw:
        try:
            page = int(page_raw)
            if page > 100:
                signals.append(
                    RiskSignal(
                        reason="deep_pagination_probe",
                        delta=0.25,
                        details={"page": page},
                    )
                )
        except ValueError:
            # Non-integer page values are ignored here.
            pass

    return signals
