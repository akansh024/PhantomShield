import pandas as pd
import joblib
import os
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

# Ensure models directory exists
if not os.path.exists("models"): os.makedirs("models")

df = pd.read_csv("data/phantomshield_sessions.csv")
X = df.drop("label", axis=1)
y = df["label"]

pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("model", LogisticRegression(max_iter=500))
])

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
pipe.fit(X_train, y_train)

joblib.dump(pipe, "models/phantomshield_lr.pkl")
print("Model trained and saved to models/phantomshield_lr.pkl")
