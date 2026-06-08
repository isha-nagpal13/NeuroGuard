import { useState, useEffect, useRef, useCallback } from "react";
import { BCISession, BRAIN_STATES } from "../services/bciEngine";
import EEGWaveform from "./EEGWaveform";
import BrainStateTimeline from "./BrainStateTimeline";
import BCIPipeline from "./BCIPipeline";
import EmergencyPopup from "./EmergencyPopup";
import EmergencyEventLog from "./EmergencyEventLog";
import SessionStatus from "./SessionStatus";
import PredictionHistory from "./PredictionHistory";

const RISK_COLORS = {
  low:      '#10b981',
  medium:   '#f59e0b',
  high:     '#f97316',
  critical: '#ef4444',
};

// ─── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ title, badge, children, style = {} }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12, padding: '18px 20px',
      ...style,
    }}>
      {title && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14,
        }}>
          <span style={{
            fontSize: 11, fontFamily: 'monospace', letterSpacing: 2,
            color: 'rgba(255,255,255,0.4)', fontWeight: 600,
          }}>
            {title}
          </span>
          {badge}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Risk indicator badge ──────────────────────────────────────────────────────
function RiskBadge({ risk, label }) {
  const color = RISK_COLORS[risk] || '#10b981';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 20,
      background: `${color}18`,
      border: `1px solid ${color}44`,
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%', background: color,
        animation: risk === 'critical' ? 'criticalBlink 0.6s ease-in-out infinite' : 'none',
      }} />
      <span style={{ color, fontSize: 10, fontFamily: 'monospace', letterSpacing: 1.5 }}>
        {label}
      </span>
    </div>
  );
}

// ─── Real-time probability gauge ───────────────────────────────────────────────
function ProbabilityGauge({ probability, risk }) {
  const color = RISK_COLORS[risk] || '#10b981';
  const pct   = Math.round((probability ?? 0) * 100);

  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <svg width="160" height="88" viewBox="0 0 160 88" style={{ display: 'block', margin: '0 auto' }}>
        {/* Arc background */}
        <path
          d="M16 80 A64 64 0 0 1 144 80"
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round"
        />
        {/* Arc fill */}
        <path
          d="M16 80 A64 64 0 0 1 144 80"
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${201 * (probability ?? 0)} 201`}
          style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.5s ease' }}
        />
        {/* Tick marks */}
        {[0, 0.25, 0.5, 0.75, 1].map((v, i) => {
          const angle = -180 + v * 180;
          const rad   = (angle * Math.PI) / 180;
          const r1    = 74, r2 = 68;
          const cx    = 80 + Math.cos(rad) * r1;
          const cy    = 80 + Math.sin(rad) * r1;
          const cx2   = 80 + Math.cos(rad) * r2;
          const cy2   = 80 + Math.sin(rad) * r2;
          return <line key={i} x1={cx} y1={cy} x2={cx2} y2={cy2} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />;
        })}
        {/* Value text */}
        <text x="80" y="72" textAnchor="middle" fill={color} fontSize="26" fontWeight="700" fontFamily="monospace">
          {pct}
        </text>
        <text x="80" y="86" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace">
          %
        </text>
      </svg>
      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontFamily: 'monospace', marginTop: 4 }}>
        SEIZURE PROBABILITY
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function RealTimeMonitor() {
  const [isRunning, setIsRunning] = useState(false);
  const [sessionStart, setSessionStart] = useState(null);
  const [currentState, setCurrentState] = useState({ risk: 'low', label: 'Normal', color: '#10b981', probability: 0.05 });
  const [recentSamples, setRecentSamples] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [emergencyEvents, setEmergencyEvents] = useState([]);
  const [stats, setStats] = useState({ totalPredictions: 0, alerts: 0, avgLatency: 0 });
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [activeEmergencyPred, setActiveEmergencyPred] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [latestLatency, setLatestLatency] = useState(null);

  const sessionRef = useRef(null);
  const sampleWindowRef = useRef([]);

  // Check backend health once on mount
  useEffect(() => {
    fetch('/health').then(r => r.ok && setBackendOnline(true)).catch(() => {});
  }, []);

  const handleUpdate = useCallback((event) => {
    if (event.type === 'eeg') {
      sampleWindowRef.current.push(event.sample);
      if (sampleWindowRef.current.length > 120) sampleWindowRef.current = sampleWindowRef.current.slice(-120);
      // Throttle React state update to ~30fps for waveform
      if (Math.random() < 0.5) {
        setRecentSamples([...sampleWindowRef.current]);
      }
      return;
    }

    if (event.type === 'prediction') {
      setCurrentState(event.state);
      setPredictions([...event.predictions]);
      setTimeline([...event.timeline]);
      setEmergencyEvents([...event.emergencyEvents]);
      setStats({ ...event.stats });
      if (event.prediction?.latency_ms) setLatestLatency(event.prediction.latency_ms);
    }

    if (event.type === 'emergency') {
      setActiveEmergency(event.event);
      setActiveEmergencyPred(event.prediction);
    }

    if (event.type === 'alert_dismissed') {
      setActiveEmergency(null);
      setActiveEmergencyPred(null);
    }
  }, []);

  const startSession = () => {
    const session = new BCISession(handleUpdate);
    sessionRef.current = session;
    setSessionStart(Date.now());
    setIsRunning(true);
    setRecentSamples([]);
    setPredictions([]);
    setTimeline([]);
    setEmergencyEvents([]);
    setStats({ totalPredictions: 0, alerts: 0, avgLatency: 0 });
    setActiveEmergency(null);
    session.start();
  };

  const stopSession = () => {
    sessionRef.current?.stop();
    setIsRunning(false);
  };

  const handleAcknowledge = (eventId) => {
    setEmergencyEvents(prev =>
      prev.map(e => e.id === eventId ? { ...e, acknowledged: true } : e)
    );
  };

  const sessionDurationMs = sessionStart ? Date.now() - sessionStart : 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060b14',
      color: '#e2e8f0',
      fontFamily: '"Space Grotesk", "DM Sans", system-ui, sans-serif',
      padding: '24px',
    }}>
      <style>{`
        @keyframes criticalBlink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes emergencyBorder { 0%,100%{border-color:rgba(239,68,68,0.4)} 50%{border-color:rgba(239,68,68,0.9)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      {/* ── Emergency Popup ── */}
      {activeEmergency && (
        <EmergencyPopup
          event={activeEmergency}
          prediction={activeEmergencyPred}
          onDismiss={() => {
            sessionRef.current?.dismissAlert();
            setActiveEmergency(null);
            setActiveEmergencyPred(null);
          }}
        />
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>🧠</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>NeuroGuard BCI</h1>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', letterSpacing: 2 }}>
                PHASE 5 — REAL-TIME MONITORING
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <RiskBadge risk={currentState.risk} label={currentState.label?.toUpperCase() ?? 'NORMAL'} />

          {!isRunning ? (
            <button
              onClick={startSession}
              style={{
                padding: '9px 20px',
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.5)',
                borderRadius: 8, color: '#10b981',
                fontFamily: 'monospace', fontSize: 12, letterSpacing: 1.5,
                cursor: 'pointer', fontWeight: 600,
              }}
            >
              ▶ START SESSION
            </button>
          ) : (
            <button
              onClick={stopSession}
              style={{
                padding: '9px 20px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: 8, color: '#ef4444',
                fontFamily: 'monospace', fontSize: 12, letterSpacing: 1.5,
                cursor: 'pointer', fontWeight: 600,
              }}
            >
              ◼ STOP SESSION
            </button>
          )}
        </div>
      </div>

      {/* ── Session Status Bar ── */}
      <div style={{ marginBottom: 16 }}>
        <SessionStatus
          sessionStart={sessionStart}
          stats={stats}
          isRunning={isRunning}
          backendOnline={backendOnline}
        />
      </div>

      {/* ── BCI Pipeline ── */}
      <Card title="BCI PROCESSING PIPELINE" style={{ marginBottom: 16 }}>
        <BCIPipeline
          risk={currentState.risk}
          isRunning={isRunning}
          latencyMs={latestLatency}
        />
      </Card>

      {/* ── Main 2-column grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, marginBottom: 16 }}>
        {/* EEG Waveform */}
        <Card
          title="EEG STREAM — 8 CHANNELS (DISPLAY)"
          badge={
            isRunning && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'criticalBlink 1s infinite' }} />
                <span style={{ fontSize: 10, color: '#10b981', fontFamily: 'monospace' }}>LIVE 256Hz</span>
              </div>
            )
          }
        >
          <EEGWaveform samples={recentSamples} risk={currentState.risk} isRunning={isRunning} />
        </Card>

        {/* Brain State Gauge */}
        <Card title="BRAIN STATE">
          <ProbabilityGauge probability={currentState.probability} risk={currentState.risk} />
          <div style={{ marginTop: 12 }}>
            {[
              { label: 'Normal',        threshold: '< 25%',  risk: 'low' },
              { label: 'Elevated',      threshold: '25–55%', risk: 'medium' },
              { label: 'High Risk',     threshold: '55–75%', risk: 'high' },
              { label: 'Seizure Alert', threshold: '> 75%',  risk: 'critical' },
            ].map(({ label, threshold, risk }) => (
              <div key={risk} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '5px 8px', borderRadius: 6, marginBottom: 3,
                background: currentState.risk === risk ? `${RISK_COLORS[risk]}14` : 'transparent',
                border: currentState.risk === risk ? `1px solid ${RISK_COLORS[risk]}30` : '1px solid transparent',
                transition: 'all 0.3s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: RISK_COLORS[risk] }} />
                  <span style={{ fontSize: 11, color: currentState.risk === risk ? '#fff' : 'rgba(255,255,255,0.4)' }}>{label}</span>
                </div>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{threshold}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Brain State Timeline ── */}
      <Card title="BRAIN STATE TIMELINE" style={{ marginBottom: 16 }}>
        <BrainStateTimeline timeline={timeline} sessionDurationMs={sessionDurationMs} />
      </Card>

      {/* ── Bottom 2-column: Predictions + Emergency Log ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card
          title="PREDICTION HISTORY"
          badge={
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
              {predictions.length} records
            </span>
          }
        >
          <PredictionHistory predictions={predictions} />
        </Card>

        <Card
          title="EMERGENCY EVENT LOG"
          badge={
            emergencyEvents.length > 0 ? (
              <span style={{
                padding: '2px 8px', borderRadius: 4,
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', fontSize: 10, fontFamily: 'monospace',
              }}>
                {emergencyEvents.length} EVENT{emergencyEvents.length !== 1 ? 'S' : ''}
              </span>
            ) : null
          }
        >
          <EmergencyEventLog events={emergencyEvents} onAcknowledge={handleAcknowledge} />
        </Card>
      </div>

      {/* ── Footer ── */}
      <div style={{
        marginTop: 20, textAlign: 'center',
        color: 'rgba(255,255,255,0.15)', fontSize: 10, fontFamily: 'monospace', letterSpacing: 1,
      }}>
        NeuroGuard BCI Phase 5 · EEG→Feature→ML→State→Alert · {backendOnline ? 'FastAPI Backend Connected' : 'Running in Simulation Mode'}
      </div>
    </div>
  );
}
