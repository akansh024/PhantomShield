from typing import Any
from fastapi import APIRouter, Depends, HTTPException

from app.api.admin.routes import get_current_operator
from app.api.dashboard.schemas import (
    DashboardOverview,
    TrendPoint,
    ForensicSummary,
    SessionDetails,
    AttackInsights,
)
from app.db.mongo.admin_repo import MongoAdminRepository, get_admin_repo

router = APIRouter(prefix="/api/dashboard", tags=["behavioral-dashboard"])


@router.get("/overview", response_model=DashboardOverview)
def get_overview(
    admin_repo: MongoAdminRepository = Depends(get_admin_repo),
    operator: dict = Depends(get_current_operator),
) -> DashboardOverview:
    data = admin_repo.get_dashboard_overview()
    return DashboardOverview(**data)


@router.get("/session-trends", response_model=list[TrendPoint])
def get_session_trends(
    admin_repo: MongoAdminRepository = Depends(get_admin_repo),
    operator: dict = Depends(get_current_operator),
) -> list[TrendPoint]:
    data = admin_repo.get_dashboard_session_trends()
    return [TrendPoint(**d) for d in data]


@router.get("/forensic-summary", response_model=ForensicSummary)
def get_forensic_summary(
    admin_repo: MongoAdminRepository = Depends(get_admin_repo),
    operator: dict = Depends(get_current_operator),
) -> ForensicSummary:
    data = admin_repo.get_dashboard_forensic_summary()
    return ForensicSummary(**data)


@router.get("/session/{session_id}", response_model=SessionDetails)
def get_session_details(
    session_id: str,
    admin_repo: MongoAdminRepository = Depends(get_admin_repo),
    operator: dict = Depends(get_current_operator),
) -> SessionDetails:
    data = admin_repo.get_dashboard_session_details(session_id)
    if not data:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionDetails(**data)


@router.get("/attacks", response_model=AttackInsights)
def get_attacks(
    admin_repo: MongoAdminRepository = Depends(get_admin_repo),
    operator: dict = Depends(get_current_operator),
) -> AttackInsights:
    data = admin_repo.get_dashboard_attacks()
    return AttackInsights(**data)
