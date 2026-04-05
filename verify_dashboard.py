from fastapi.testclient import TestClient
from app.main import app
import time

def verify_dashboard():
    with TestClient(app) as client:
        print("=== 1. Starting Telemetry Simulation ===")
        # Get session cookie
        res = client.get("/api/store/products")
        print("Products viewed:", res.status_code)
        
        # Engage cart and wishlist
        res = client.post("/api/store/cart", json={"product_id": "prod_1", "quantity": 2})
        print("Cart add:", res.status_code)
        
        res = client.post("/api/store/wishlist", json={"product_id": "prod_2"})
        print("Wishlist add:", res.status_code)
        
        # Attack
        res = client.get("/non-existent-endpoint")
        print("404 Probe:", res.status_code)
        
        res = client.get("/api/admin/secrets")
        print("Bait hit:", res.status_code)
        
        print("\n=== 2. Hitting Intelligence Dashboard ===")
        # Authenticate Admin
        login = client.post("/api/admin/login", json={"operator_id": "phantom_07", "passcode": "admin123"})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        overview = client.get("/api/dashboard/overview", headers=headers)
        print("\n[Overview]:", overview.json())
        
        trends = client.get("/api/dashboard/session-trends", headers=headers)
        print("\n[Trends]:", trends.json())
        
        attacks = client.get("/api/dashboard/attacks", headers=headers)
        print("\n[Attacks]:", attacks.json())
        
        # Load a session
        sessions = client.get("/api/admin/sessions", headers=headers).json()
        if sessions:
            s_id = sessions[0]["session_id"]
            details = client.get(f"/api/dashboard/session/{s_id}", headers=headers)
            d = details.json()
            print(f"\n[Session Details: {s_id}]")
            print(" - Timeline Items:", len(d.get("timeline", [])))
            print(" - Cart Items:", len(d.get("cart_activity", [])))
            print(" - Wishlist Items:", len(d.get("wishlist_activity", [])))

        print("\nVerification Complete.")

if __name__ == "__main__":
    verify_dashboard()
