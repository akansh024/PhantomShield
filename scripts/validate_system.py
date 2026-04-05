import urllib.request
import urllib.error
import time
import json
import random
import concurrent.futures

BASE_URL = "http://localhost:8000"

def hit_route(path, method="GET", data=None, headers=None):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, method=method, headers=headers or {})
    if data:
        req.data = json.dumps(data).encode("utf-8")
        req.add_header("Content-Type", "application/json")
    
    try:
        with urllib.request.urlopen(req) as response:
            return response.getcode(), response.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")
    except Exception as e:
        return 0, str(e)

def scenario_1_api_enumeration():
    print("\n--- Scenario 1: API Enumeration ---")
    routes = [
        "/api/admin",
        "/api/internal/debug",
        "/api/secrets",
        "/api/config/auth",
        "/api/users/export"
    ]
    for route in routes:
        code, resp = hit_route(route)
        print(f"HIT {route} | Status: {code}")

def scenario_2_robots_discovery():
    print("\n--- Scenario 2: Robots.txt Discovery ---")
    code, resp = hit_route("/robots.txt")
    print(f"FETCH /robots.txt | Status: {code}")
    if code == 200:
        lines = resp.split("\n")
        disallowed = [l.split(": ")[1].strip() for l in lines if l.startswith("Disallow: ")]
        print(f"Found {len(disallowed)} disallowed routes.")
        for route in disallowed:
            c, r = hit_route(route)
            print(f"PROBE {route} | Status: {c}")

def scenario_3_sensitive_probe():
    print("\n--- Scenario 3: Sensitive Probe ---")
    routes = ["/api/admin", "/api/secrets", "/api/payment-history"]
    for _ in range(5):
        route = random.choice(routes)
        code, resp = hit_route(route)
        print(f"REPEATED PROBE {route} | Status: {code}")

def scenario_4_burst_attack():
    print("\n--- Scenario 4: Burst Attack ---")
    def task():
        return hit_route("/api/store/products")

    with concurrent.futures.ThreadPoolExecutor(max_workers=30) as executor:
        futures = [executor.submit(task) for _ in range(50)]
        results = [f.result()[0] for f in concurrent.futures.as_completed(futures)]
    
    print(f"Burst attack finished. Status codes: {set(results)}")

def scenario_5_slow_attacker():
    print("\n--- Scenario 5: Slow Attacker ---")
    routes = ["/api/store/products", "/api/store/cart", "/decoy/orders", "/api/admin"]
    for route in routes:
        code, resp = hit_route(route)
        print(f"SLOW HIT {route} | Status: {code}")
        time.sleep(0.5)

def scenario_6_error_probing():
    print("\n--- Scenario 6: 403/404 Probing ---")
    routes = ["/api/abc", "/api/test123", "/admin/secret"]
    for route in routes:
        code, resp = hit_route(route)
        print(f"ERROR PROBE {route} | Status: {code}")

if __name__ == "__main__":
    print("Starting PhantomShield System Validation...")
    try:
        scenario_1_api_enumeration()
        scenario_2_robots_discovery()
        scenario_3_sensitive_probe()
        scenario_4_burst_attack()
        scenario_5_slow_attacker()
        scenario_6_error_probing()
        print("\nValidation Scenarios Completed.")
    except Exception as e:
        print(f"Validation failed: {e}")
