const RISK_COLORS = {
  low:      '#10b981',
  medium:   '#f59e0b',
  high:     '#f97316',
  critical: '#ef4444',
};

function formatTime(ts) {
  const d = ts instanceof Date ? ts : new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function PredictionHistory({ predictions }) {
  if (!predictions || predictions.length === 0) {
    return (
      <div style={{
        padding: '24px', textAlign: 'center',
        color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', fontSize: 12,
      }}>
        Predictions will appear here once the session starts
      </div>
    );
  }

  return (
    <div style={{ overflowY: 'auto', maxHeight: 340 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'monospace' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {['Time', 'State', 'Probability', 'Confidence', 'Model', 'Latency'].map(h => (
              <th key={h} style={{
                padding: '8px 10px', textAlign: 'left',
                color: 'rgba(255,255,255,0.25)', fontWeight: 500,
                fontSize: 10, letterSpacing: 1, whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {predictions.map((pred, i) => {
            const color = RISK_COLORS[pred.state?.risk] || '#10b981';
            const isLatest = i === 0;
            return (
              <tr
                key={pred.id}
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: isLatest ? 'rgba(255,255,255,0.03)' : 'transparent',
                  transition: 'background 0.3s',
                }}
              >
                <td style={{ padding: '7px 10px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                  {formatTime(pred.timestamp)}
                </td>
                <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ color }}>{pred.state?.label ?? 'Normal'}</span>
                  </div>
                </td>
                <td style={{ padding: '7px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 60, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 2, background: color,
                        width: `${(pred.probability ?? 0) * 100}%`,
                      }} />
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {((pred.probability ?? 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td style={{ padding: '7px 10px', color: 'rgba(255,255,255,0.4)' }}>
                  {((pred.confidence ?? 0) * 100).toFixed(0)}%
                </td>
                <td style={{ padding: '7px 10px', color: 'rgba(255,255,255,0.35)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pred.model ?? 'RandomForest'}
                  {pred.simulated && <span style={{ color: 'rgba(255,255,255,0.2)', marginLeft: 4 }}>[sim]</span>}
                </td>
                <td style={{ padding: '7px 10px', color: 'rgba(255,255,255,0.3)' }}>
                  {pred.latency_ms ? `${pred.latency_ms}ms` : '--'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
