import joblib
import numpy as np
import os
import json

def test_sample_risk():
    model_path = "models/phantomshield_lr.pkl"
    schema_path = "scripts/ml/feature_schema.json"

    if not os.path.exists(model_path):
        print("Error: Train the model first!")
        return

    if not os.path.exists(schema_path):
        print("Error: feature_schema.json not found!")
        return

    model = joblib.load(model_path)

    with open(schema_path, "r") as f:
        feature_order = json.load(f)["features"]

    # A sample that looks like an attacker
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

    ordered_features = [
        float(suspicious_sample.get(feature, 0))
        for feature in feature_order
    ]

    arr = np.array(ordered_features).reshape(1, -1)

    prob = model.predict_proba(arr)[0][1]
    delta = (prob - 0.5) * 0.6

    print("--- Inference Test ---")
    print(f"Attacker Probability: {prob:.4f}")
    print(f"Risk Delta: {delta:.4f}")

if __name__ == "__main__":
    test_sample_risk()
