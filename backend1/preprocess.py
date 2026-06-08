"""
NeuroGuard BCI — Phase 4
preprocess.py

Handles loading and preprocessing of the Epileptic Seizure Recognition Dataset.
Binary label conversion: 1 = Seizure, 2/3/4/5 = Non-Seizure
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib
import os

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "Epileptic_Seizure_Recognition.csv")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "saved_scaler.pkl")


def load_and_preprocess(data_path: str = DATA_PATH):
    """
    Load the Kaggle Epileptic Seizure Recognition dataset.
    Converts multi-class labels to binary:
        1  → 1 (Seizure)
        2,3,4,5 → 0 (Non-Seizure)

    Returns:
        X_train, X_test, y_train, y_test, feature_names
    """
    print(f"[preprocess] Loading dataset from: {data_path}")
    df = pd.read_csv(data_path)

    # Drop unnamed index column if present
    if df.columns[0].lower() in ("unnamed: 0", ""):
        df = df.drop(df.columns[0], axis=1)

    # The dataset has columns X1..X178 and 'y'
    # Identify label column (case-insensitive)
    label_col = None
    for col in df.columns:
        if col.lower() == "y":
            label_col = col
            break

    if label_col is None:
        raise ValueError("Label column 'y' not found in dataset.")

    feature_cols = [c for c in df.columns if c != label_col]
    X = df[feature_cols].values.astype(np.float32)
    y_raw = df[label_col].values

    # Binary conversion
    y = (y_raw == 1).astype(np.int32)

    print(f"[preprocess] Dataset shape: {X.shape}")
    print(f"[preprocess] Seizure samples: {y.sum()} ({y.mean()*100:.1f}%)")
    print(f"[preprocess] Non-Seizure samples: {(y==0).sum()} ({(y==0).mean()*100:.1f}%)")

    # Train/test split — stratified to preserve class balance
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Feature scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Save scaler for inference
    joblib.dump(scaler, SCALER_PATH)
    print(f"[preprocess] Scaler saved to: {SCALER_PATH}")

    return X_train_scaled, X_test_scaled, y_train, y_test, feature_cols, scaler


def preprocess_raw_features(features: list, scaler_path: str = SCALER_PATH) -> np.ndarray:
    """
    Scale a single sample (178 features) for live inference.
    features: list of 178 floats matching dataset columns X1..X178
    """
    scaler = joblib.load(scaler_path)
    arr = np.array(features, dtype=np.float32).reshape(1, -1)
    return scaler.transform(arr)


def generate_synthetic_data(n_samples: int = 11500) -> tuple:
    """
    Generates synthetic EEG-like data matching the Kaggle dataset structure
    when the real CSV is not available. Used for demo/testing.
    """
    np.random.seed(42)
    n_features = 178

    # Seizure class (label=1) — ~20% of data, high amplitude/frequency signals
    n_seizure = n_samples // 5
    seizure_X = np.random.randn(n_seizure, n_features) * 3.0
    # Add spike pattern to simulate ictal activity
    seizure_X += np.sin(np.linspace(0, 20 * np.pi, n_features)) * 2.5

    # Non-seizure (labels 2-5) — ~80%, lower amplitude varied signals
    n_nonsz = n_samples - n_seizure
    nonsz_X = np.random.randn(n_nonsz, n_features) * 1.0
    nonsz_X += np.sin(np.linspace(0, 4 * np.pi, n_features)) * 0.5

    X = np.vstack([seizure_X, nonsz_X]).astype(np.float32)
    y = np.concatenate([np.ones(n_seizure), np.zeros(n_nonsz)]).astype(np.int32)

    # Shuffle
    idx = np.random.permutation(len(X))
    X, y = X[idx], y[idx]

    feature_cols = [f"X{i+1}" for i in range(n_features)]

    print(f"[preprocess] Generated {n_samples} synthetic samples "
          f"({n_seizure} seizure / {n_nonsz} non-seizure)")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)
    joblib.dump(scaler, SCALER_PATH)

    return X_train_s, X_test_s, y_train, y_test, feature_cols, scaler


if __name__ == "__main__":
    if os.path.exists(DATA_PATH):
        load_and_preprocess()
    else:
        print("[preprocess] Real dataset not found — using synthetic data.")
        generate_synthetic_data()
