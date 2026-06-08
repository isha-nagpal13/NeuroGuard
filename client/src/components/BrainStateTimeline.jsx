import { useRef, useEffect } from "react";

const RISK_COLORS = {
  low:      '#10b981',
  medium:   '#f59e0b',
  high:     '#f97316',
  critical: '#ef4444',
};

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

export default function BrainStateTimeline({ timeline, sessionDurationMs }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !timeline || timeline.length < 1) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 800;
    const H = 56;
    canvas.width = W;
    canvas.height = H;

    ctx.fillStyle = '#0a0f1a';
    ctx.fillRect(0, 0, W, H);

    const totalMs = sessionDurationMs || 1;

    // Draw segments
    const BAR_Y = 10, BAR_H = 28;
    for (let i = 0; i < timeline.length; i++) {
      const seg = timeline[i];
      const nextMs = timeline[i + 1]?.sessionMs ?? sessionDurationMs;
      const startX = (seg.sessionMs / totalMs) * W;
      const endX   = (nextMs / totalMs) * W;
      const segW   = Math.max(2, endX - startX);

      ctx.fillStyle = RISK_COLORS[seg.risk] || '#10b981';
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.roundRect(startX, BAR_Y, segW, BAR_H, 3);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Tick mark at state change
      if (i > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(startX, BAR_Y, 1.5, BAR_H);
      }
    }

    // Timeline border
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.roundRect(0, BAR_Y, W, BAR_H, 3);
    ctx.stroke();

    // Time labels
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '10px monospace';
    ctx.textBaseline = 'top';
    const labelCount = Math.min(6, Math.floor(W / 90));
    for (let i = 0; i <= labelCount; i++) {
      const ms = (i / labelCount) * totalMs;
      const x = (i / labelCount) * W;
      const label = formatTime(ms);
      const tw = ctx.measureText(label).width;
      ctx.fillText(label, Math.min(W - tw - 2, Math.max(0, x - tw / 2)), BAR_Y + BAR_H + 4);
    }

    // "NOW" indicator
    const nowX = W - 2;
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.9;
    ctx.fillRect(nowX - 1, BAR_Y - 3, 2, BAR_H + 6);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '9px monospace';
    ctx.fillText('NOW', nowX - 20, BAR_Y + BAR_H + 4);

  }, [timeline, sessionDurationMs]);

  if (!timeline || timeline.length === 0) {
    return (
      <div style={{
        height: 56, borderRadius: 8, background: '#0a0f1a',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.2)', fontSize: 12, fontFamily: 'monospace',
      }}>
        Timeline will appear once session starts
      </div>
    );
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: 56, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}
      />
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
        {[
          { risk: 'low',      label: 'Normal' },
          { risk: 'medium',   label: 'Elevated' },
          { risk: 'high',     label: 'High Risk' },
          { risk: 'critical', label: 'Seizure' },
        ].map(({ risk, label }) => (
          <div key={risk} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: RISK_COLORS[risk] }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
