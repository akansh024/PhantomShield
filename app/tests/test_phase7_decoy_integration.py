from fastapi.testclient import TestClient

from app.core.auth import decode_identity_token
from app.main import app
from app.session.constants import COOKIE_AUTH_TOKEN, COOKIE_SESSION_ID
from app.session.store import session_store


def _shape(value):
    if isinstance(value, dict):
        shaped = {}
        for key, inner in value.items():
            if isinstance(inner, dict):
                shaped[key] = "dict"
            else:
                shaped[key] = _shape(inner)
        return shaped
    if isinstance(value, list):
        return [_shape(value[0])] if value else []
    return type(value).__name__


def test_public_decoy_routes_are_not_mounted() -> None:
    with TestClient(app) as client:
        response = client.get("/decoy/health")
        assert response.status_code == 404


def test_suspicious_session_is_silently_routed_to_decoy() -> None:
    session_store._sessions.clear()  # noqa: SLF001 - test-only cleanup

    with TestClient(app) as client:
        response = client.get("/api/store/products?q=' OR '1'='1&page=999&limit=1")
        assert response.status_code == 200

        session_id = client.cookies.get(COOKIE_SESSION_ID)
        assert session_id

        session = session_store._sessions[session_id]  # noqa: SLF001 - test-only assertion
        assert session.routing_state == "DECOY"

        first_body = response.json()
        assert "items" in first_body
        assert isinstance(first_body["items"], list)

        follow_up = client.get("/api/store/products?limit=1")
        assert follow_up.status_code == 200
        assert follow_up.json()["items"][0]["id"].startswith("prod_d")


def test_real_and_decoy_share_identical_api_schema() -> None:
    session_store._sessions.clear()  # noqa: SLF001 - test-only cleanup

    real_headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
    }
    with TestClient(app) as real_client:
        real_res = real_client.get("/api/store/products?limit=2", headers=real_headers)
        assert real_res.status_code == 200
        real_body = real_res.json()
        assert real_body["items"][0]["id"].startswith("prod_r")

    suspicious_headers = {"User-Agent": "curl/8.5.0", "Accept": "*/*"}
    with TestClient(app) as decoy_client:
        decoy_res = decoy_client.get("/api/store/products?limit=2", headers=suspicious_headers)
        assert decoy_res.status_code == 200
        decoy_body = decoy_res.json()
        assert decoy_body["items"][0]["id"].startswith("prod_d")

    assert _shape(real_body) == _shape(decoy_body)


def test_decoy_login_returns_success_and_identity_cookie() -> None:
    session_store._sessions.clear()  # noqa: SLF001 - test-only cleanup

    suspicious_headers = {"User-Agent": "curl/8.5.0", "Accept": "*/*"}

    with TestClient(app) as client:
        warmup = client.get("/api/auth/me", headers=suspicious_headers)
        assert warmup.status_code == 200

        login = client.post(
            "/api/auth/login",
            headers=suspicious_headers,
            json={"email": "attacker@example.com", "password": "not-real"},
        )
        assert login.status_code == 200

        body = login.json()
        assert body["status"] == "success"
        assert body["user"]["id"].startswith("fake_")

        session_id = client.cookies.get(COOKIE_SESSION_ID)
        token = client.cookies.get(COOKIE_AUTH_TOKEN)
        assert session_id
        assert token

        claims = decode_identity_token(token)
        assert claims is not None
        assert claims["sid"] == session_id

        session = session_store._sessions[session_id]  # noqa: SLF001 - test-only assertion
        assert session.routing_state == "DECOY"
