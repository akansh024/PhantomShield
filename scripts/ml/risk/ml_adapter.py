import joblib
import numpy as np
import os
import json

class MLAdapter:
    def __init__(
        self,
        model_path="models/phantomshield_lr.pkl",
        schema_path="scripts/ml/feature_schema.json"
    ):
        # Ensure the model exists before loading
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Model not found at {model_path}. Please run training first."
            )

        # Ensure schema exists before loading
        if not os.path.exists(schema_path):
            raise FileNotFoundError(
                f"Feature schema not found at {schema_path}."
            )

        self.model = joblib.load(model_path)

        with open(schema_path, "r") as f:
            self.feature_order = json.load(f)["features"]

    def compute_risk(self, features):
        """
        Takes a dict of features and returns a risk delta.
        Expected features: 15 numeric behavioral metrics.
        """

        # Build feature vector in the exact schema order
        ordered_features = [
            float(features.get(feature, 0))
            for feature in self.feature_order
        ]

        # Convert to 2D array for model
        arr = np.array(ordered_features).reshape(1, -1)

        # Get probability of class 1 (Attacker)
        prob = self.model.predict_proba(arr)[0][1]

        # Calculate delta: how much this session shifts the baseline risk
        # range: -0.3 (very safe) to +0.3 (very suspicious)
        delta = (prob - 0.5) * 0.6

        return {
            "risk_delta": float(delta),
            "attacker_probability": float(prob),
            "model_version": "ps_ml_v1_realistic"
        }
