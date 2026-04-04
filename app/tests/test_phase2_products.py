from fastapi.testclient import TestClient

from app.main import app
from app.session.constants import COOKIE_SESSION_ID
from app.session.store import session_store


def _json_shape(value):
    if isinstance(value, dict):
        return {k: _json_shape(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_json_shape(value[0])] if value else []
    return type(value).__name__


def test_products_endpoint_works_for_real_session() -> None:
    session_store._sessions.clear()  # noqa: SLF001 - test-only cleanup

    with TestClient(app) as client:
        response = client.get("/api/store/products?page=1&limit=5")
        body = response.json()

        assert response.status_code == 200
        assert client.cookies.get(COOKIE_SESSION_ID)
        assert set(body.keys()) == {"items", "total", "page", "limit", "has_next"}
        assert isinstance(body["items"], list)
        assert isinstance(body["total"], int)
        assert body["page"] == 1
        assert body["limit"] == 5


def test_products_endpoint_schema_matches_between_real_and_decoy() -> None:
    session_store._sessions.clear()  # noqa: SLF001 - test-only cleanup

    with TestClient(app) as real_client:
        real_response = real_client.get("/api/store/products?page=1&limit=2")
        real_body = real_response.json()

    suspicious_headers = {
        "User-Agent": "curl/8.5.0",
        "Accept": "*/*",
    }
    with TestClient(app) as decoy_client:
        decoy_response = decoy_client.get(
            "/api/store/products?page=1&limit=2",
            headers=suspicious_headers,
        )
        decoy_body = decoy_response.json()

    assert real_response.status_code == 200
    assert decoy_response.status_code == 200
    assert _json_shape(real_body) == _json_shape(decoy_body)


def test_featured_products_endpoint_exists() -> None:
    session_store._sessions.clear()  # noqa: SLF001 - test-only cleanup

    with TestClient(app) as client:
        response = client.get("/api/store/products/featured?limit=4")
        body = response.json()

        assert response.status_code == 200
        assert isinstance(body, list)
        assert len(body) <= 4
        if body:
            assert "id" in body[0]
            assert "name" in body[0]


def test_product_details_and_categories_endpoints() -> None:
    session_store._sessions.clear()  # noqa: SLF001 - test-only cleanup

    with TestClient(app) as client:
        products = client.get("/api/store/products?page=1&limit=1")
        assert products.status_code == 200
        first_product = products.json()["items"][0]

        detail = client.get(f"/api/store/products/{first_product['id']}")
        categories = client.get("/api/store/categories")

        assert detail.status_code == 200
        assert detail.json()["id"] == first_product["id"]
        assert categories.status_code == 200
        assert isinstance(categories.json(), list)


def test_product_not_found_returns_404() -> None:
    session_store._sessions.clear()  # noqa: SLF001 - test-only cleanup

    with TestClient(app) as client:
        response = client.get("/api/store/products/prod_does_not_exist")
        assert response.status_code == 404
