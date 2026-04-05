"""
Full end-to-end verification of PhantomShield Dashboard pipeline.
Simulates real storefront activity then queries every dashboard API.
"""
from fastapi.testclient import TestClient
from app.main import app
import json

def verify_dashboard():
    with TestClient(app) as client:
        print("=" * 60)
        print("PHASE 1: STOREFRONT ACTIVITY SIMULATION")
        print("=" * 60)

        # 1. Browse products to get valid product IDs
        products_res = client.get("/api/store/products")
        products = products_res.json().get("items", [])
        print(f"[OK] Products fetched: {len(products)} items")

        if len(products) < 2:
            print("[FAIL] Not enough products to test with!")
            return

        pid1 = products[0]["id"]
        pid2 = products[1]["id"]
        print(f"     Using product IDs: {pid1}, {pid2}")

        # 2. Add to cart via correct endpoint: POST /api/store/cart/add
        cart_res = client.post("/api/store/cart/add", json={"product_id": pid1, "quantity": 3})
        print(f"[{'OK' if cart_res.status_code == 200 else 'FAIL'}] Cart add: {cart_res.status_code}")
        if cart_res.status_code == 200:
            cart_data = cart_res.json()
            print(f"     Cart items count: {len(cart_data.get('items', []))}")

        # 3. Add to wishlist via correct endpoint: POST /api/store/wishlist/add
        wish_res = client.post("/api/store/wishlist/add", json={"product_id": pid2})
        print(f"[{'OK' if wish_res.status_code == 200 else 'FAIL'}] Wishlist add: {wish_res.status_code}")
        if wish_res.status_code == 200:
            wish_data = wish_res.json()
            print(f"     Wishlist items count: {len(wish_data.get('items', []))}")

        # 4. Simulate suspicious activity (404 probes)
        for path in ["/api/admin/secrets", "/api/admin/internal/debug", "/hidden-panel"]:
            r = client.get(path)
            print(f"[PROBE] {path} -> {r.status_code}")

        print()
        print("=" * 60)
        print("PHASE 2: DASHBOARD API VERIFICATION")
        print("=" * 60)

        # Authenticate as admin
        login = client.post("/api/admin/login", json={
            "operator_id": "phantom_07",
            "passcode": "admin123"
        })
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"[OK] Admin authenticated")

        # Test each dashboard endpoint
        endpoints = [
            ("GET", "/api/dashboard/overview", None),
            ("GET", "/api/dashboard/session-trends", None),
            ("GET", "/api/dashboard/forensic-summary", None),
            ("GET", "/api/dashboard/attacks", None),
        ]

        results = {}
        for method, path, _ in endpoints:
            res = client.get(path, headers=headers)
            status = "OK" if res.status_code == 200 else "FAIL"
            data = res.json()
            results[path] = data
            print(f"\n[{status}] {path}")
            print(f"     {json.dumps(data, indent=2, default=str)}")

        # Test session detail
        sessions = client.get("/api/admin/sessions", headers=headers).json()
        if sessions:
            sid = sessions[0]["session_id"]
            detail_res = client.get(f"/api/dashboard/session/{sid}", headers=headers)
            if detail_res.status_code == 200:
                d = detail_res.json()
                print(f"\n[OK] Session Detail ({sid[:20]}...)")
                print(f"     Mode: {d.get('mode')}")
                print(f"     Risk: {d.get('risk_score')}")
                print(f"     Timeline events: {len(d.get('timeline', []))}")
                print(f"     Cart activity: {len(d.get('cart_activity', []))}")
                print(f"     Wishlist activity: {len(d.get('wishlist_activity', []))}")
                print(f"     Orders: {len(d.get('orders', []))}")

        print()
        print("=" * 60)
        print("PHASE 3: DATA INTEGRITY CHECKS")
        print("=" * 60)

        overview = results.get("/api/dashboard/overview", {})
        checks = [
            ("Total sessions > 0", overview.get("total_sessions", 0) > 0),
            ("Active sessions > 0", overview.get("active_sessions", 0) > 0),
            ("Cart items > 0", overview.get("total_cart_items", 0) > 0),
            ("Wishlist items > 0", overview.get("total_wishlist_items", 0) > 0),
        ]

        all_pass = True
        for label, passed in checks:
            icon = "✓" if passed else "✗"
            print(f"  {icon} {label}")
            if not passed:
                all_pass = False

        print()
        if all_pass:
            print("ALL CHECKS PASSED ✓")
        else:
            print("SOME CHECKS FAILED — see above")

if __name__ == "__main__":
    verify_dashboard()
