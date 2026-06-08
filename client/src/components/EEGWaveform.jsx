import { useRef, useEffect, useState } from "react";

const DISPLAY_CHANNELS = ['Fp1','F3','C3','P3','O1','F7','T3','T5'];
const DISPLAY_SECONDS = 4;
const CANVAS_HEIGHT = 240;
const CHAN_HEIGHT = CANVAS_HEIGHT / DISPLAY_CHANNELS.length;

const RISK_COLORS = {
  low:      '#10b981',
  medium:   '#f59e0b',
  high:     '#f97316',
  critical: '#ef4444',
};

export default function EEGWaveform({ samples, risk = 'low', isRunning }) {
  const canvasRef = useRef(null);
  const historyRef = useRef([]); // rolling buffer of samples for display
  const animRef = useRef(null);

  useEffect(() => {
    if (samples && samples.length > 0) {
      historyRef.current.push(...samples);
      // Keep last ~4 seconds of display data
      const maxSamples = DISPLAY_SECONDS * 60; // approx at 60fps
      if (historyRef.current.length > maxSamples) {
        historyRef.current = historyRef.current.slice(-maxSamples);
      }
    }
  }, [samples]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function draw() {
      const W = canvas.offsetWidth || canvas.width;
      const H = CANVAS_HEIGHT;
      canvas.width  = W;
      canvas.height = H;

      // Background
      ctx.fillStyle = '#0a0f1a';
      ctx.fillRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 0.5;
      const gridCols = 8;
      for (let i = 0; i <= gridCols; i++) {
        const x = (W / gridCols) * i;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      DISPLAY_CHANNELS.forEach((_, i) => {
        const y = i * CHAN_HEIGHT;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      });

      const history = historyRef.current;
      const waveColor = RISK_COLORS[risk] || '#10b981';

      // Draw each channel
      DISPLAY_CHANNELS.forEach((ch, ci) => {
        const yBase = ci * CHAN_HEIGHT + CHAN_HEIGHT / 2;
        const scale = CHAN_HEIGHT * 0.38;

        // Channel label
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '9px monospace';
        ctx.fillText(ch, 6, yBase - CHAN_HEIGHT * 0.28);

        if (history.length < 2) return;

        // Normalize amplitude
        const vals = history.map(s => s[ch] || 0);
        const absMax = Math.max(1, ...vals.map(Math.abs));

        ctx.beginPath();
        ctx.strokeStyle = waveColor;
        ctx.lineWidth = risk === 'critical' ? 1.5 : 1;
        ctx.globalAlpha = risk === 'critical' ? 1 : 0.8;

        history.forEach((sample, i) => {
          const x = (i / (history.length - 1)) * W;
          const v = (sample[ch] || 0) / absMax;
          const y = yBase - v * scale;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // Scan line (time cursor at right edge)
      if (isRunning) {
        const gradient = ctx.createLinearGradient(W - 60, 0, W, 0);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, `${waveColor}18`);
        ctx.fillStyle = gradient;
        ctx.fillRect(W - 60, 0, 60, H);
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [risk, isRunning]);

  return (
    <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: CANVAS_HEIGHT }}
      />
      {!isRunning && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'rgba(10,15,26,0.7)',
          color: 'rgba(255,255,255,0.4)', fontSize: 13, letterSpacing: 2,
          fontFamily: 'monospace',
        }}>
          SESSION PAUSED — EEG STREAM OFFLINE
        </div>
      )}
    </div>
  );
}
