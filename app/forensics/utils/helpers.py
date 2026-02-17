import uuid
import datetime
import hashlib
import json
import ipaddress
from typing import Dict, Any, Optional


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
    
    Uses JSON serialization with sorted keys to ensure deterministic hashing.
    This ensures the same payload always produces the same hash.
    """
    payload_str = json.dumps(payload, sort_keys=True).encode()
    return hashlib.sha256(payload_str).hexdigest()


def normalize_ip(ip_address: Optional[str]) -> str:
    """
    Normalizes IP address for privacy-safe storage.
    
    - IPv4: Masks last octet (e.g., 192.168.1.45 → 192.168.1.0)
    - IPv6: Returns first 4 segments (e.g., 2001:0db8:85a3:0000:0000:8a2e:0370:7334 → 2001:0db8:85a3:0000)
    - Invalid format: Returns original string unchanged
    - None input: Returns empty string
    """
    if ip_address is None:
        return ""
    
    try:
        ip = ipaddress.ip_address(ip_address)
        
        if ip.version == 4:
            # IPv4: mask last octet
            parts = str(ip).split(".")
            parts[-1] = "0"
            return ".".join(parts)
        else:
            # IPv6: return first 4 segments
            parts = str(ip).split(":")
            # Ensure we have at least 4 segments, pad if necessary
            while len(parts) < 4:
                parts.append("0000")
            return ":".join(parts[:4]) + "::"
            
    except ValueError:
        # Invalid IP format, return original string unchanged
        return ip_address


def clean_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitizes payload by masking sensitive values instead of removing keys.
    
    Sensitive values are replaced with "***" to preserve key presence
    while protecting sensitive data. This maintains payload structure
    for forensic analysis.
    """
    blocked_keys = {"password", "token", "secret", "authorization", 
                    "api_key", "apikey", "key", "credentials"}
    
    cleaned = {}
    for key, value in payload.items():
        if key.lower() in blocked_keys:
            cleaned[key] = "***"
        else:
            cleaned[key] = value
    
    return cleaned


# -----------------------------------------------------------------------------
# NOTE: These helper functions are designed to be used inside ForensicLogger 
#       before writing events to the database. They ensure:
#       1. Deterministic hashing for payloads
#       2. Privacy-safe IP storage
#       3. Sensitive data masking in payloads
#       4. Consistent timestamp generation
#       
#       Usage example in ForensicLogger.log_event():
#           payload_cleaned = clean_payload(payload)
#           ip_normalized = normalize_ip(ip_address)
#           event = { ... }
#       ---------------------------------------------------------------------
