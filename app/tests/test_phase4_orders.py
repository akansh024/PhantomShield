from fastapi.testclient import TestClient

from app.main import app
from app.session.constants import COOKIE_SESSION_ID
from app.stores import (
    decoy_cart_store,
    decoy_order_store,
    decoy_wishlist_store,
    real_cart_store,
    real_order_store,
    real_wishlist_store,
)


def _reset_stores() -> None:
    real_cart_store._data.clear()  # noqa: SLF001 - test-only cleanup
    decoy_cart_store._data.clear()  # noqa: SLF001 - test-only cleanup
    real_wishlist_store._data.clear()  # noqa: SLF001 - test-only cleanup
    decoy_wishlist_store._data.clear()  # noqa: SLF001 - test-only cleanup
    real_order_store._data.clear()  # noqa: SLF001 - test-only cleanup
    decoy_order_store._data.clear()  # noqa: SLF001 - test-only cleanup


def _shipping_payload() -> dict:
    return {
        "full_name": "Rahul Sharma",
        "phone": "9876543210",
        "line1": "14 MG Road",
        "line2": "",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin": "560034",
    }


def test_real_checkout_flow_places_order_and_clears_cart() -> None:
    _reset_stores()

    with TestClient(app) as client:
        products = client.get("/api/store/products?page=1&limit=1")
        assert products.status_code == 200
        product_id = products.json()["items"][0]["id"]

        add = client.post("/api/store/cart/add", json={"product_id": product_id, "quantity": 2})
        assert add.status_code == 200
        assert add.json()["item_count"] >= 2

        checkout = client.post(
            "/api/store/orders",
            json={"shipping_address": _shipping_payload(), "delivery_note": "", "promo_code": "WELCOME10"},
        )
        assert checkout.status_code == 201
        order = checkout.json()
        assert order["order_id"].startswith("ORD-")
        assert len(order["items"]) >= 1

        cart_after = client.get("/api/store/cart")
        assert cart_after.status_code == 200
        assert cart_after.json()["item_count"] == 0

        history = client.get("/api/store/orders")
        assert history.status_code == 200
        assert history.json()["total"] >= 1
        assert history.json()["orders"][0]["order_id"] == order["order_id"]


def test_decoy_checkout_succeeds_even_when_cart_empty() -> None:
    _reset_stores()
    suspicious_headers = {"User-Agent": "curl/8.5.0", "Accept": "*/*"}

    with TestClient(app) as client:
        checkout = client.post(
            "/api/store/orders",
            headers=suspicious_headers,
            json={"shipping_address": _shipping_payload(), "delivery_note": "", "promo_code": ""},
        )
        assert checkout.status_code == 201
        order = checkout.json()
        assert order["order_id"].startswith("ORD-")
        assert len(order["items"]) >= 1

        history = client.get("/api/store/orders", headers=suspicious_headers)
        assert history.status_code == 200
        assert history.json()["total"] >= 1


def test_decoy_order_history_survives_login_session_rotation() -> None:
    _reset_stores()
    suspicious_headers = {"User-Agent": "curl/8.5.0", "Accept": "*/*"}

    with TestClient(app) as client:
        checkout = client.post(
            "/api/store/orders",
            headers=suspicious_headers,
            json={"shipping_address": _shipping_payload(), "delivery_note": "", "promo_code": "SAVE15"},
        )
        assert checkout.status_code == 201
        order_id = checkout.json()["order_id"]
        old_session_id = client.cookies.get(COOKIE_SESSION_ID)
        assert old_session_id

        login = client.post(
            "/api/auth/login",
            headers=suspicious_headers,
            json={"email": "attacker@example.com", "password": "anything"},
        )
        assert login.status_code == 200
        new_session_id = client.cookies.get(COOKIE_SESSION_ID)
        assert new_session_id and new_session_id != old_session_id

        history = client.get("/api/store/orders", headers=suspicious_headers)
        assert history.status_code == 200
        assert any(order["order_id"] == order_id for order in history.json()["orders"])


def test_order_detail_returns_404_for_unknown_order() -> None:
    _reset_stores()

    with TestClient(app) as client:
        missing = client.get("/api/store/orders/ORD-20990101-0000")
        assert missing.status_code == 404
