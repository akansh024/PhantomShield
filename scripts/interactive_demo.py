import urllib.request
import time
import json
import random

BASE_URL = "http://localhost:8000"

def hit_route(path, session_id=None):
    url = f"{BASE_URL}{path}"
    headers = {}
    if session_id:
        headers["Cookie"] = f"session_id={session_id}"
    
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            set_cookie = response.getheader("Set-Cookie")
            new_session_id = None
            if set_cookie:
                # Basic cookie parsing for demo
                if "session_id=" in set_cookie:
                    new_session_id = set_cookie.split("session_id=")[1].split(";")[0]
            return response.getcode(), new_session_id
    except Exception as e:
        return 0, None

def simulate_user(name, behaviour="real"):
    session_id = None
    print(f"Starting simulation for user: {name} ({behaviour})")
    
    routes = {
        "real": ["/api/store/products", "/api/store/categories", "/api/store/products/featured"],
        "attacker": ["/robots.txt", "/api/admin", "/api/secrets", "/api/internal/debug", "/api/config/auth"],
        "mixed": ["/api/store/products", "/robots.txt", "/api/admin", "/api/store/cart"]
    }
    
    # First hit to get a session
    code, session_id = hit_route("/api/store/products")
    
    for _ in range(10):
        path = random.choice(routes[behaviour])
        code, _ = hit_route(path, session_id)
        print(f"[{name}] {path} -> {code}")
        time.sleep(random.uniform(0.5, 2.0))

if __name__ == "__main__":
    print("🚀 Starting PhantomShield Demo Test...")
    print("Dashboard: http://localhost:5173")
    print("Backend: http://localhost:8000")
    
    # Run a few users in sequence for clean logs
    simulate_user("Legit_Customer_01", "real")
    simulate_user("Curious_Bot_07", "attacker")
    simulate_user("Stealthy_Prober_22", "mixed")
    
    print("\n✅ Demo simulation finished. Please check your dashboard!")
