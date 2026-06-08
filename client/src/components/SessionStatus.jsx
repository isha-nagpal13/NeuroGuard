import { useEffect, useState } from "react";

function formatElapsed(ms) {
  if (!ms || ms < 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
}

export default function SessionStatus({ sessionStart, stats, isRunning, backendOnline }) {
  const [elapsed, setElapsed] = useState(0);
  const [tick, setTick] = useState(true);

  useEffect(() => {
    if (!isRunning || !sessionStart) return;
    const iv = setInterval(() => {
      setElapsed(Date.now() - sessionStart);
      setTick(t => !t);
    }, 500);
    return () => clearInterval(iv);
  }, [isRunning, sessionStart]);

  const items = [
    {
      label: 'Session',
      value: isRunning ? 'LIVE' : 'STOPPED',
      color: isRunning ? '#10b981' : 'rgba(255,255,255,0.3)',
      dot: true,
      blinking: isRunning,
    },
    {
      label: 'Elapsed',
      value: formatElapsed(elapsed),
      color: 'rgba(255,255,255,0.7)',
      mono: true,
    },
    {
      label: 'Predictions',
      value: stats?.totalPredictions ?? 0,
      color: 'rgba(255,255,255,0.7)',
      mono: true,
    },
    {
      label: 'Alerts',
      value: stats?.alerts ?? 0,
      color: (stats?.alerts ?? 0) > 0 ? '#ef4444' : 'rgba(255,255,255,0.4)',
      mono: true,
    },
    {
      label: 'Avg Latency',
      value: stats?.avgLatency ? `${stats.avgLatency}ms` : '--',
      color: 'rgba(255,255,255,0.5)',
      mono: true,
    },
    {
      label: 'Backend',
      value: backendOnline ? 'ONLINE' : 'SIMULATED',
      color: backendOnline ? '#10b981' : '#f59e0b',
      dot: true,
    },
  ];

  return (
    <div style={{
      display: 'flex', gap: 0, flexWrap: 'wrap',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8, overflow: 'hidden',
    }}>
      {items.map(({ label, value, color, mono, dot, blinking }, i) => (
        <div
          key={label}
          style={{
            flex: '1 1 auto', padding: '10px 16px',
            borderRight: i < items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            minWidth: 90,
          }}
        >
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', marginBottom: 4, letterSpacing: 1 }}>
            {label}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {dot && (
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: color,
                opacity: blinking ? (tick ? 1 : 0.3) : 1,
                transition: 'opacity 0.3s',
              }} />
            )}
            <span style={{
              color, fontFamily: mono ? 'monospace' : 'inherit',
              fontSize: mono ? 13 : 12, fontWeight: 600,
              letterSpacing: mono ? 0.5 : 1,
            }}>
              {String(value)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
