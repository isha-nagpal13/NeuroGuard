"""
NeuroGuard BCI — Phase 4
main.py

FastAPI backend with endpoints:
  GET  /health    — health check + model status
  POST /predict   — run EEG seizure prediction
  GET  /metrics   — return trained model metrics
  POST /train     — (re)train model on demand

Run with:
    uvicorn main:app --reload --port 8000
"""

import os
import json
import time
import traceback
from typing import Optional, List

import numpy as np
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── Local modules ──────────────────────────────────────────────────────────────
from predict import predict, predict_from_csv_row, _load_model
from train import train_all

METRICS_PATH = os.path.join(os.path.dirname(__file__), "model_metrics.json")
MODEL_PATH   = os.path.join(os.path.dirname(__file__), "saved_model.pkl")

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="NeuroGuard BCI — Phase 4 Backend",
    description="Real ML seizure prediction API (Random Forest / XGBoost / SVM)",
    version="4.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request / Response schemas ─────────────────────────────────────────────────

class PredictRequest(BaseModel):
    features: List[float] = Field(
        ...,
        description="178 EEG amplitude values (X1..X178 from Kaggle dataset format)",
        min_length=1,
        max_length=200,
    )
    patient_id: Optional[str] = "unknown"
    session_id: Optional[str] = None


class CSVRowRequest(BaseModel):
    """Accept a Kaggle-format row as a dict {X1: v, ..., X178: v}"""
    row: dict
    patient_id: Optional[str] = "unknown"


# ── Startup: auto-train if no model exists ─────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    if not os.path.exists(MODEL_PATH):
        print("[startup] No saved model found — training now...")
        try:
            train_all()
            print("[startup] Training complete.")
        except Exception as e:
            print(f"[startup] Training failed: {e}")
    else:
        print("[startup] Model found — ready.")


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    """Health check — returns model status and backend info."""
    model_ready = os.path.exists(MODEL_PATH)
    metrics_ready = os.path.exists(METRICS_PATH)

    model_name = "N/A"
    if model_ready:
        try:
            payload = _load_model()
            model_name = payload.get("model_name", "N/A")
        except Exception:
            model_ready = False

    return {
        "status": "healthy" if model_ready else "degraded",
        "model_ready": model_ready,
        "model_name": model_name,
        "metrics_available": metrics_ready,
        "backend": "NeuroGuard BCI Phase 4",
        "version": "4.0.0",
        "timestamp": time.time(),
    }


@app.post("/predict")
def predict_endpoint(req: PredictRequest):
    """
    Run seizure prediction on 178 EEG features.

    Input: { "features": [f1, f2, ..., f178], "patient_id": "..." }
    Output: Full prediction payload including brain state, probability, confidence,
            clinical note, band powers, confusion matrix, and emergency flag.
    """
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(
            status_code=503,
            detail="Model not trained yet. POST /train to train."
        )
    try:
        result = predict(req.features)
        result["patient_id"] = req.patient_id
        result["session_id"] = req.session_id
        result["timestamp"]  = time.time()
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {e}\n{traceback.format_exc()}")


@app.post("/predict/csv-row")
def predict_csv_row(req: CSVRowRequest):
    """
    Accept a Kaggle-format row dict {X1: val, ..., X178: val} and return prediction.
    Useful when frontend uploads a CSV and passes individual rows.
    """
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(status_code=503, detail="Model not trained yet.")
    try:
        result = predict_from_csv_row(req.row)
        result["patient_id"] = req.patient_id
        result["timestamp"]  = time.time()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/upload-csv")
async def predict_upload_csv(file: UploadFile = File(...)):
    """
    Upload a CSV file (Kaggle format with X1..X178 columns).
    Returns predictions for up to 50 rows (the backend picks random rows
    across the file for a representative sample).
    """
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(status_code=503, detail="Model not trained yet.")
    try:
        import io
        import pandas as pd

        content = await file.read()
        df = pd.read_csv(io.StringIO(content.decode("utf-8", errors="replace")))

        # Drop label column if present
        if "y" in df.columns:
            true_labels = df["y"].values.tolist()
            df = df.drop(columns=["y"])
        else:
            true_labels = []

        # Drop unnamed index column
        unnamed = [c for c in df.columns if c.lower().startswith("unnamed")]
        if unnamed:
            df = df.drop(columns=unnamed)

        feature_cols = [f"X{i}" for i in range(1, 179)]
        available = [c for c in feature_cols if c in df.columns]
        if len(available) < 10:
            raise HTTPException(
                status_code=422,
                detail=f"CSV must have X1..X178 columns. Found: {list(df.columns[:5])}"
            )

        # Sample up to 50 rows
        sample_df = df[available].sample(min(50, len(df)), random_state=42)
        results = []
        for i, (idx, row) in enumerate(sample_df.iterrows()):
            feats = [float(row.get(f"X{j}", 0.0)) for j in range(1, 179)]
            r = predict(feats)
            r["row_index"] = int(idx)
            if true_labels and idx < len(true_labels):
                r["true_label"] = int(true_labels[idx])
            results.append(r)

        # Summary stats
        probs = [r["seizureProbability"] for r in results]
        seizure_count = sum(1 for r in results if r["emergency"])

        return {
            "file": file.filename,
            "rows_analyzed": len(results),
            "seizure_events_detected": seizure_count,
            "mean_probability": round(float(np.mean(probs)), 4),
            "max_probability": round(float(np.max(probs)), 4),
            "predictions": results,
            "timestamp": time.time(),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CSV prediction error: {e}")


@app.get("/metrics")
def get_metrics():
    """
    Return all trained model comparison metrics:
    accuracy, precision, recall, F1, ROC-AUC, confusion matrix for each model.
    """
    if not os.path.exists(METRICS_PATH):
        raise HTTPException(
            status_code=404,
            detail="Metrics not found. Run /train first."
        )
    with open(METRICS_PATH) as f:
        return json.load(f)


@app.post("/train")
def trigger_training():
    """
    (Re)train all models synchronously and save the best one.
    Warning: This may take 30–120 seconds depending on dataset size.
    """
    try:
        result = train_all()
        return {"status": "success", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training error: {e}\n{traceback.format_exc()}")


@app.get("/")
def root():
    return {
        "app": "NeuroGuard BCI — Phase 4",
        "docs": "/docs",
        "endpoints": ["/health", "/predict", "/predict/csv-row",
                      "/predict/upload-csv", "/metrics", "/train"],
    }
