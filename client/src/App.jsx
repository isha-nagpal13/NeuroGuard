import { useState, useEffect, useRef, useCallback } from "react";

const COLORS = {
  bg: "#050c14",
  surface: "#0a1628",
  surfaceAlt: "#0d1e35",
  border: "#1a2d4a",
  borderGlow: "#1e4080",
  accent: "#00d4ff",
  accentDim: "#0099bb",
  accentGlow: "rgba(0,212,255,0.15)",
  danger: "#ff3d6b",
  dangerGlow: "rgba(255,61,107,0.2)",
  warning: "#f59e0b",
  warningGlow: "rgba(245,158,11,0.15)",
  success: "#10d48e",
  successGlow: "rgba(16,212,142,0.15)",
  purple: "#8b5cf6",
  purpleGlow: "rgba(139,92,246,0.15)",
  text: "#e2eaf8",
  textSub: "#7a9cc0",
  textMuted: "#3d5a7a",
};

const BRAIN_STATES = [
  { id: "normal", label: "Normal", color: COLORS.success, bg: COLORS.successGlow, icon: "🧠", desc: "Resting state activity within normal range" },
  { id: "alert", label: "Pre-ictal", color: COLORS.warning, bg: COLORS.warningGlow, icon: "⚡", desc: "Early warning — elevated rhythmic patterns detected" },
  { id: "seizure", label: "Seizure Activity", color: COLORS.danger, bg: COLORS.dangerGlow, icon: "🚨", desc: "High-amplitude irregular discharges detected" },
  { id: "postictal", label: "Post-ictal", color: COLORS.purple, bg: COLORS.purpleGlow, icon: "💤", desc: "Recovery phase — slow delta wave dominance" },
];

const CHANNELS = ["Fp1", "Fp2", "F3", "F4", "C3", "C4", "P3", "P4"];

const ALERT_LOG = [
  { id: 1, type: "danger", msg: "Seizure activity detected — EEG Ch. F3/F4", time: "14:32:08", acked: false },
  { id: 2, type: "warning", msg: "Pre-ictal pattern onset — caregiver notified", time: "13:58:44", acked: true },
  { id: 3, type: "success", msg: "All vitals normalized — post-ictal resolved", time: "13:45:20", acked: true },
  { id: 4, type: "warning", msg: "Elevated beta activity detected in Fp1/Fp2", time: "11:02:15", acked: true },
  { id: 5, type: "info", msg: "Session started — baseline calibration complete", time: "09:00:00", acked: true },
];

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "M3 13l4-4 4 4 4-8 4 4" },
  { id: "eeg", label: "EEG Monitor", icon: "M3 12h4l3-9 4 18 3-9h4" },
  { id: "analytics", label: "Analytics", icon: "M4 20h16M4 4v16M4 16l4-4 4 4 4-8 4 4" },
  { id: "alerts", label: "Caregiver Alerts", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
  { id: "patients", label: "Patients", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
  { id: "settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
];

function useEEGSimulator(stateId) {
  const [waveData, setWaveData] = useState(() => CHANNELS.map(() => Array(200).fill(0)));
  const frameRef = useRef(0);
  const phaseRef = useRef(CHANNELS.map(() => Math.random() * Math.PI * 2));

  useEffect(() => {
    let raf;
    const tick = () => {
      frameRef.current += 1;
      const t = frameRef.current;
      setWaveData(prev =>
        prev.map((ch, i) => {
          const phase = phaseRef.current[i];
          let sample = 0;
          if (stateId === "normal") {
            sample = Math.sin((t * 0.08 + phase) * 1.0) * 18 +
              Math.sin((t * 0.2 + phase) * 1.3) * 8 +
              (Math.random() - 0.5) * 6;
          } else if (stateId === "alert") {
            sample = Math.sin((t * 0.15 + phase) * 1.6) * 28 +
              Math.sin((t * 0.4 + phase) * 2.1) * 14 +
              (Math.random() - 0.5) * 10;
          } else if (stateId === "seizure") {
            const spike = Math.sin((t * 0.35 + phase) * 3.5) > 0.7 ? 60 : 0;
            sample = Math.sin((t * 0.3 + phase) * 2.8) * 40 +
              spike + (Math.random() - 0.5) * 18;
          } else {
            sample = Math.sin((t * 0.03 + phase) * 0.4) * 35 +
              (Math.random() - 0.5) * 5;
          }
          const next = [...ch.slice(1), sample];
          return next;
        })
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stateId]);

  return waveData;
}

function EEGChannel({ data, label, color, height = 44 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    const step = w / (data.length - 1);
    const mid = h / 2;
    const scale = h / 120;
    data.forEach((v, i) => {
      const x = i * step;
      const y = mid - v * scale;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [data, color]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
      <span style={{ fontSize: 10, color: COLORS.textMuted, width: 22, flexShrink: 0, fontFamily: "monospace" }}>{label}</span>
      <canvas ref={canvasRef} width={520} height={height} style={{ width: "100%", height, display: "block", borderRadius: 2 }} />
    </div>
  );
}

function SeizureRiskMeter({ risk }) {
  const angle = -135 + risk * 2.7;
  const color = risk < 33 ? COLORS.success : risk < 66 ? COLORS.warning : COLORS.danger;
  const glow = risk < 33 ? COLORS.successGlow : risk < 66 ? COLORS.warningGlow : COLORS.dangerGlow;
  const label = risk < 33 ? "Low Risk" : risk < 66 ? "Elevated" : "High Risk";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0 0" }}>
      <svg viewBox="0 0 200 120" width="100%" style={{ maxWidth: 220, overflow: "visible" }}>
        <defs>
          <linearGradient id="riskGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={COLORS.success} />
            <stop offset="50%" stopColor={COLORS.warning} />
            <stop offset="100%" stopColor={COLORS.danger} />
          </linearGradient>
          <filter id="glowFilter">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={COLORS.border} strokeWidth="14" strokeLinecap="round" />
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#riskGrad)" strokeWidth="14" strokeLinecap="round" opacity="0.85" />
        <circle cx="100" cy="100" r="6" fill={COLORS.surface} stroke={COLORS.border} strokeWidth="1.5" />
        <line
          x1="100" y1="100"
          x2={100 + 65 * Math.cos((angle * Math.PI) / 180)}
          y2={100 + 65 * Math.sin((angle * Math.PI) / 180)}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#glowFilter)"
          style={{ transition: "all 0.4s cubic-bezier(.4,0,.2,1)" }}
        />
        <circle cx="100" cy="100" r="3.5" fill={color} />
        <text x="100" y="82" textAnchor="middle" fontSize="22" fontWeight="700" fill={color} fontFamily="monospace">{risk}%</text>
        <text x="100" y="113" textAnchor="middle" fontSize="10" fill={COLORS.textSub} fontFamily="sans-serif">{label}</text>
        <text x="22" y="116" fontSize="9" fill={COLORS.textMuted} fontFamily="sans-serif">0</text>
        <text x="175" y="116" fontSize="9" fill={COLORS.textMuted} fontFamily="sans-serif">100</text>
      </svg>
      <div style={{ width: "80%", height: 4, borderRadius: 2, background: `linear-gradient(to right, ${COLORS.success}, ${COLORS.warning}, ${COLORS.danger})`, opacity: 0.3, marginTop: 4 }} />
    </div>
  );
}

function BrainStateCard({ stateId }) {
  const state = BRAIN_STATES.find(s => s.id === stateId) || BRAIN_STATES[0];
  const pulse = stateId === "seizure";
  return (
    <div style={{
      background: state.bg,
      border: `1px solid ${state.color}44`,
      borderRadius: 14,
      padding: "18px 20px",
      position: "relative",
      overflow: "hidden",
    }}>
      {pulse && (
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at center, ${state.color}18 0%, transparent 70%)`,
          animation: "pulseGlow 1.2s ease-in-out infinite alternate",
        }} />
      )}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div>
          <p style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 6px" }}>Brain State</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 22 }}>{state.icon}</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: state.color, letterSpacing: "-0.02em" }}>{state.label}</span>
          </div>
          <p style={{ fontSize: 12, color: COLORS.textSub, margin: 0, lineHeight: 1.5 }}>{state.desc}</p>
        </div>
        <div style={{
          width: 12, height: 12, borderRadius: "50%",
          background: state.color,
          boxShadow: `0 0 8px ${state.color}`,
          flexShrink: 0, marginTop: 4,
          animation: pulse ? "pulseGlow 0.8s ease-in-out infinite alternate" : "none",
        }} />
      </div>
      <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
        {BRAIN_STATES.map(s => (
          <div key={s.id} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: s.id === stateId ? s.color : COLORS.border,
            transition: "background 0.4s",
            boxShadow: s.id === stateId ? `0 0 6px ${s.color}88` : "none",
          }} />
        ))}
      </div>
    </div>
  );
}

function AlertItem({ alert }) {
  const colors = {
    danger: { c: COLORS.danger, bg: COLORS.dangerGlow, dot: COLORS.danger },
    warning: { c: COLORS.warning, bg: COLORS.warningGlow, dot: COLORS.warning },
    success: { c: COLORS.success, bg: COLORS.successGlow, dot: COLORS.success },
    info: { c: COLORS.accent, bg: COLORS.accentGlow, dot: COLORS.accent },
  };
  const style = colors[alert.type];
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px",
      borderRadius: 10, background: alert.acked ? "transparent" : style.bg,
      border: `1px solid ${alert.acked ? COLORS.border : style.c + "44"}`,
      marginBottom: 6, transition: "all 0.3s",
    }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: style.dot, flexShrink: 0, marginTop: 5, boxShadow: `0 0 4px ${style.dot}` }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, color: alert.acked ? COLORS.textSub : COLORS.text, margin: "0 0 2px", lineHeight: 1.4 }}>{alert.msg}</p>
        <p style={{ fontSize: 10, color: COLORS.textMuted, margin: 0, fontFamily: "monospace" }}>{alert.time}</p>
      </div>
      {!alert.acked && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: style.c + "22", color: style.c, flexShrink: 0 }}>NEW</span>}
    </div>
  );
}

function StatCard({ label, value, unit, color, delta }) {
  return (
    <div style={{ background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "14px 16px" }}>
      <p style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 6px" }}>{label}</p>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: color || COLORS.text, fontFamily: "monospace", lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 12, color: COLORS.textSub }}>{unit}</span>}
      </div>
      {delta !== undefined && (
        <p style={{ fontSize: 10, color: delta >= 0 ? COLORS.success : COLORS.danger, margin: "4px 0 0" }}>
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}% vs yesterday
        </p>
      )}
    </div>
  );
}

function Sidebar({ active, onNav, collapsed, onToggle }) {
  return (
    <aside style={{
      width: collapsed ? 60 : 220,
      background: COLORS.surface,
      borderRight: `1px solid ${COLORS.border}`,
      display: "flex", flexDirection: "column",
      transition: "width 0.3s cubic-bezier(.4,0,.2,1)",
      overflow: "hidden", flexShrink: 0,
    }}>
      <div style={{ padding: collapsed ? "20px 0" : "20px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between" }}>
        {!collapsed && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${COLORS.accent}33, ${COLORS.purple}33)`, border: `1px solid ${COLORS.accent}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="2"><path d="M3 12h4l3-9 4 18 3-9h4" /></svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, letterSpacing: "-0.02em" }}>NeuroGuard</span>
            </div>
            <p style={{ fontSize: 9, color: COLORS.textMuted, margin: "2px 0 0 36px", letterSpacing: "0.1em" }}>BCI SYSTEM v1.0</p>
          </div>
        )}
        <button onClick={onToggle} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: COLORS.textSub }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>
      </div>

      <nav style={{ flex: 1, padding: "12px 0" }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => onNav(item.id)}
            title={collapsed ? item.label : undefined}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: collapsed ? "10px 0" : "10px 16px",
              justifyContent: collapsed ? "center" : "flex-start",
              background: active === item.id ? COLORS.accentGlow : "transparent",
              border: "none", borderLeft: active === item.id ? `2px solid ${COLORS.accent}` : "2px solid transparent",
              cursor: "pointer", transition: "all 0.15s", borderRadius: collapsed ? 0 : "0 8px 8px 0",
              marginBottom: 2,
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active === item.id ? COLORS.accent : COLORS.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={item.icon} />
            </svg>
            {!collapsed && <span style={{ fontSize: 13, color: active === item.id ? COLORS.accent : COLORS.textSub, fontWeight: active === item.id ? 600 : 400 }}>{item.label}</span>}
          </button>
        ))}
      </nav>

      {!collapsed && (
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS.purple}55, ${COLORS.accent}33)`, border: `1px solid ${COLORS.purple}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: COLORS.purple, fontWeight: 700 }}>AK</div>
            <div>
              <p style={{ fontSize: 12, color: COLORS.text, margin: 0, fontWeight: 600 }}>Dr. Anya Kapoor</p>
              <p style={{ fontSize: 10, color: COLORS.textMuted, margin: 0 }}>Neurologist</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function LandingPage({ onEnter }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: COLORS.bg, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse at 30% 40%, ${COLORS.accent}08 0%, transparent 55%), radial-gradient(ellipse at 70% 70%, ${COLORS.purple}08 0%, transparent 55%)` }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, ${COLORS.border}44 39px, ${COLORS.border}44 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, ${COLORS.border}22 39px, ${COLORS.border}22 40px)`, opacity: 0.5 }} />

      <div style={{ position: "relative", textAlign: "center", maxWidth: 680, padding: "0 24px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 20, border: `1px solid ${COLORS.accent}44`, background: COLORS.accentGlow, marginBottom: 32 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.success, boxShadow: `0 0 6px ${COLORS.success}`, animation: "pulseGlow 1.4s ease-in-out infinite alternate" }} />
          <span style={{ fontSize: 11, color: COLORS.accent, letterSpacing: "0.12em", fontFamily: "monospace" }}>SYSTEM ONLINE — PHASE 1 DEMO</span>
        </div>

        <h1 style={{ fontSize: "clamp(36px, 8vw, 72px)", fontWeight: 800, color: COLORS.text, margin: "0 0 8px", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
          Neuro<span style={{ color: COLORS.accent }}>Guard</span>
          <br /><span style={{ fontSize: "0.55em", color: COLORS.textSub, fontWeight: 400, letterSpacing: "-0.02em" }}>Brain-Computer Interface</span>
        </h1>

        <p style={{ fontSize: "clamp(14px, 2.5vw, 18px)", color: COLORS.textSub, margin: "20px auto 40px", lineHeight: 1.7, maxWidth: 520 }}>
          Real-time EEG analysis with AI-driven seizure prediction. Protecting patients through continuous neural monitoring and instant caregiver alerts.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 56 }}>
          {["EEG Signal Analysis", "Seizure Prediction", "Caregiver Alerts", "HIPAA-Ready"].map(f => (
            <span key={f} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: `1px solid ${COLORS.border}`, color: COLORS.textSub, background: COLORS.surfaceAlt }}>✦ {f}</span>
          ))}
        </div>

        <button onClick={onEnter} style={{
          padding: "14px 40px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer",
          background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDim})`,
          border: "none", color: COLORS.bg, letterSpacing: "-0.01em",
          boxShadow: `0 0 32px ${COLORS.accent}44`, transition: "all 0.2s",
        }}
          onMouseEnter={e => { e.target.style.boxShadow = `0 0 48px ${COLORS.accent}66`; e.target.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.target.style.boxShadow = `0 0 32px ${COLORS.accent}44`; e.target.style.transform = "none"; }}>
          Launch Dashboard →
        </button>

        <div style={{ marginTop: 56, display: "flex", gap: 40, justifyContent: "center" }}>
          {[["CHB-MIT", "EEG Dataset"], ["PhysioNet", "Open Data"], ["TUH EEG", "Corpus"]].map(([name, sub]) => (
            <div key={name} style={{ textAlign: "center" }}>
              <p style={{ fontSize: 13, color: COLORS.text, margin: "0 0 2px", fontWeight: 600 }}>{name}</p>
              <p style={{ fontSize: 10, color: COLORS.textMuted, margin: 0, letterSpacing: "0.08em" }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ brainState, onStateChange, waveData, riskLevel }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [alerts, setAlerts] = useState(ALERT_LOG);

  const channelColors = [COLORS.accent, "#5eead4", "#a78bfa", "#fb7185", COLORS.accent, "#5eead4", "#a78bfa", "#fb7185"];

  const unreadCount = alerts.filter(a => !a.acked).length;

  return (
    <div style={{ display: "flex", height: "100vh", background: COLORS.bg, color: COLORS.text, fontFamily: "'Inter', system-ui, sans-serif", overflow: "hidden" }}>
      <Sidebar active={activeNav} onNav={setActiveNav} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} />

      <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <header style={{ padding: "16px 24px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: COLORS.surface, flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: "-0.02em", color: COLORS.text }}>Patient Dashboard</h1>
            <p style={{ fontSize: 11, color: COLORS.textMuted, margin: "2px 0 0", fontFamily: "monospace" }}>Patient: Emma Dawson · ID #0042 · Session 14</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8, background: COLORS.successGlow, border: `1px solid ${COLORS.success}44` }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.success, boxShadow: `0 0 5px ${COLORS.success}`, animation: "pulseGlow 1.5s ease-in-out infinite alternate" }} />
              <span style={{ fontSize: 11, color: COLORS.success, fontFamily: "monospace" }}>LIVE</span>
            </div>
            <button style={{ background: COLORS.dangerGlow, border: `1px solid ${COLORS.danger}44`, borderRadius: 8, padding: "5px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: COLORS.danger, fontWeight: 600 }}>🚨 Emergency</span>
            </button>
          </div>
        </header>

        <div style={{ flex: 1, padding: "20px 24px", display: "flex", gap: 20, minHeight: 0 }}>
          {/* Left Column */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            {/* Stat row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <StatCard label="Heart Rate" value="72" unit="bpm" color={COLORS.success} delta={-2} />
              <StatCard label="SpO₂" value="98" unit="%" color={COLORS.accent} />
              <StatCard label="Session Time" value="4:32" unit="h" color={COLORS.textSub} />
              <StatCard label="Alerts Today" value={alerts.length} color={COLORS.warning} delta={12} />
            </div>

            {/* Brain State + EEG */}
            <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: COLORS.text }}>Live EEG Monitor</h2>
                  <p style={{ fontSize: 10, color: COLORS.textMuted, margin: "2px 0 0", fontFamily: "monospace" }}>256 Hz · 8-channel · CHB-MIT Protocol</p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["Delta", "Theta", "Alpha", "Beta"].map((b, i) => (
                    <span key={b} style={{ fontSize: 9, padding: "3px 8px", borderRadius: 4, background: COLORS.surfaceAlt, color: COLORS.textSub, border: `1px solid ${COLORS.border}` }}>{b}</span>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1, overflow: "hidden" }}>
                {CHANNELS.map((ch, i) => (
                  <EEGChannel key={ch} data={waveData[i] || []} label={ch} color={channelColors[i]} height={42} />
                ))}
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <div style={{ flex: 1, display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: COLORS.textMuted }}>Simulate state:</span>
                  {BRAIN_STATES.map(s => (
                    <button key={s.id} onClick={() => onStateChange(s.id)}
                      style={{
                        fontSize: 10, padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                        background: brainState === s.id ? s.color + "22" : COLORS.surfaceAlt,
                        border: `1px solid ${brainState === s.id ? s.color + "88" : COLORS.border}`,
                        color: brainState === s.id ? s.color : COLORS.textSub,
                        transition: "all 0.2s",
                      }}>{s.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            <BrainStateCard stateId={brainState} />

            <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "18px 20px" }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 4px", color: COLORS.text }}>Seizure Risk</h2>
              <p style={{ fontSize: 10, color: COLORS.textMuted, margin: "0 0 4px", fontFamily: "monospace" }}>AI prediction confidence: 94%</p>
              <SeizureRiskMeter risk={riskLevel} />
              <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 8, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}` }}>
                <p style={{ fontSize: 10, color: COLORS.textMuted, margin: "0 0 4px" }}>MODEL OUTPUT</p>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.textSub }}>
                  <span>Focal onset likelihood</span>
                  <span style={{ color: COLORS.warning, fontFamily: "monospace" }}>67%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.textSub, marginTop: 4 }}>
                  <span>Generalized onset</span>
                  <span style={{ color: COLORS.textSub, fontFamily: "monospace" }}>21%</span>
                </div>
              </div>
            </div>

            <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "18px 20px", flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: COLORS.text }}>Recent Alerts</h2>
                {unreadCount > 0 && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 10, background: COLORS.dangerGlow, border: `1px solid ${COLORS.danger}44`, color: COLORS.danger }}>{unreadCount} NEW</span>}
              </div>
              <div style={{ overflow: "auto", flex: 1 }}>
                {alerts.map(a => <AlertItem key={a.id} alert={a} />)}
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes pulseGlow {
          from { opacity: 0.6; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1.03); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }
      `}</style>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("landing");
  const [brainState, setBrainState] = useState("normal");
  const [riskLevel, setRiskLevel] = useState(22);
  const waveData = useEEGSimulator(brainState);

  useEffect(() => {
    const targets = { normal: 18, alert: 52, seizure: 87, postictal: 31 };
    const target = targets[brainState];
    const interval = setInterval(() => {
      setRiskLevel(prev => {
        const diff = target - prev;
        if (Math.abs(diff) < 1) return target;
        return Math.round(prev + diff * 0.08 + (Math.random() - 0.5) * 1.5);
      });
    }, 200);
    return () => clearInterval(interval);
  }, [brainState]);

  if (view === "landing") return <LandingPage onEnter={() => setView("dashboard")} />;

  return (
    <Dashboard
      brainState={brainState}
      onStateChange={setBrainState}
      waveData={waveData}
      riskLevel={Math.max(0, Math.min(100, riskLevel))}
    />
  );
}
