from fastapi import APIRouter

router = APIRouter(prefix="/decoy")

@router.get("/admin")
def decoy_admin():
    return {
        "status": "access_granted",
        "role": "guest_admin",
        "permissions": ["view_only"],
        "message": "Welcome to the hidden internal admin panel."
    }

@router.get("/orders")
def decoy_orders():
    return {
        "orders": [
            {"id": "ORD-101", "total": 120.50, "status": "shipped"},
            {"id": "ORD-102", "total": 85.00, "status": "processing"}
        ]
    }

@router.get("/profile")
def decoy_profile():
    return {
        "username": "guest_user_44",
        "email": "guest@phantom.internal",
        "last_login": "2026-04-01T12:00:00Z"
    }

@router.get("/payment-history")
def decoy_payment_history():
    return {
        "payments": [
            {"id": "P-900", "amount": 120.50, "date": "2026-03-15"},
            {"id": "P-901", "amount": 85.00, "date": "2026-03-22"}
        ]
    }

@router.get("/secrets")
def decoy_secrets():
    return {
        "vault_id": "v_7721",
        "keys": [
            {"name": "legacy_api_key", "value": "phantom_sk_live_9921_abc"},
            {"name": "root_backup_hash", "value": "sha256:7f83b1...32"}
        ]
    }