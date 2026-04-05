import json

import pytest
from starlette.requests import Request

from app.forensics.sink import forensic_sink
from app.forensics.store_logger import log_store_event
from app.forensics.tracker import track_event, track_session_event
from app.session.models import SessionState


@pytest.fixture
def forensic_log_file(tmp_path):
    original = forensic_sink.get_log_file()
    test_file = tmp_path / "forensic_events.jsonl"
    forensic_sink.set_log_file(test_file)
    yield test_file
    forensic_sink.set_log_file(original)


def _read_events(path):
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def _build_request(session: SessionState) -> Request:
    scope = {
        "type": "http",
        "http_version": "1.1",
        "method": "GET",
        "scheme": "http",
        "path": "/api/store/products",
        "raw_path": b"/api/store/products",
        "query_string": b"",
        "headers": [],
        "client": ("127.0.0.1", 50432),
        "server": ("testserver", 80),
        "state": {},
    }
    request = Request(scope)
    request.state.session = session
    return request


def test_track_session_event_writes_required_schema(forensic_log_file) -> None:
    session = SessionState(
        session_id="sess_phase5_1",
        user_id="user_001",
        routing_state="DECOY",
        risk_score=0.91,
    )

    track_session_event(
        session=session,
        action="add_to_cart",
        route="/api/store/cart",
        payload={"product_id": "prod_d001", "quantity": 2},
    )

    events = _read_events(forensic_log_file)
    assert len(events) == 1
    event = events[0]
    assert event["session_id"] == "sess_phase5_1"
    assert event["user_id"] == "user_001"
    assert event["action"] == "add_to_cart"
    assert event["route"] == "/api/store/cart"
    assert event["payload"]["product_id"] == "prod_d001"
    assert event["mode"] == "DECOY"
    assert "timestamp" in event


def test_track_event_from_request_context(forensic_log_file) -> None:
    session = SessionState(
        session_id="sess_phase5_2",
        user_id=None,
        routing_state="REAL",
        risk_score=0.05,
    )
    request = _build_request(session)

    track_event(
        request=request,
        action="product_view",
        payload={"product_id": "prod_r001"},
    )

    events = _read_events(forensic_log_file)
    assert len(events) == 1
    event = events[0]
    assert event["session_id"] == "sess_phase5_2"
    assert event["action"] == "product_view"
    assert event["route"] == "/api/store/products"
    assert event["method"] == "GET"
    assert event["client_ip"] == "127.0.0.1"
    assert event["mode"] == "REAL"


def test_store_logger_uses_same_forensic_pipeline(forensic_log_file) -> None:
    session = SessionState(
        session_id="sess_phase5_3",
        user_id=None,
        routing_state="DECOY",
        risk_score=0.88,
    )

    log_store_event(
        session=session,
        action="wishlist_add",
        route="/api/store/wishlist",
        payload={"product_id": "prod_d009"},
    )

    events = _read_events(forensic_log_file)
    assert len(events) == 1
    event = events[0]
    assert event["action"] == "wishlist_add"
    assert event["route"] == "/api/store/wishlist"
    assert event["mode"] == "DECOY"
