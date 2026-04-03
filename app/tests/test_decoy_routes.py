from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _override_user() -> str:
    return "decoy-user@example.com"


def test_decoy_health_check() -> None:
    response = client.get("/decoy/health")

    assert response.status_code == 200
    assert response.json()["service"] == "decoy"


def test_decoy_dashboard() -> None:
    from app.api.decoy.routes import get_current_user

    app.dependency_overrides[get_current_user] = _override_user
    try:
        response = client.get("/decoy/dashboard")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["session_user"] == "decoy-user@example.com"
    assert len(body["alerts"]) >= 1


def test_decoy_interaction_capture() -> None:
    from app.api.decoy.routes import get_current_user

    app.dependency_overrides[get_current_user] = _override_user
    try:
        response = client.post(
            "/decoy/interaction",
            json={"action": "open_dashboard", "metadata": {"panel": "alerts"}},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 202
    assert response.json()["accepted"] is True
