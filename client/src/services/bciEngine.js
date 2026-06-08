/**
 * NeuroGuard BCI Engine
 * Handles continuous EEG streaming, ML prediction polling, and event emission
 */

const EEG_CHANNELS = ['Fp1','Fp2','F3','F4','C3','C4','P3','P4','O1','O2','F7','F8','T3','T4','T5','T6'];
const SAMPLE_RATE = 256; // Hz
const WINDOW_SIZE = 178; // matches Kaggle dataset
const PREDICTION_INTERVAL_MS = 3000;

// Brain state definitions matching your existing system
export const BRAIN_STATES = {
  NORMAL:   { label: 'Normal',         color: '#10b981', risk: 'low',    threshold: 0.25 },
  ELEVATED: { label: 'Elevated Risk',  color: '#f59e0b', risk: 'medium', threshold: 0.55 },
  HIGH:     { label: 'High Risk',      color: '#f97316', risk: 'high',   threshold: 0.75 },
  SEIZURE:  { label: 'Seizure Alert',  color: '#ef4444', risk: 'critical',threshold: 1.00 },
};

export function getBrainState(probability) {
  if (probability >= 0.75) return { ...BRAIN_STATES.SEIZURE,  probability };
  if (probability >= 0.55) return { ...BRAIN_STATES.HIGH,     probability };
  if (probability >= 0.25) return { ...BRAIN_STATES.ELEVATED, probability };
  return { ...BRAIN_STATES.NORMAL, probability };
}

// Simulate realistic EEG signal with occasional spike patterns
function generateEEGSample(t, isElevated = false, isIctal = false) {
  const channels = {};
  EEG_CHANNELS.forEach((ch, i) => {
    // Base alpha/beta oscillations
    const alpha = 30 * Math.sin(2 * Math.PI * 10 * t + i * 0.5);
    const beta  = 15 * Math.sin(2 * Math.PI * 25 * t + i * 0.8);
    const theta =  8 * Math.sin(2 * Math.PI *  6 * t + i * 0.3);
    const noise = (Math.random() - 0.5) * 20;

    let signal = alpha + beta + theta + noise;

    if (isElevated) {
      // Add irregular high-amplitude discharges
      const spike = Math.random() < 0.08 ? (Math.random() > 0.5 ? 180 : -180) : 0;
      signal += spike + 40 * Math.sin(2 * Math.PI * 3 * t + i);
    }

    if (isIctal) {
      // Ictal pattern: high-frequency, high-amplitude rhythmic activity
      const ictal = 200 * Math.sin(2 * Math.PI * 8 * t + i * 0.2);
      signal += ictal + (Math.random() - 0.5) * 60;
    }

    channels[ch] = parseFloat(signal.toFixed(2));
  });
  return channels;
}

// Extract features matching the Kaggle dataset columns
function extractFeatures(window) {
  // Simplified feature extraction: mean, variance, zero-crossing rate per channel
  const features = [];
  EEG_CHANNELS.forEach(ch => {
    const vals = window.map(s => s[ch] || 0);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
    const zcr = vals.slice(1).filter((v, i) => v * vals[i] < 0).length / vals.length;
    features.push(mean, Math.sqrt(variance), zcr);
  });
  return features;
}

// Call your existing FastAPI backend
async function callMLBackend(features) {
  try {
    const response = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return {
      probability: data.seizure_probability ?? data.probability ?? data.prediction ?? 0,
      model: data.model ?? 'RandomForest',
      confidence: data.confidence ?? 0.9,
      latency_ms: data.latency_ms ?? null,
    };
  } catch {
    // Fallback: simulate prediction for demo when backend unavailable
    return simulatePrediction(features);
  }
}

// Simulation fallback when backend is offline
let _simPhase = 0;
let _simScenario = 'normal'; // 'normal' | 'building' | 'ictal' | 'postictal'
let _scenarioTimer = 0;

function simulatePrediction(features) {
  _scenarioTimer++;

  // Cycle through scenarios automatically
  if (_scenarioTimer > 20 && _simScenario === 'normal')    { _simScenario = 'building';  _scenarioTimer = 0; }
  if (_scenarioTimer > 10 && _simScenario === 'building')  { _simScenario = 'ictal';     _scenarioTimer = 0; }
  if (_scenarioTimer > 5  && _simScenario === 'ictal')     { _simScenario = 'postictal'; _scenarioTimer = 0; }
  if (_scenarioTimer > 12 && _simScenario === 'postictal') { _simScenario = 'normal';    _scenarioTimer = 0; }

  const base = {
    normal:    () => 0.05 + Math.random() * 0.15,
    building:  () => 0.3  + (_scenarioTimer / 10) * 0.4 + Math.random() * 0.1,
    ictal:     () => 0.82 + Math.random() * 0.15,
    postictal: () => Math.max(0.1, 0.6 - (_scenarioTimer / 12) * 0.5 + Math.random() * 0.1),
  }[_simScenario]();

  return {
    probability: Math.min(1, Math.max(0, base)),
    model: 'RandomForest (simulated)',
    confidence: 0.85 + Math.random() * 0.1,
    latency_ms: 8 + Math.floor(Math.random() * 20),
    simulated: true,
    scenario: _simScenario,
  };
}

// ─── BCI Session Class ─────────────────────────────────────────────────────────
export class BCISession {
  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    this.running = false;
    this.sampleBuffer = [];
    this.predictions = [];
    this.timeline = [];
    this.emergencyEvents = [];
    this.currentState = { ...BRAIN_STATES.NORMAL, probability: 0.05 };
    this.sessionStart = null;
    this.t = 0;
    this._streamInterval = null;
    this._predInterval = null;
    this._isEmergency = false;
    this._alertDismissed = false;
    this.stats = { totalPredictions: 0, alerts: 0, avgLatency: 0 };
  }

  start() {
    this.running = true;
    this.sessionStart = Date.now();
    this._alertDismissed = false;

    // EEG streaming at ~60fps (visual update)
    this._streamInterval = setInterval(() => {
      const isElevated = this.currentState.risk === 'medium' || this.currentState.risk === 'high';
      const isIctal    = this.currentState.risk === 'critical';
      const sample = generateEEGSample(this.t, isElevated, isIctal);
      this.t += 1 / SAMPLE_RATE;

      this.sampleBuffer.push(sample);
      if (this.sampleBuffer.length > WINDOW_SIZE * 2) {
        this.sampleBuffer.shift();
      }

      this.onUpdate({ type: 'eeg', sample, t: this.t });
    }, 16); // ~60fps

    // ML prediction every 3 seconds
    this._predInterval = setInterval(() => this._runPrediction(), PREDICTION_INTERVAL_MS);
    // Run first prediction immediately
    setTimeout(() => this._runPrediction(), 500);
  }

  stop() {
    this.running = false;
    clearInterval(this._streamInterval);
    clearInterval(this._predInterval);
  }

  dismissAlert() {
    this._alertDismissed = true;
    this._isEmergency = false;
    this.onUpdate({ type: 'alert_dismissed' });
  }

  async _runPrediction() {
    if (!this.running) return;
    if (this.sampleBuffer.length < WINDOW_SIZE) return;

    const window = this.sampleBuffer.slice(-WINDOW_SIZE);
    const features = extractFeatures(window);
    const result = await callMLBackend(features);

    const newState = getBrainState(result.probability);
    const prevRisk = this.currentState.risk;
    this.currentState = newState;

    // Track stats
    this.stats.totalPredictions++;
    if (result.latency_ms) {
      this.stats.avgLatency = Math.round(
        (this.stats.avgLatency * (this.stats.totalPredictions - 1) + result.latency_ms) /
        this.stats.totalPredictions
      );
    }

    const pred = {
      id: Date.now(),
      timestamp: new Date(),
      probability: result.probability,
      state: newState,
      model: result.model,
      confidence: result.confidence,
      latency_ms: result.latency_ms,
      simulated: result.simulated ?? false,
    };

    this.predictions.unshift(pred);
    if (this.predictions.length > 50) this.predictions.pop();

    // Timeline entry on state change or every minute
    const lastTimeline = this.timeline[this.timeline.length - 1];
    if (!lastTimeline || lastTimeline.risk !== newState.risk) {
      this.timeline.push({
        id: Date.now(),
        timestamp: new Date(),
        sessionMs: Date.now() - this.sessionStart,
        risk: newState.risk,
        label: newState.label,
        color: newState.color,
        probability: result.probability,
      });
      if (this.timeline.length > 200) this.timeline.shift();
    }

    // Emergency detection
    const isEmergency = result.probability >= 0.75;
    if (isEmergency && !this._isEmergency) {
      this._isEmergency = true;
      this._alertDismissed = false;
      this.stats.alerts++;

      const event = {
        id: Date.now(),
        timestamp: new Date(),
        sessionMs: Date.now() - this.sessionStart,
        probability: result.probability,
        model: result.model,
        acknowledged: false,
      };
      this.emergencyEvents.unshift(event);
      if (this.emergencyEvents.length > 100) this.emergencyEvents.pop();

      this.onUpdate({
        type: 'emergency',
        prediction: pred,
        event,
        state: newState,
      });
    } else if (!isEmergency && this._isEmergency) {
      this._isEmergency = false;
    }

    this.onUpdate({
      type: 'prediction',
      prediction: pred,
      state: newState,
      predictions: this.predictions,
      timeline: this.timeline,
      emergencyEvents: this.emergencyEvents,
      stats: this.stats,
      isEmergency: this._isEmergency,
      alertDismissed: this._alertDismissed,
    });
  }
}
