import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

PROJECT_ROOT = Path(__file__).resolve().parents[2]


def _load_env_file(env_path: Path) -> None:
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'\"")

        if key and key not in os.environ:
            os.environ[key] = value


_load_env_file(PROJECT_ROOT / ".env")


@dataclass(frozen=True)
class Settings:
    jwt_secret: str
    mongodb_uri: str
    mongodb_db_name: str
    mongodb_users_collection: str
    mongodb_forensic_collection: str
    mongodb_sessions_collection: str
    mongodb_cart_collection: str
    mongodb_wishlist_collection: str
    mongodb_orders_collection: str
    mongodb_timeout_ms: int
    app_environment: str
    frontend_url: str
    production_host: str


def get_settings() -> Settings:
    # Re-load .env on access so dev servers don't hold stale settings
    # when .env is created/updated after process start.
    _load_env_file(PROJECT_ROOT / ".env")
    frontend_url = os.getenv("FRONTEND_URL", "https://phantomshield.vercel.app").strip()
    parsed_host = urlparse(frontend_url).hostname or ""
    production_host = os.getenv("PRODUCTION_HOST", parsed_host).strip().lower()

    return Settings(
        jwt_secret=os.getenv("JWT_SECRET", "phantom-dev-secret-key-super-secure"),
        mongodb_uri=os.getenv("MONGODB_URI", "").strip(),
        mongodb_db_name=os.getenv("MONGODB_DB_NAME", "phantomshield"),
        mongodb_users_collection=os.getenv("MONGODB_USERS_COLLECTION", "users"),
        mongodb_forensic_collection=os.getenv("MONGODB_FORENSIC_COLLECTION", "forensic_events"),
        mongodb_sessions_collection=os.getenv("MONGODB_SESSIONS_COLLECTION", "sessions"),
        mongodb_cart_collection=os.getenv("MONGODB_CART_COLLECTION", "cart_items"),
        mongodb_wishlist_collection=os.getenv("MONGODB_WISHLIST_COLLECTION", "wishlist_items"),
        mongodb_orders_collection=os.getenv("MONGODB_ORDERS_COLLECTION", "orders"),
        mongodb_timeout_ms=int(os.getenv("MONGODB_TIMEOUT_MS", "5000")),
        app_environment=os.getenv("APP_ENVIRONMENT", "production").strip().lower(),
        frontend_url=frontend_url,
        production_host=production_host,
    )
