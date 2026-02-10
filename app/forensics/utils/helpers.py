import uuid
import datetime
import hashlib
from typing import Dict, Any


def generate_session_id() -> str:
    """
    Generates a unique session ID for each attacker session.
    """
    return str(uuid.uuid4())


def current_utc_time():
    """
    Returns current UTC timestamp.
    """
    return datetime.datetime.utcnow()


def hash_payload(payload: Dict[str, Any]) -> str:
    """
    Hashes payload data to safely store sensitive attacker inputs.
    """
    payload_str = str(payload).encode()
    return hashlib.sha256(payload_str).hexdigest()


def normalize_ip(ip_address: str) -> str:
    """
    Masks last octet of IP for privacy-safe storage.
    Example: 192.168.1.45 → 192.168.1.0
    """
    parts = ip_address.split(".")
    if len(parts) == 4:
        parts[-1] = "0"
    return ".".join(parts)


def clean_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Removes dangerous or unnecessary keys from payload.
    """
    blocked_keys = {"password", "token", "secret"}
    return {k: v for k, v in payload.items() if k.lower() not in blocked_keys}
