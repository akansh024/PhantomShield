from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.core.auth import decode_identity_token
from app.main import app
from app.session.constants import COOKIE_AUTH_TOKEN, COOKIE_SESSION_ID, SESSION_EXPIRY_SECONDS
from app.session.store import session_store


@pytest.fixture(autouse=True)
def clear_session_store():
    session_store._sessions.clear()  # noqa: SLF001 - test-only cleanup
    yield
    session_store._sessions.clear()  # noqa: SLF001 - test-only cleanup


def test_creates_session_cookie_for_store_requests() -> None:
    with TestClient(app) as client:
        response = client.get("/api/store/categories")

        assert response.status_code == 200
        session_id = client.cookies.get(COOKIE_SESSION_ID)
        assert session_id
        assert session_id in session_store._sessions  # noqa: SLF001 - test-only assertion


def test_reuses_existing_session_on_next_request() -> None:
    with TestClient(app) as client:
        first = client.get("/api/store/categories")
        first_id = client.cookies.get(COOKIE_SESSION_ID)

        second = client.get("/api/store/categories")
        second_id = client.cookies.get(COOKIE_SESSION_ID)

        assert first.status_code == 200
        assert second.status_code == 200
        assert first_id
        assert second_id == first_id
        assert "session_id=" not in second.headers.get("set-cookie", "")


def test_replaces_expired_session_with_new_cookie() -> None:
    with TestClient(app) as client:
        initial = client.get("/api/store/categories")
        first_session_id = client.cookies.get(COOKIE_SESSION_ID)

        assert initial.status_code == 200
        assert first_session_id

        state = session_store._sessions[first_session_id]  # noqa: SLF001 - test-only mutation
        state.last_activity = datetime.utcnow() - timedelta(seconds=SESSION_EXPIRY_SECONDS + 5)

        refreshed = client.get("/api/store/categories")
        second_session_id = client.cookies.get(COOKIE_SESSION_ID)

        assert refreshed.status_code == 200
        assert second_session_id
        assert second_session_id != first_session_id
        assert first_session_id not in session_store._sessions  # noqa: SLF001 - test-only assertion
        assert second_session_id in session_store._sessions  # noqa: SLF001 - test-only assertion


def test_login_rotates_session_and_jwt_uses_new_session_id() -> None:
    suspicious_headers = {
        "User-Agent": "curl/8.5.0",
        "Accept": "*/*",
    }

    with TestClient(app) as client:
        warmup = client.get("/api/auth/me", headers=suspicious_headers)
        before_login_session_id = client.cookies.get(COOKIE_SESSION_ID)

        assert warmup.status_code == 200
        assert before_login_session_id

        login = client.post(
            "/api/auth/login",
            headers=suspicious_headers,
            json={"email": "attacker@example.com", "password": "anything"},
        )

        after_login_session_id = client.cookies.get(COOKIE_SESSION_ID)
        token = client.cookies.get(COOKIE_AUTH_TOKEN)
        claims = decode_identity_token(token) if token else None

        assert login.status_code == 200
        assert after_login_session_id
        assert after_login_session_id != before_login_session_id
        assert token
        assert claims is not None
        assert claims["sid"] == after_login_session_id
