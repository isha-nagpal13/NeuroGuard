"""
NeuroGuard BCI — Phase 4
train.py

Trains Random Forest, XGBoost, and SVM on the Epileptic Seizure Recognition Dataset.
Compares Accuracy, Precision, Recall, F1, and ROC-AUC.
Saves the best performing model as saved_model.pkl.
"""

import os
import json
import time
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix
)
from xgboost import XGBClassifier

from preprocess import load_and_preprocess, generate_synthetic_data, DATA_PATH

MODEL_PATH = os.path.join(os.path.dirname(__file__), "saved_model.pkl")
METRICS_PATH = os.path.join(os.path.dirname(__file__), "model_metrics.json")


def evaluate_model(name: str, model, X_test: np.ndarray, y_test: np.ndarray) -> dict:
    """Compute all metrics for a trained model."""
    y_pred = model.predict(X_test)
    y_proba = (
        model.predict_proba(X_test)[:, 1]
        if hasattr(model, "predict_proba")
        else model.decision_function(X_test)
    )

    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()

    metrics = {
        "name": name,
        "accuracy":  round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred)), 4),
        "recall":    round(float(recall_score(y_test, y_pred)), 4),
        "f1":        round(float(f1_score(y_test, y_pred)), 4),
        "roc_auc":   round(float(roc_auc_score(y_test, y_proba)), 4),
        "confusion_matrix": {
            "tn": int(tn), "fp": int(fp),
            "fn": int(fn), "tp": int(tp)
        },
    }
    return metrics


def train_all():
    """Train RF, XGBoost, SVM; compare; save best model."""

    # ── Load data ──────────────────────────────────────────────────
    if os.path.exists(DATA_PATH):
        print("[train] Using real Kaggle dataset.")
        X_train, X_test, y_train, y_test, feature_cols, scaler = load_and_preprocess()
    else:
        print("[train] Real dataset not found — using synthetic data.")
        X_train, X_test, y_train, y_test, feature_cols, scaler = generate_synthetic_data()

    n_features = X_train.shape[1]
    print(f"[train] Training on {X_train.shape[0]} samples, {n_features} features.")
    print(f"[train] Test set: {X_test.shape[0]} samples.\n")

    # ── Define models ──────────────────────────────────────────────
    models = {
        "RandomForest": RandomForestClassifier(
            n_estimators=200,
            max_depth=20,
            min_samples_leaf=2,
            n_jobs=-1,
            random_state=42,
            class_weight="balanced",
        ),
        "XGBoost": XGBClassifier(
            n_estimators=200,
            max_depth=8,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            use_label_encoder=False,
            eval_metric="logloss",
            random_state=42,
            n_jobs=-1,
        ),
        "SVM": SVC(
            kernel="rbf",
            C=10,
            gamma="scale",
            probability=True,
            class_weight="balanced",
            random_state=42,
        ),
    }

    all_metrics = {}
    trained_models = {}

    # ── Train & evaluate ───────────────────────────────────────────
    for name, model in models.items():
        print(f"[train] ── Training {name} ──")
        t0 = time.time()
        model.fit(X_train, y_train)
        elapsed = time.time() - t0
        print(f"[train] {name} trained in {elapsed:.1f}s")

        m = evaluate_model(name, model, X_test, y_test)
        m["train_time_s"] = round(elapsed, 2)
        all_metrics[name] = m
        trained_models[name] = model

        print(f"  Accuracy : {m['accuracy']:.4f}")
        print(f"  Precision: {m['precision']:.4f}")
        print(f"  Recall   : {m['recall']:.4f}")
        print(f"  F1       : {m['f1']:.4f}")
        print(f"  ROC-AUC  : {m['roc_auc']:.4f}\n")

    # ── Select best model by F1 ────────────────────────────────────
    best_name = max(all_metrics, key=lambda n: all_metrics[n]["f1"])
    best_model = trained_models[best_name]
    best_metrics = all_metrics[best_name]

    print(f"[train] ✅ Best model: {best_name} (F1={best_metrics['f1']:.4f})")

    # ── Save best model ────────────────────────────────────────────
    save_payload = {
        "model": best_model,
        "model_name": best_name,
        "feature_cols": feature_cols,
        "n_features": n_features,
        "scaler_path": os.path.join(os.path.dirname(__file__), "saved_scaler.pkl"),
    }
    joblib.dump(save_payload, MODEL_PATH)
    print(f"[train] Model saved to: {MODEL_PATH}")

    # ── Save all metrics JSON ──────────────────────────────────────
    metrics_output = {
        "best_model": best_name,
        "models": all_metrics,
        "dataset": {
            "train_samples": int(X_train.shape[0]),
            "test_samples": int(X_test.shape[0]),
            "n_features": n_features,
            "seizure_ratio_train": round(float(y_train.mean()), 4),
            "seizure_ratio_test": round(float(y_test.mean()), 4),
        }
    }
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics_output, f, indent=2)
    print(f"[train] Metrics saved to: {METRICS_PATH}")

    return metrics_output


if __name__ == "__main__":
    train_all()
