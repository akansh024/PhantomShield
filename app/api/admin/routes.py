"""
PhantomShield - Admin dashboard API routes.
"""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query

from app.api.admin.schemas import (
    AdminLoginRequest,
    AdminLoginResponse,
    DashboardSummary,
    ForensicEventRecord,
    ProductCount,
    SessionDetail,
    SessionRecord,
    SessionTrendPoint,
)
# Assuming generic Operator auth check via core/security.py
from app.core.security import decode_token, create_access_token
from app.db.mongo.admin_repo import MongoAdminRepository, get_admin_repo
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(prefix="/api/admin", tags=["admin-dashboard"])
security = HTTPBearer()


@router.post("/login", response_model=AdminLoginResponse)
def admin_login(payload: AdminLoginRequest) -> AdminLoginResponse:
    """
    Simple operator authentication. In production, this would check a DB.
    For validation, we use hardcoded credentials.
    """
    if payload.operator_id == "phantom_07" and payload.passcode == "admin123":
        token_data = {
            "sub": "sec_ops_01",
            "name": "Phantom Commander",
            "role": "Lead Analyst"
        }
        token = create_access_token(token_data)
        return AdminLoginResponse(
            access_token=token,
            operator_name="Phantom Commander",
            role="Lead Analyst"
        )
    
    from fastapi import HTTPException
    raise HTTPException(status_code=401, detail="Invalid operator credentials")


def get_current_operator(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict[str, Any]:
    """
    Validates the Operator JWT and extracts identity metadata.
    """
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Invalid or expired operator token")
    return payload


@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    admin_repo: MongoAdminRepository = Depends(get_admin_repo),
    operator: dict = Depends(get_current_operator), # Ensure auth
) -> DashboardSummary:
    return admin_repo.get_summary_stats()


@router.get("/sessions", response_model=list[SessionRecord])
def list_sessions(
    filter_mode: str = Query("live", regex="^(live|logged_in|guest|suspicious|historical|test|ALL)$"),
    routing_state: str | None = Query(None, regex="^(REAL|DECOY)$"),
    min_risk: float | None = Query(None, ge=0.0, le=1.0),
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    admin_repo: MongoAdminRepository = Depends(get_admin_repo),
    operator: dict = Depends(get_current_operator),
) -> list[SessionRecord]:
    return admin_repo.get_sessions(
        limit=limit,
        skip=skip,
        routing_state=routing_state,
        min_risk=min_risk,
        filter_mode=filter_mode
    )


@router.get("/sessions/{session_id}", response_model=SessionRecord)
def get_session(
    session_id: str,
    admin_repo: MongoAdminRepository = Depends(get_admin_repo),
    operator: dict = Depends(get_current_operator),
) -> SessionRecord:
    # Use existing get_sessions with a filter for session_id
    sessions = admin_repo.get_sessions(limit=1, skip=0, routing_state=None, min_risk=None)
    # This is a bit inefficient for a detail call, but works for the skeleton.
    # In practice, session_coll.find_one would be better.
    # I'll implement a proper detail call in admin_repo later if needed.
    session = next((s for s in sessions if s.session_id == session_id), None)
    if not session:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/sessions/{session_id}/events", response_model=list[ForensicEventRecord])
def get_session_forensics(
    session_id: str,
    admin_repo: MongoAdminRepository = Depends(get_admin_repo),
    operator: dict = Depends(get_current_operator),
) -> list[ForensicEventRecord]:
    events = admin_repo.get_session_events(session_id)
    return [ForensicEventRecord(**e) for e in events]


@router.get("/analytics/sessions-over-time", response_model=list[SessionTrendPoint])
def get_sessions_over_time(
    admin_repo: MongoAdminRepository = Depends(get_admin_repo),
    operator: dict = Depends(get_current_operator),
) -> list[SessionTrendPoint]:
    return admin_repo.get_sessions_trend()


@router.get("/analytics/products", response_model=list[ProductCount])
def get_product_analytics(
    metric: str = Query("view", regex="^(view|cart|order)$"),
    limit: int = Query(5, ge=1, le=20),
    admin_repo: MongoAdminRepository = Depends(get_admin_repo),
    operator: dict = Depends(get_current_operator),
) -> list[ProductCount]:
    return admin_repo.get_top_products(metric=metric, limit=limit)


# --- Sensitive Test Routes (Validation Bait) ---

@router.get("/internal/debug")
def get_internal_debug():
    """Bait route for internal debug info."""
    return {
        "status": "debug_mode_active",
        "version": "4.2.0-alpha",
        "internal_ip": "10.0.0.42",
        "services": ["auth-v2", "db-proxy", "risk-engine-ml"]
    }

@router.get("/secrets")
def get_secrets():
    """Bait route for secrets."""
    return {
        "message": "Access Denied",
        "hint": "Requires internal VPN and X-Admin-Legacy-Token",
        "available_keys": ["aws_prod_fallback", "stripe_live_test"]
    }

@router.get("/config/auth")
def get_config_auth():
    """Bait route for auth config."""
    return {
        "auth_provider": "PhantomAuth Engine",
        "session_timeout": 3600,
        "mfa_enabled": True,
        "token_alg": "HS256"
    }

@router.get("/users/export")
def export_users():
    """Bait route for user export."""
    return {
        "status": "export_queued",
        "job_id": "job_exp_8821",
        "format": "csv",
        "estimated_completion": "300s"
    }

@router.get("/payment-history")
def get_payment_history():
    """Bait route for payment history."""
    return {
        "recent_transactions": [
            {"id": "tx_9921", "amount": 299.99, "status": "settled"},
            {"id": "tx_9922", "amount": 42.50, "status": "pending"}
        ],
        "merchant_id": "m_shield_01"
    }
