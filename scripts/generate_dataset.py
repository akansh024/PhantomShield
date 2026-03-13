import numpy as np
import pandas as pd
import os

np.random.seed(42)

BENIGN = 6000
ATTACK = 4000
OUT_DIR = "data"
FILE_PATH = os.path.join(OUT_DIR, "phantomshield_sessions.csv")

def get_benign():
    return {
        "avg_requests_per_min": np.random.uniform(5, 80), # Overlap with attackers 
        "request_interval_variance": np.random.uniform(0.15, 1.8),
        "session_duration_sec": int(np.random.uniform(60, 3600)), # Integer 
        "pages_visited_count": np.random.randint(2, 50),
        "api_calls_count": np.random.randint(10, 250),
        "ui_to_api_ratio": np.random.uniform(0.3, 2.5),
        "sensitive_endpoint_hits": np.random.choice([0, 1, 2], p=[0.9, 0.08, 0.02]),
        "api_404_rate": np.random.uniform(0, 0.08), # Realistic noise 
        "api_403_rate": np.random.uniform(0, 0.05),
        "rapid_navigation_score": np.random.uniform(0, 0.4),
        "repeated_endpoint_hits": np.random.randint(0, 15),
        "canary_trigger_count": np.random.choice([0, 1], p=[0.98, 0.02]), # Accidental triggers 
        "abnormal_request_burst": np.random.randint(0, 8),
        "session_action_entropy": np.random.uniform(1.2, 3.8),
        "endpoint_scan_score": np.random.uniform(0, 0.15),
        "label": 0 # Numeric 
    }

def get_attacker():
    return {
        "avg_requests_per_min": np.random.uniform(35, 400), # Overlap 
        "request_interval_variance": np.random.uniform(0, 0.3),
        "session_duration_sec": int(np.random.uniform(10, 900)),
        "pages_visited_count": np.random.randint(1, 15),
        "api_calls_count": np.random.randint(200, 2000),
        "ui_to_api_ratio": np.random.uniform(0, 0.6),
        "sensitive_endpoint_hits": np.random.randint(2, 50),
        "api_404_rate": np.random.uniform(0.05, 0.6),
        "api_403_rate": np.random.uniform(0.02, 0.5),
        "rapid_navigation_score": np.random.uniform(0.4, 1.0),
        "repeated_endpoint_hits": np.random.randint(15, 300),
        "canary_trigger_count": np.random.randint(1, 6),
        "abnormal_request_burst": np.random.randint(10, 120),
        "session_action_entropy": np.random.uniform(0.2, 1.8),
        "endpoint_scan_score": np.random.uniform(0.4, 1.0),
        "label": 1 # Numeric 
    }

if __name__ == "__main__":
    if not os.path.exists(OUT_DIR): os.makedirs(OUT_DIR)
    data = [get_benign() for _ in range(BENIGN)] + [get_attacker() for _ in range(ATTACK)]
    df = pd.DataFrame(data).sample(frac=1).reset_index(drop=True)
    df.to_csv(FILE_PATH, index=False)
    print(f"Dataset generated at {FILE_PATH}")
