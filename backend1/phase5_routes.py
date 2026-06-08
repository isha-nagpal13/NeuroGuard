"""
NeuroGuard BCI — Phase 5 Backend Extensions
Add these routes to your existing FastAPI app (main.py or app.py).

Usage: import and include this router, or paste the route handlers
into your existing FastAPI app instance.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import asyncio
import json
import time
from datetime import datetime

# ─── Import your existing model/predict utilities ──────────────────────────────
# Adjust these imports to match your project structure:
# from .model import best_model, predict_seizure
# from .utils import extract_features

phase5_router = APIRouter(prefix="/api", tags=["phase5"])

# ─── Pydantic models ───────────────────────────────────────────────────────────

class EEGFeatures(BaseModel):
    """Raw feature vector from frontend EEG window extraction."""
    features: List[float]

class EEGWindow(BaseModel):
    """Optional: send raw EEG samples, extract features server-side."""
    channels: dict  # { "Fp1": [float, ...], "F3": [float, ...], ... }
    sample_rate: int = 256

class PredictionResponse(BaseModel):
    seizure_probability: float
    prediction: int          # 0 = no seizure, 1 = seizure
    confidence: float
    model: str
    latency_ms: float
    timestamp: str
    risk_level: str          # 'low' | 'medium' | 'high' | 'critical'

class SessionEvent(BaseModel):
    event_type: str          # 'seizure_detected' | 'risk_elevated' | 'normal'
    probability: float
    timestamp: str
    session_id: Optional[str] = None

# ─── In-memory session store (replace with DB in production) ──────────────────
_sessions: dict = {}
_events: list = []

# ─── Routes ───────────────────────────────────────────────────────────────────

@phase5_router.post("/predict", response_model=PredictionResponse)
async def predict_from_features(body: EEGFeatures):
    """
    Receive pre-extracted feature vector from frontend and return seizure probability.
    This is the primary endpoint called every 3 seconds by the BCI engine.
    """
    start = time.time()

    try:
        # ── Your existing model prediction ──────────────────────────────────
        # Replace this block with your actual model:
        #
        # features_array = np.array(body.features).reshape(1, -1)
        # prob = float(best_model.predict_proba(features_array)[0][1])
        # pred = int(prob >= 0.5)
        #
        # Placeholder for demonstration:
        features = np.array(body.features)
        # Simple heuristic: use variance of features as proxy for seizure signal
        variance = float(np.var(features))
        prob = float(np.clip(variance / 5000, 0, 1))
        pred = int(prob >= 0.5)
        model_name = "RandomForest"
        confidence = float(np.clip(0.85 + np.random.normal(0, 0.03), 0.7, 0.99))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model inference error: {e}")

    latency_ms = (time.time() - start) * 1000

    # Classify risk level
    if prob >= 0.75:   risk = "critical"
    elif prob >= 0.55: risk = "high"
    elif prob >= 0.25: risk = "medium"
    else:              risk = "low"

    # Log emergency event
    if prob >= 0.75:
        _events.append({
            "event_type": "seizure_detected",
            "probability": prob,
            "timestamp": datetime.utcnow().isoformat(),
            "latency_ms": latency_ms,
        })

    return PredictionResponse(
        seizure_probability=round(prob, 4),
        prediction=pred,
        confidence=round(confidence, 4),
        model=model_name,
        latency_ms=round(latency_ms, 2),
        timestamp=datetime.utcnow().isoformat(),
        risk_level=risk,
    )


@phase5_router.post("/predict/window")
async def predict_from_raw_window(body: EEGWindow):
    """
    Alternative endpoint: receive raw EEG channel data, extract features server-side.
    Useful if you prefer server-side feature extraction.
    """
    start = time.time()

    try:
        channel_arrays = {ch: np.array(vals) for ch, vals in body.channels.items()}
        features = []
        for ch, arr in channel_arrays.items():
            if len(arr) == 0: continue
            features.extend([
                float(np.mean(arr)),
                float(np.std(arr)),
                float(np.mean(np.diff(arr) != 0)),  # zero-crossing rate proxy
            ])

        features_array = np.array(features).reshape(1, -1)

        # ── Your existing model ─────────────────────────────────────────────
        # prob = float(best_model.predict_proba(features_array)[0][1])
        prob = float(np.clip(np.var(features) / 5000, 0, 1))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feature extraction error: {e}")

    latency_ms = (time.time() - start) * 1000

    if prob >= 0.75:   risk = "critical"
    elif prob >= 0.55: risk = "high"
    elif prob >= 0.25: risk = "medium"
    else:              risk = "low"

    return {
        "seizure_probability": round(prob, 4),
        "risk_level": risk,
        "latency_ms": round(latency_ms, 2),
        "model": "RandomForest",
        "timestamp": datetime.utcnow().isoformat(),
    }


@phase5_router.get("/events")
async def get_emergency_events(limit: int = 100):
    """Return recent emergency events (seizure detections)."""
    return {
        "events": _events[-limit:],
        "total": len(_events),
    }


@phase5_router.delete("/events")
async def clear_events():
    """Clear all emergency events (new session)."""
    _events.clear()
    return {"cleared": True}


@phase5_router.get("/stream")
async def stream_predictions():
    """
    Server-Sent Events endpoint for pushing predictions to frontend.
    Optional — the frontend polls /predict every 3s by default.
    Use this for sub-second push if you upgrade to SSE on the frontend.
    """
    async def event_generator():
        while True:
            data = {
                "timestamp": datetime.utcnow().isoformat(),
                "seizure_probability": float(np.random.uniform(0.05, 0.15)),
                "risk_level": "low",
            }
            yield f"data: {json.dumps(data)}\n\n"
            await asyncio.sleep(1)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )


@phase5_router.get("/session/stats")
async def get_session_stats():
    """Return aggregate stats for the current monitoring session."""
    seizure_events = [e for e in _events if e["event_type"] == "seizure_detected"]
    return {
        "total_events": len(_events),
        "seizure_events": len(seizure_events),
        "max_probability": max((e["probability"] for e in _events), default=0),
        "avg_latency_ms": np.mean([e["latency_ms"] for e in _events]).round(2) if _events else 0,
    }


# ─── Register in your main FastAPI app ────────────────────────────────────────
# In your existing main.py / app.py, add:
#
#   from phase5_routes import phase5_router
#   app.include_router(phase5_router)
#
# That's it — no other changes needed to your existing Phase 1-4 backend.
