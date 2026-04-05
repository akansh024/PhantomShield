from fastapi import APIRouter

router = APIRouter(prefix="/api")

@router.get("/admin")
def api_admin_root():
    return {"shield": "active", "access": "restricted"}

@router.get("/internal")
def get_internal_root():
    return {"status": "unauthorized", "service": "internal_mesh"}

@router.get("/internal/debug")
def get_internal_debug():
    return {"status": "debug_mode_active", "version": "4.2.0-alpha"}

@router.get("/secrets")
def get_secrets():
    return {"message": "Access Denied", "hint": "Requires internal VPN"}

@router.get("/config")
def get_config_root():
    return {"version": "1.0.4", "env": "prod"}

@router.get("/config/auth")
def get_config_auth():
    return {"auth_provider": "PhantomAuth Engine", "mfa_enabled": True}

@router.get("/users/export")
def export_users():
    return {"status": "export_queued", "job_id": "job_exp_8821"}

@router.get("/payment-history")
def get_payment_history():
    return {
        "recent_transactions": [
            {"id": "tx_9921", "amount": 299.99},
            {"id": "tx_9922", "amount": 42.50}
        ]
    }

# --- Root-level Baits (outside /api) ---
from fastapi import APIRouter as RootRouter
root_bait = RootRouter()

@root_bait.get("/admin")
@root_bait.get("/admin/login")
@root_bait.get("/admin/dashboard")
def admin_baits():
    return {"error": "Authentication Timeout", "trace_id": "tr_ad_9921"}

@root_bait.get("/hidden")
@root_bait.get("/backup")
@root_bait.get("/private")
@root_bait.get("/dev")
@root_bait.get("/staging")
@root_bait.get("/old-admin")
def generic_baits():
    return {"message": "Directory browsing disabled", "status": 403}
