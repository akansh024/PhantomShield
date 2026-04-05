"""
PhantomShield - Session routing middleware.

Continuously evaluates request risk and updates session routing_state.
The frontend remains mode-agnostic because routing lives server-side.
"""

from __future__ import annotations

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.behavior.collector import BehaviorCollector
from app.behavior.features import BehaviorFeatureExtractor
from app.behavior.rules import BehaviorRuleEngine
from app.canary.detector import detect_canary_hit
from app.canary.impact import apply_canary_impact
from app.forensics.tracker import track_event
from app.risk.scorer import score_request_signals
from app.session.manager import SessionManager

_TRACKED_PREFIXES = ("/api", "/decoy", "/robots.txt")

_behavior_collector = BehaviorCollector()
_feature_extractor = BehaviorFeatureExtractor()
_rule_engine = BehaviorRuleEngine()


def _should_track_request(path: str) -> bool:
    return any(path.startswith(prefix) for prefix in _TRACKED_PREFIXES)


class SessionRoutingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore[override]
        if not _should_track_request(request.url.path):
            return await call_next(request)

        session = getattr(request.state, "session", None)
        if session is None:
            return await call_next(request)

        session_manager = SessionManager(session)
        initial_route = session.routing_state
        initial_risk = round(session.risk_score, 4)
        risk_updates: list[dict] = []

        # Immediate request-level signals (applied before route handler).
        for signal in score_request_signals(request):
            session_manager.increase_risk(signal.delta, reason=signal.reason)
            risk_updates.append(
                {
                    "reason": signal.reason,
                    "delta": round(signal.delta, 4),
                    "details": signal.details,
                }
            )

        canary = detect_canary_hit(
            request_path=request.url.path,
            query_params=dict(request.query_params),
        )
        if canary:
            before = session.risk_score
            apply_canary_impact(session_manager=session_manager, canary=canary)
            delta = round(max(session.risk_score - before, 0.0), 4)
            risk_updates.append(
                {
                    "reason": f"canary_{canary.name}",
                    "delta": delta,
                    "details": {"description": canary.description},
                }
            )
            track_event(
                request,
                "canary_triggered",
                {
                    "name": canary.name,
                    "description": canary.description,
                    "risk_delta": delta,
                },
            )

        # Evaluate policy once pre-handler so decoy behavior applies in this request.
        session_manager.evaluate_routing()

        response = await call_next(request)

        # Collect behavior after response to include status/error signal.
        await _behavior_collector.collect_request(
            session_id=session.session_id,
            route=request.url.path,
            method=request.method,
            response_status=response.status_code,
            query_params=dict(request.query_params),
            user_agent=request.headers.get("user-agent"),
        )

        snapshot = await _behavior_collector.get_session_snapshot(session.session_id)
        features = _feature_extractor.extract(snapshot)
        rule_delta = _rule_engine.evaluate(features)
        if rule_delta > 0:
            session_manager.increase_risk(rule_delta, reason="behavior_rules")
            risk_updates.append(
                {
                    "reason": "behavior_rules",
                    "delta": round(rule_delta, 4),
                    "details": {
                        "requests_per_second": round(features.get("requests_per_second", 0.0), 4),
                        "error_rate": round(features.get("error_rate", 0.0), 4),
                        "sensitive_ratio": round(features.get("sensitive_ratio", 0.0), 4),
                        "route_diversity": round(features.get("route_diversity", 0.0), 4),
                    },
                }
            )

        if response.status_code in (401, 403):
            session_manager.increase_risk(0.08, reason="authz_failure")
            risk_updates.append(
                {
                    "reason": "authz_failure",
                    "delta": 0.08,
                    "details": {"status_code": response.status_code},
                }
            )

        # Evaluate policy again with post-response behavior.
        session_manager.evaluate_routing()

        final_route = session.routing_state
        final_risk = round(session.risk_score, 4)

        if risk_updates:
            track_event(
                request,
                "risk_evaluated",
                {
                    "from_risk": initial_risk,
                    "to_risk": final_risk,
                    "updates": risk_updates,
                },
            )

        if initial_route != final_route:
            track_event(
                request,
                "routing_state_changed",
                {
                    "from": initial_route,
                    "to": final_route,
                    "risk_score": final_risk,
                },
            )

        # Final request telemetry log as per requirements
        track_event(
            request,
            "request_processed",
            {
                "method": request.method,
                "status_code": response.status_code,
                "request_count": snapshot.get("total_requests", 0) if snapshot else 0,
            },
        )

        return response
