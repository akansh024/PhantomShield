"""
app/db/mongo/models.py

MongoDB document schemas for the PhantomShield decoy system.
All collections here are DECOY-ONLY. Never referenced by real system.

Collections:
    - decoy_interactions   : every request a suspect session makes inside the decoy
    - fake_dashboard_data  : pre-seeded believable data served to attackers
    - canary_hits          : records of canary trap activations
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from bson import ObjectId


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

class PyObjectId(ObjectId):
    """Custom ObjectId type that plays nicely with Pydantic v2."""

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError(f"Invalid ObjectId: {v}")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, schema):
        schema.update(type="string")
        return schema


class MongoBaseModel(BaseModel):
    """Base model that serialises _id as a string."""

    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
    }


# ---------------------------------------------------------------------------
# DecoyInteraction
# ---------------------------------------------------------------------------

class HttpContext(BaseModel):
    """Snapshot of the HTTP request context."""
    method: str                          # GET, POST, etc.
    path: str                            # /decoy/dashboard
    query_params: Dict[str, str] = {}
    headers: Dict[str, str] = {}         # sanitised — no auth tokens
    body_snapshot: Optional[Any] = None  # raw body (truncated if large)
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class DecoyInteraction(MongoBaseModel):
    """
    One recorded interaction by a suspect session inside the decoy.

    Written by: app/forensics/logger.py
    Read by:    app/forensics/timeline.py, app/forensics/intelligence.py
    """
    session_id: str                      # links back to server-side session
    user_id: Optional[str] = None        # known at time of interaction
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    http: HttpContext
    risk_score_at_time: float = 0.0      # snapshot — what was risk when this hit?
    routing_state: str = "DECOY"         # always DECOY by design
    tags: List[str] = []                 # e.g. ["canary", "exfil_attempt"]
    notes: Optional[str] = None          # analyst annotations (added later)


class DecoyInteractionCreate(BaseModel):
    """Payload accepted by the repo insert function — no _id yet."""
    session_id: str
    user_id: Optional[str] = None
    http: HttpContext
    risk_score_at_time: float = 0.0
    tags: List[str] = []


# ---------------------------------------------------------------------------
# FakeDashboardData
# ---------------------------------------------------------------------------

class FakeUserRecord(BaseModel):
    """A believable but entirely fabricated user account."""
    user_id: str
    username: str
    email: str
    role: str                            # admin, analyst, viewer …
    last_login: datetime
    department: Optional[str] = None


class FakeTransaction(BaseModel):
    """A plausible-looking financial / audit transaction."""
    tx_id: str
    amount: float
    currency: str = "USD"
    counterparty: str
    timestamp: datetime
    status: str                          # pending, cleared, flagged


class FakeDashboardData(MongoBaseModel):
    """
    Pre-seeded believable data served to any DECOY-routed session.

    Seeded once at startup (or via admin script).
    Multiple documents can exist; routes pick one at random or by label.

    Label examples: "finance_corp", "healthcare_org", "generic"
    """
    label: str = "generic"
    version: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Core dashboard metrics shown to attacker
    org_name: str
    total_users: int
    active_sessions: int
    recent_alerts: int
    system_health: str                   # "nominal", "degraded" …

    # Collections of fake records — believable but useless to attacker
    users: List[FakeUserRecord] = []
    recent_transactions: List[FakeTransaction] = []

    # Raw KV bag — extend for domain-specific fake fields
    extra_metrics: Dict[str, Any] = {}


# ---------------------------------------------------------------------------
# CanaryHit
# ---------------------------------------------------------------------------

class CanaryHit(MongoBaseModel):
    """
    Recorded when a suspect session touches a canary trap endpoint.

    Written by: app/canary/detector.py
    Read by:    app/forensics/intelligence.py, app/risk/scorer.py
    """
    session_id: str
    user_id: Optional[str] = None
    canary_id: str                       # e.g. "CANARY_ADMIN_EXPORT"
    canary_endpoint: str                 # exact path that was hit
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    http: HttpContext
    risk_delta: float = 0.0              # how much this hit raised the score
    already_in_decoy: bool = True        # sanity flag — should always be True