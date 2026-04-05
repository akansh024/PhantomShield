"""
Session and cookie constants for PhantomShield storefront APIs.
"""

COOKIE_SESSION_ID = "session_id"
COOKIE_AUTH_TOKEN = "auth_token"

SESSION_MAX_AGE_SECONDS = 60 * 60
SESSION_EXPIRY_SECONDS = SESSION_MAX_AGE_SECONDS

COOKIE_HTTPONLY = True
COOKIE_SAMESITE = "lax"
COOKIE_PATH = "/"
