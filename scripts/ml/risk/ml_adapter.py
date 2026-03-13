import joblib
import numpy as np
import os

class MLAdapter:
    def __init__(self, model_path="models/phantomshield_lr.pkl"):
        # Ensure the model exists before loading
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found at {model_path}. Please run training first.")
        self.model = joblib.load(model_path)

    def compute_risk(self, features):
        """
        Takes a dict of features and returns a risk delta.
        Expected features: 15 numeric behavioral metrics.
        """
        # Convert dict values to a 2D array for the model
        arr = np.array(list(features.values())).reshape(1, -1)
        
        # Get probability of class 1 (Attacker)
        prob = self.model.predict_proba(arr)[0][1]

        # Calculate delta: how much this session shifts the baseline risk
        # range: -0.3 (very safe) to +0.3 (very suspicious)
        delta = (prob - 0.5) * 0.6

        return {
            "risk_delta": float(delta),
            "model_version": "ps_ml_v1_realistic"
        }
