import { useState, useEffect } from "react";

const STAGES = [
  { id: 'eeg',      label: 'EEG Stream',      icon: '〜',  desc: '16-channel, 256 Hz' },
  { id: 'feature',  label: 'Feature Extract',  icon: '⊞',  desc: 'Mean · Var · ZCR' },
  { id: 'ml',       label: 'ML Prediction',    icon: '◈',  desc: 'Random Forest' },
  { id: 'state',    label: 'State Classify',   icon: '◉',  desc: 'Brain state map' },
  { id: 'risk',     label: 'Risk Assess',      icon: '◬',  desc: 'Threshold check' },
  { id: 'alert',    label: 'Alert System',     icon: '⚡',  desc: 'Caregiver notify' },
];

const RISK_COLORS = {
  low:      '#10b981',
  medium:   '#f59e0b',
  high:     '#f97316',
  critical: '#ef4444',
};

export default function BCIPipeline({ activeStage, risk = 'low', isRunning, latencyMs }) {
  const [lit, setLit] = useState(0); // which stage is currently "lit"

  // Pulse through stages when running
  useEffect(() => {
    if (!isRunning) return;
    const iv = setInterval(() => {
      setLit(s => (s + 1) % STAGES.length);
    }, 420);
    return () => clearInterval(iv);
  }, [isRunning]);

  const accent = RISK_COLORS[risk] || '#10b981';

  return (
    <div style={{ padding: '16px 0' }}>
      {/* Pipeline row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        overflowX: 'auto', paddingBottom: 4,
      }}>
        {STAGES.map((stage, i) => {
          const isActive = isRunning && lit === i;
          const isDone   = isRunning && lit > i;
          const isLast   = i === STAGES.length - 1;

          const stageColor = isLast
            ? (risk === 'critical' ? '#ef4444' : risk === 'high' ? '#f97316' : '#10b981')
            : (isActive ? accent : isDone ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.18)');

          return (
            <div key={stage.id} style={{ display: 'flex', alignItems: 'center' }}>
              {/* Stage box */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 4, minWidth: 84,
              }}>
                {/* Icon circle */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: isActive
                    ? `${accent}22`
                    : isDone ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${stageColor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: stageColor,
                  transition: 'all 0.3s ease',
                  boxShadow: isActive ? `0 0 16px ${accent}44` : 'none',
                  position: 'relative',
                }}>
                  {stage.icon}
                  {/* Pulse ring when active */}
                  {isActive && (
                    <div style={{
                      position: 'absolute', inset: -4, borderRadius: '50%',
                      border: `1px solid ${accent}`,
                      animation: 'pipelineRing 1s ease-out infinite',
                    }} />
                  )}
                </div>

                {/* Label */}
                <div style={{
                  textAlign: 'center',
                  color: isActive ? '#fff' : isDone ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)',
                  fontSize: 10, fontFamily: 'monospace', lineHeight: 1.3,
                  transition: 'color 0.3s',
                }}>
                  <div style={{ fontWeight: isActive ? 700 : 400, whiteSpace: 'nowrap' }}>{stage.label}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2, whiteSpace: 'nowrap' }}>{stage.desc}</div>
                </div>
              </div>

              {/* Connector arrow (not after last) */}
              {!isLast && (
                <div style={{
                  display: 'flex', alignItems: 'center',
                  width: 28, flexShrink: 0, marginTop: -20,
                }}>
                  <div style={{
                    flex: 1, height: 1.5,
                    background: isDone || isActive
                      ? `linear-gradient(90deg, ${accent}80, ${accent}20)`
                      : 'rgba(255,255,255,0.08)',
                    transition: 'background 0.3s',
                  }} />
                  <div style={{
                    width: 0, height: 0,
                    borderTop: '4px solid transparent',
                    borderBottom: '4px solid transparent',
                    borderLeft: `6px solid ${isDone || isActive ? `${accent}80` : 'rgba(255,255,255,0.08)'}`,
                    transition: 'border-color 0.3s',
                  }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Status bar */}
      <div style={{
        display: 'flex', gap: 20, marginTop: 14, flexWrap: 'wrap',
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)',
      }}>
        {[
          { label: 'Pipeline',    value: isRunning ? 'ACTIVE' : 'OFFLINE',   color: isRunning ? '#10b981' : '#ef4444' },
          { label: 'Sample Rate', value: '256 Hz',                            color: 'rgba(255,255,255,0.5)' },
          { label: 'Window',      value: '178 samples',                       color: 'rgba(255,255,255,0.5)' },
          { label: 'Latency',     value: latencyMs ? `${latencyMs}ms` : '--', color: 'rgba(255,255,255,0.5)' },
          { label: 'Channels',    value: '16 EEG',                            color: 'rgba(255,255,255,0.5)' },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 12, color, fontFamily: 'monospace', fontWeight: 600 }}>{value}</div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pipelineRing {
          from { opacity: 0.8; transform: scale(1); }
          to   { opacity: 0;   transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
}
