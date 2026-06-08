import { useEffect, useRef, useState } from "react";

function formatTimestamp(ts) {
  if (!ts) return '--';
  const d = ts instanceof Date ? ts : new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function playAlertTone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beep = (freq, start, dur) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };
    beep(880, 0,   0.15);
    beep(660, 0.2, 0.15);
    beep(880, 0.4, 0.15);
    beep(440, 0.6, 0.3);
  } catch { /* audio blocked */ }
}

export default function EmergencyPopup({ event, prediction, onDismiss }) {
  const [elapsed, setElapsed] = useState(0);
  const [pulse, setPulse] = useState(true);
  const intervalRef = useRef(null);
  const tonePlayedRef = useRef(false);

  useEffect(() => {
    if (!event) return;
    tonePlayedRef.current = false;
    setElapsed(0);

    if (!tonePlayedRef.current) {
      playAlertTone();
      tonePlayedRef.current = true;
    }

    intervalRef.current = setInterval(() => {
      setElapsed(s => s + 1);
    }, 1000);

    const pulseInterval = setInterval(() => setPulse(p => !p), 600);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(pulseInterval);
    };
  }, [event?.id]);

  if (!event) return null;

  const prob = prediction?.probability ?? 0;

  return (
    /* Full-screen overlay */
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
      animation: 'fadeInOverlay 0.2s ease',
    }}>
      <style>{`
        @keyframes fadeInOverlay { from { opacity:0 } to { opacity:1 } }
        @keyframes emergencyPulse { 0%,100%{ box-shadow: 0 0 0 0 rgba(239,68,68,0.6) } 50%{ box-shadow: 0 0 0 20px rgba(239,68,68,0) } }
        @keyframes slideUp { from { transform: translateY(24px); opacity:0 } to { transform: translateY(0); opacity:1 } }
        @keyframes probBar { from { width:0 } to { width: var(--w) } }
      `}</style>

      <div style={{
        background: '#0f0a0a',
        border: `2px solid ${pulse ? '#ef4444' : '#7f1d1d'}`,
        borderRadius: 16,
        padding: '32px 40px',
        maxWidth: 520,
        width: '90vw',
        animation: 'slideUp 0.3s ease, emergencyPulse 1.2s ease-in-out infinite',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: pulse ? '#ef4444' : '#991b1b',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, transition: 'background 0.3s',
            flexShrink: 0,
          }}>⚡</div>
          <div>
            <div style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: 11, letterSpacing: 3, marginBottom: 4 }}>
              NEUROGUARD · CRITICAL ALERT
            </div>
            <div style={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
              Seizure Risk Detected
            </div>
          </div>
        </div>

        {/* Patient info strip */}
        <div style={{
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8, padding: '12px 16px',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8, marginBottom: 20,
        }}>
          {[
            { label: 'Time',        value: formatTimestamp(event.timestamp) },
            { label: 'Probability', value: `${(prob * 100).toFixed(1)}%` },
            { label: 'Duration',    value: `${elapsed}s` },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'monospace', marginBottom: 3 }}>{label}</div>
              <div style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: 16, fontWeight: 700 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Probability bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'monospace' }}>Seizure Probability</span>
            <span style={{ color: '#ef4444', fontSize: 11, fontFamily: 'monospace', fontWeight: 700 }}>{(prob * 100).toFixed(1)}%</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 4,
              background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
              width: `${prob * 100}%`,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        {/* Model info */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '8px 12px',
          marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'monospace' }}>
            MODEL: <span style={{ color: 'rgba(255,255,255,0.6)' }}>{prediction?.model ?? 'RandomForest'}</span>
          </span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'monospace' }}>
            CONFIDENCE: <span style={{ color: 'rgba(255,255,255,0.6)' }}>{((prediction?.confidence ?? 0.9) * 100).toFixed(0)}%</span>
          </span>
        </div>

        {/* Recommended actions */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'monospace', marginBottom: 10, letterSpacing: 2 }}>
            RECOMMENDED ACTIONS
          </div>
          {[
            'Ensure patient is in safe position',
            'Clear surrounding area of hazards',
            'Note seizure start time and characteristics',
            'Prepare emergency medication if prescribed',
            'Call emergency services if seizure exceeds 5 minutes',
          ].map((action, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', background: 'rgba(239,68,68,0.2)',
                border: '1px solid #ef4444', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 10, color: '#ef4444', flexShrink: 0, marginTop: 1,
              }}>{i + 1}</div>
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.4 }}>{action}</span>
            </div>
          ))}
        </div>

        {/* Acknowledge button */}
        <button
          onClick={onDismiss}
          style={{
            width: '100%', padding: '14px',
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid #ef4444',
            borderRadius: 8, color: '#ef4444',
            fontFamily: 'monospace', fontSize: 13, letterSpacing: 2,
            cursor: 'pointer', fontWeight: 700,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.target.style.background = 'rgba(239,68,68,0.3)'; }}
          onMouseLeave={e => { e.target.style.background = 'rgba(239,68,68,0.15)'; }}
        >
          ACKNOWLEDGE ALERT — CAREGIVER RESPONDING
        </button>

        <div style={{ textAlign: 'center', marginTop: 10, color: 'rgba(255,255,255,0.25)', fontSize: 11, fontFamily: 'monospace' }}>
          Event logged · Monitoring continues after dismissal
        </div>
      </div>
    </div>
  );
}
