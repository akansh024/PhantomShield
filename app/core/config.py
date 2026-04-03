import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

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
    mongodb_timeout_ms: int


@lru_cache
def get_settings() -> Settings:
    return Settings(
        jwt_secret=os.getenv("JWT_SECRET", "phantom-dev-secret-key-super-secure"),
        mongodb_uri=os.getenv("MONGODB_URI", "").strip(),
        mongodb_db_name=os.getenv("MONGODB_DB_NAME", "phantomshield"),
        mongodb_users_collection=os.getenv("MONGODB_USERS_COLLECTION", "users"),
        mongodb_timeout_ms=int(os.getenv("MONGODB_TIMEOUT_MS", "5000")),
    )
