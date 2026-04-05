from fastapi.testclient import TestClient
from app.main import app

def test_admin_dashboard():
    with TestClient(app) as client:
        # 1. Login to get token
        print("--- Testing Admin Login ---")
        login_res = client.post("/api/admin/login", json={
            "operator_id": "phantom_07",
            "passcode": "admin123"
        })
        print(f"Login Response: {login_res.status_code}")
        
        if login_res.status_code != 200:
            print("Login failed, aborting.")
            print(login_res.text)
            return

        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get Summary Stats
        print("\n--- Testing Admin Summary ---")
        summary_res = client.get("/api/admin/summary", headers=headers)
        print(f"Summary Response: {summary_res.status_code}")
        print("Data:", summary_res.json())

        # 3. Get Top View Products
        print("\n--- Testing Admin Analytics (Cart) ---")
        cart_res = client.get("/api/admin/analytics/products?metric=cart&limit=3", headers=headers)
        print(f"Cart Products Response: {cart_res.status_code}")
        print("Data:", cart_res.json())

if __name__ == "__main__":
    test_admin_dashboard()
