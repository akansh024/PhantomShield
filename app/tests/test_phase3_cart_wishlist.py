from fastapi.testclient import TestClient

from app.main import app
from app.session.constants import COOKIE_SESSION_ID
from app.stores import (
    decoy_cart_store,
    decoy_wishlist_store,
    real_cart_store,
    real_wishlist_store,
)


def _reset_stores() -> None:
    for store in (real_cart_store, decoy_cart_store, real_wishlist_store, decoy_wishlist_store):
        coll = store._get_coll()
        if coll is not None:
            coll.delete_many({})


def test_guest_can_use_cart_and_wishlist_without_login() -> None:
    _reset_stores()

    with TestClient(app) as client:
        products = client.get("/api/store/products?page=1&limit=1")
        assert products.status_code == 200
        product_id = products.json()["items"][0]["id"]

        add_cart = client.post("/api/store/cart/add", json={"product_id": product_id, "quantity": 2})
        assert add_cart.status_code == 200
        assert add_cart.json()["item_count"] >= 2

        add_wishlist = client.post("/api/store/wishlist/add", json={"product_id": product_id})
        assert add_wishlist.status_code == 200
        assert add_wishlist.json()["item_count"] >= 1

        assert client.cookies.get(COOKIE_SESSION_ID)


def test_update_and_remove_cart_item() -> None:
    _reset_stores()

    with TestClient(app) as client:
        product_id = client.get("/api/store/products?page=1&limit=1").json()["items"][0]["id"]
        assert client.post("/api/store/cart/add", json={"product_id": product_id, "quantity": 1}).status_code == 200

        updated = client.patch(f"/api/store/cart/item/{product_id}", json={"quantity": 4})
        assert updated.status_code == 200
        assert updated.json()["items"][0]["quantity"] == 4

        removed = client.delete(f"/api/store/cart/item/{product_id}")
        assert removed.status_code == 200
        assert removed.json()["item_count"] == 0


def test_cart_and_wishlist_survive_login_session_rotation_in_decoy_mode() -> None:
    _reset_stores()
    suspicious_headers = {
        "User-Agent": "curl/8.5.0",
        "Accept": "*/*",
    }

    with TestClient(app) as client:
        products = client.get("/api/store/products?page=1&limit=1", headers=suspicious_headers)
        assert products.status_code == 200
        product_id = products.json()["items"][0]["id"]

        add_cart = client.post(
            "/api/store/cart/add",
            headers=suspicious_headers,
            json={"product_id": product_id, "quantity": 3},
        )
        add_wishlist = client.post(
            "/api/store/wishlist/add",
            headers=suspicious_headers,
            json={"product_id": product_id},
        )
        assert add_cart.status_code == 200
        assert add_wishlist.status_code == 200

        old_session_id = client.cookies.get(COOKIE_SESSION_ID)
        assert old_session_id

        login = client.post(
            "/api/auth/login",
            headers=suspicious_headers,
            json={"email": "attacker@example.com", "password": "anything"},
        )
        assert login.status_code == 200

        new_session_id = client.cookies.get(COOKIE_SESSION_ID)
        assert new_session_id
        assert new_session_id != old_session_id

        cart_after = client.get("/api/store/cart", headers=suspicious_headers)
        wishlist_after = client.get("/api/store/wishlist", headers=suspicious_headers)

        assert cart_after.status_code == 200
        assert wishlist_after.status_code == 200
        assert cart_after.json()["item_count"] >= 3
        assert any(item["product_id"] == product_id for item in cart_after.json()["items"])
        assert any(item["product_id"] == product_id for item in wishlist_after.json()["items"])
