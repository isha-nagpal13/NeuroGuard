import { useState } from "react";

function formatTime(ts) {
  const d = ts instanceof Date ? ts : new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatSessionTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `T+${String(m).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
}

export default function EmergencyEventLog({ events, onAcknowledge }) {
  const [expanded, setExpanded] = useState(null);

  if (!events || events.length === 0) {
    return (
      <div style={{
        padding: '24px', textAlign: 'center',
        color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', fontSize: 12,
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8,
        background: 'rgba(255,255,255,0.02)',
      }}>
        No emergency events recorded this session
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {events.map((event, i) => {
        const prob = event.probability;
        const isNew = !event.acknowledged && i === 0;
        const isOpen = expanded === event.id;

        return (
          <div
            key={event.id}
            style={{
              border: `1px solid ${isNew ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 8,
              background: isNew ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)',
              overflow: 'hidden',
              transition: 'border-color 0.3s',
            }}
          >
            {/* Row header */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                cursor: 'pointer',
              }}
              onClick={() => setExpanded(isOpen ? null : event.id)}
            >
              {/* Severity dot */}
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: prob >= 0.9 ? '#ef4444' : '#f97316',
                flexShrink: 0,
                boxShadow: isNew ? '0 0 8px #ef444488' : 'none',
              }} />

              {/* Time */}
              <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontSize: 11, minWidth: 72 }}>
                {formatTime(event.timestamp)}
              </span>

              {/* Session offset */}
              <span style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', fontSize: 10 }}>
                {formatSessionTime(event.sessionMs)}
              </span>

              {/* Probability */}
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    background: prob >= 0.9 ? '#ef4444' : '#f97316',
                    width: `${prob * 100}%`,
                  }} />
                </div>
                <span style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: 11, fontWeight: 700, minWidth: 40 }}>
                  {(prob * 100).toFixed(0)}%
                </span>
              </div>

              {/* Status badge */}
              <div style={{
                padding: '2px 8px', borderRadius: 4,
                background: event.acknowledged ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.15)',
                border: `1px solid ${event.acknowledged ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: event.acknowledged ? '#10b981' : '#ef4444',
                fontSize: 9, fontFamily: 'monospace', letterSpacing: 1, flexShrink: 0,
              }}>
                {event.acknowledged ? 'ACK' : 'UNACK'}
              </div>

              {/* Chevron */}
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
                ▾
              </span>
            </div>

            {/* Expanded detail */}
            {isOpen && (
              <div style={{
                padding: '0 14px 14px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                marginTop: 0,
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 12 }}>
                  {[
                    { label: 'Model',       value: event.model ?? 'RandomForest' },
                    { label: 'Probability', value: `${(prob * 100).toFixed(2)}%` },
                    { label: 'Event #',     value: `#${String(events.length - i).padStart(3, '0')}` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '8px 10px',
                    }}>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: 'monospace', marginBottom: 3 }}>{label}</div>
                      <div style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace', fontSize: 12 }}>{value}</div>
                    </div>
                  ))}
                </div>

                {!event.acknowledged && (
                  <button
                    onClick={() => onAcknowledge?.(event.id)}
                    style={{
                      marginTop: 12, padding: '8px 16px',
                      background: 'rgba(16,185,129,0.1)',
                      border: '1px solid rgba(16,185,129,0.4)',
                      borderRadius: 6, color: '#10b981',
                      fontFamily: 'monospace', fontSize: 11, letterSpacing: 1,
                      cursor: 'pointer', width: '100%',
                    }}
                  >
                    ACKNOWLEDGE THIS EVENT
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
