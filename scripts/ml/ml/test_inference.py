import joblib
import numpy as np
import os

def test_sample_risk():
    model_path = "models/phantomshield_lr.pkl"
    if not os.path.exists(model_path):
        print("Error: Train the model first!")
        return

    model = joblib.load(model_path)

    # A sample that looks like an attacker (High requests, low entropy, low variance)
    suspicious_sample = {
        "avg_requests_per_min": 150,
        "request_interval_variance": 0.02,
        "session_duration_sec": 45,
        "pages_visited_count": 2,
        "api_calls_count": 500,
        "ui_to_api_ratio": 0.1,
        "sensitive_endpoint_hits": 5,
        "api_404_rate": 0.3,
        "api_403_rate": 0.15,
        "rapid_navigation_score": 0.9,
        "repeated_endpoint_hits": 80,
        "canary_trigger_count": 2,
        "abnormal_request_burst": 40,
        "session_action_entropy": 0.5,
        "endpoint_scan_score": 0.8
    }

    arr = np.array(list(suspicious_sample.values())).reshape(1, -1)
    prob = model.predict_proba(arr)[0][1]
    delta = (prob - 0.5) * 0.6

    print(f"--- Inference Test ---")
    print(f"Attacker Probability: {prob:.4f}")
    print(f"Risk Delta: {delta:.4f}")

if __name__ == "__main__":
    test_sample_risk()
