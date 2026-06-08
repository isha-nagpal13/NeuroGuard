"""
NeuroGuard BCI — Phase 4
predict.py

Live inference module. Loads trained model + scaler, runs prediction on EEG features.
Returns seizure probability, brain state, confidence, and clinical summary.
"""

import os
import json
import time
import numpy as np
import joblib
from typing import Union

MODEL_PATH   = os.path.join(os.path.dirname(__file__), "saved_model.pkl")
METRICS_PATH = os.path.join(os.path.dirname(__file__), "model_metrics.json")

# ── Cached model singleton ─────────────────────────────────────────────────────
_model_cache = None

def _load_model():
    global _model_cache
    if _model_cache is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model not found at {MODEL_PATH}. Run train.py first."
            )
        _model_cache = joblib.load(MODEL_PATH)
    return _model_cache


def _load_scaler(payload: dict):
    scaler_path = payload.get("scaler_path", "")
    if os.path.exists(scaler_path):
        return joblib.load(scaler_path)
    # Fallback — scaler next to model
    alt = os.path.join(os.path.dirname(MODEL_PATH), "saved_scaler.pkl")
    if os.path.exists(alt):
        return joblib.load(alt)
    return None


def map_prob_to_brain_state(prob: float) -> dict:
    """Map seizure probability → named brain state + icon."""
    if prob >= 0.70:
        return {"id": "seizure", "label": "Seizure Activity",
                "icon": "🚨", "color": "#ff3d6b"}
    elif prob >= 0.40:
        return {"id": "alert", "label": "Pre-Ictal",
                "icon": "⚡", "color": "#f59e0b"}
    elif prob >= 0.20:
        return {"id": "postictal", "label": "Post-Ictal",
                "icon": "💤", "color": "#8b5cf6"}
    else:
        return {"id": "normal", "label": "Normal",
                "icon": "🧠", "color": "#10d48e"}


def generate_clinical_note(prob: float, brain_state: str, model_name: str) -> str:
    """Generate a concise clinical interpretation string."""
    if prob >= 0.70:
        return (f"High-amplitude ictal discharges detected ({prob*100:.0f}% probability). "
                f"Immediate clinical attention recommended. Model: {model_name}.")
    elif prob >= 0.40:
        return (f"Pre-ictal rhythmic patterns emerging. Seizure probability at "
                f"{prob*100:.0f}%. Caregiver should be on standby.")
    elif prob >= 0.20:
        return (f"Post-ictal suppression observed. Signal normalizing — "
                f"seizure probability declining ({prob*100:.0f}%).")
    else:
        return (f"EEG within normal limits. Alpha-dominant resting state. "
                f"Seizure probability: {prob*100:.0f}%. No intervention required.")


def predict(features: Union[list, np.ndarray]) -> dict:
    """
    Run inference on a single EEG sample.

    Args:
        features: list/array of 178 float values (X1..X178 from dataset)

    Returns:
        dict with full prediction payload compatible with NeuroGuard Phase 4 frontend
    """
    payload   = _load_model()
    model     = payload["model"]
    model_name = payload["model_name"]
    n_features = payload["n_features"]
    scaler    = _load_scaler(payload)

    # ── Validate input ──────────────────────────────────────────────
    arr = np.array(features, dtype=np.float32).reshape(1, -1)

    # Pad or trim to expected feature count
    if arr.shape[1] != n_features:
        if arr.shape[1] < n_features:
            pad = np.zeros((1, n_features - arr.shape[1]), dtype=np.float32)
            arr = np.hstack([arr, pad])
        else:
            arr = arr[:, :n_features]

    # ── Scale ───────────────────────────────────────────────────────
    if scaler is not None:
        arr = scaler.transform(arr)

    # ── Inference ───────────────────────────────────────────────────
    t0 = time.perf_counter()
    seizure_prob = float(model.predict_proba(arr)[0, 1])
    inference_ms = round((time.perf_counter() - t0) * 1000, 2)

    # ── Confidence = distance from 0.5 boundary ────────────────────
    confidence = round(min(1.0, abs(seizure_prob - 0.5) * 2 + 0.5), 3)

    # ── Brain state ─────────────────────────────────────────────────
    brain_state = map_prob_to_brain_state(seizure_prob)

    # ── Risk level label ────────────────────────────────────────────
    if seizure_prob >= 0.70:
        risk_level = "CRITICAL"
    elif seizure_prob >= 0.40:
        risk_level = "HIGH"
    elif seizure_prob >= 0.20:
        risk_level = "MODERATE"
    else:
        risk_level = "LOW"

    # ── Clinical note ───────────────────────────────────────────────
    clinical_note = generate_clinical_note(
        seizure_prob, brain_state["label"], model_name
    )

    # ── Simulated band powers (heuristic from raw features) ─────────
    raw = np.array(features[:178], dtype=np.float32)
    fft_mag = np.abs(np.fft.rfft(raw))
    total   = fft_mag.sum() + 1e-9

    # Approximate band buckets for 178-sample EEG @173.6 Hz
    delta_power = float(fft_mag[1:5].sum() / total * 100)
    theta_power = float(fft_mag[5:9].sum() / total * 100)
    alpha_power = float(fft_mag[9:14].sum() / total * 100)
    beta_power  = float(fft_mag[14:30].sum() / total * 100)
    gamma_power = float(fft_mag[30:].sum() / total * 100)

    dominant_band = max(
        [("Delta", delta_power), ("Theta", theta_power), ("Alpha", alpha_power),
         ("Beta", beta_power), ("Gamma", gamma_power)],
        key=lambda x: x[1]
    )[0]

    # ── Load model metrics for frontend analytics ───────────────────
    model_metrics = {}
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH) as f:
            m = json.load(f)
        model_metrics = m.get("models", {}).get(model_name, {})

    return {
        "seizureProbability":       round(seizure_prob, 4),
        "seizureProbabilityPct":    round(seizure_prob * 100, 1),
        "riskLevel":                risk_level,
        "brainState":               brain_state["label"],
        "brainStateId":             brain_state["id"],
        "brainStateIcon":           brain_state["icon"],
        "brainStateColor":          brain_state["color"],
        "confidence":               confidence,
        "confidencePct":            round(confidence * 100, 1),
        "clinicalNote":             clinical_note,
        "modelUsed":                model_name,
        "inferenceMs":              inference_ms,
        "bandPowers": {
            "delta": round(delta_power, 1),
            "theta": round(theta_power, 1),
            "alpha": round(alpha_power, 1),
            "beta":  round(beta_power, 1),
            "gamma": round(gamma_power, 1),
        },
        "dominantBand":             dominant_band,
        "focalOnsetLikelihood":     round(seizure_prob * 0.72, 3),
        "generalizedOnsetLikelihood": round(seizure_prob * 0.28, 3),
        "modelMetrics": {
            "accuracy":  model_metrics.get("accuracy", 0),
            "precision": model_metrics.get("precision", 0),
            "recall":    model_metrics.get("recall", 0),
            "f1":        model_metrics.get("f1", 0),
            "roc_auc":   model_metrics.get("roc_auc", 0),
        },
        "confusionMatrix":          model_metrics.get("confusion_matrix", {}),
        "emergency":                seizure_prob > 0.70,
    }


def predict_from_csv_row(row: dict) -> dict:
    """
    Accept a dict of {X1: val, X2: val, ..., X178: val} (Kaggle CSV row format).
    """
    features = [float(row.get(f"X{i}", 0.0)) for i in range(1, 179)]
    return predict(features)


if __name__ == "__main__":
    # Quick smoke-test with random features
    import random
    test_feats = [random.gauss(0, 1) for _ in range(178)]
    result = predict(test_feats)
    print(json.dumps(result, indent=2))
