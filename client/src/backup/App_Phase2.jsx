import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────
// DESIGN TOKENS (identical to Phase 1)
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// EXTENDED NAV ITEMS (Phase 2)
// ─────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "M3 13l4-4 4 4 4-8 4 4" },
  { id: "profile", label: "Patient Profile", icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" },
  { id: "eeg", label: "EEG Monitor", icon: "M3 12h4l3-9 4 18 3-9h4" },
  { id: "eegupload", label: "EEG Upload", icon: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" },
  { id: "analytics", label: "Analytics", icon: "M4 20h16M4 4v16M4 16l4-4 4 4 4-8 4 4" },
  { id: "alerts", label: "Caregiver Alerts", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
  { id: "settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
];

// ─────────────────────────────────────────────
// DUMMY DATA
// ─────────────────────────────────────────────
const PATIENT = {
  id: "#EPI-0042",
  name: "Emma Dawson",
  age: 28,
  gender: "Female",
  bloodGroup: "O+",
  epilepsyType: "Focal Cortical Dysplasia — Type IIb",
  dob: "14 Mar 1997",
  lastSeizure: "2025-06-01 09:50",
  sessionCount: 14,
  photo: null,
  medicalHistory: [
    "Diagnosed with epilepsy at age 12",
    "MRI confirmed FCD Type IIb in right frontal lobe (2019)",
    "Two prior surgical consultations — not eligible for resection",
    "No significant cardiac, hepatic, or renal comorbidities",
  ],
  medications: [
    { name: "Levetiracetam (Keppra)", dose: "1000mg", freq: "Twice daily" },
    { name: "Lamotrigine", dose: "150mg", freq: "Once daily" },
    { name: "Clobazam", dose: "10mg", freq: "As needed (breakthrough)" },
  ],
  emergencyContacts: [
    { name: "Richard Dawson", relation: "Father", phone: "+1 (312) 555-0192" },
    { name: "Sarah Dawson", relation: "Mother", phone: "+1 (312) 555-0183" },
    { name: "Dr. Anya Kapoor", relation: "Assigned Neurologist", phone: "+1 (773) 555-0247" },
  ],
  neurologist: "Dr. Anya Kapoor",
  neurology_dept: "Neurology Dept. — ChicagoMed BCI Center",
};

const UPLOAD_HISTORY = [
  { id: "EEG-20250601", name: "session_2025_06_01.edf", size: "14.2 MB", duration: "4h 32m", status: "analyzed", date: "Jun 01, 2025", events: 1 },
  { id: "EEG-20250528", name: "session_2025_05_28.edf", size: "11.8 MB", duration: "3h 51m", status: "analyzed", date: "May 28, 2025", events: 0 },
  { id: "EEG-20250520", name: "session_2025_05_20.edf", size: "16.1 MB", duration: "5h 04m", status: "analyzed", date: "May 20, 2025", events: 2 },
  { id: "EEG-20250512", name: "session_2025_05_12.edf", size: "9.3 MB", duration: "3h 12m", status: "partial", date: "May 12, 2025", events: 0 },
];

const SEIZURE_TIMELINE = [
  { time: "09:10", state: "Normal", color: COLORS.success, icon: "🧠", desc: "Baseline EEG — alpha 8-13 Hz dominant" },
  { time: "09:45", state: "Pre-Ictal", color: COLORS.warning, icon: "⚡", desc: "Beta rhythm surge detected in F3/F4" },
  { time: "09:48", state: "High Risk", color: "#ff8c42", icon: "⚠️", desc: "Risk score crossed 75 — caregiver pre-alerted" },
  { time: "09:50", state: "Seizure Activity", color: COLORS.danger, icon: "🚨", desc: "High-amplitude polyspike discharge — 18 seconds" },
  { time: "09:55", state: "Caregiver Alert", color: COLORS.accent, icon: "📲", desc: "Emergency notification dispatched to R. Dawson" },
  { time: "10:20", state: "Recovery", color: COLORS.purple, icon: "💤", desc: "Post-ictal theta dominance — vitals stabilizing" },
  { time: "10:48", state: "Normalized", color: COLORS.success, icon: "✅", desc: "Full recovery — alpha rhythm restored" },
];

const DAILY_RISK = [
  { h: "00:00", v: 12 }, { h: "02:00", v: 8 }, { h: "04:00", v: 15 }, { h: "06:00", v: 22 },
  { h: "08:00", v: 18 }, { h: "09:45", v: 68 }, { h: "09:50", v: 87 }, { h: "10:00", v: 55 },
  { h: "10:30", v: 30 }, { h: "12:00", v: 20 }, { h: "14:00", v: 28 }, { h: "16:00", v: 35 },
  { h: "18:00", v: 14 }, { h: "20:00", v: 10 }, { h: "22:00", v: 8 },
];

const WEEKLY_SEIZURES = [
  { day: "Mon", count: 0 }, { day: "Tue", count: 1 }, { day: "Wed", count: 0 },
  { day: "Thu", count: 0 }, { day: "Fri", count: 2 }, { day: "Sat", count: 1 }, { day: "Sun", count: 0 },
];

const BRAINWAVE_DIST = [
  { band: "Delta", pct: 18, color: COLORS.purple },
  { band: "Theta", pct: 22, color: COLORS.accent },
  { band: "Alpha", pct: 35, color: COLORS.success },
  { band: "Beta", pct: 19, color: COLORS.warning },
  { band: "Gamma", pct: 6, color: COLORS.danger },
];

const MONTHLY_TREND = [
  { month: "Jan", pred: 3, actual: 2 }, { month: "Feb", pred: 2, actual: 2 },
  { month: "Mar", pred: 4, actual: 3 }, { month: "Apr", pred: 1, actual: 1 },
  { month: "May", pred: 3, actual: 4 }, { month: "Jun", pred: 1, actual: 1 },
];

const BRAIN_HEALTH = {
  score: 74,
  metrics: [
    { label: "Neural Stability", value: 82, color: COLORS.success },
    { label: "Alpha Activity", value: 78, color: COLORS.accent },
    { label: "Beta Activity", value: 65, color: COLORS.warning },
    { label: "Stress Index", value: 41, color: COLORS.danger, invert: true },
    { label: "Focus Level", value: 70, color: COLORS.purple },
  ],
};

// ─────────────────────────────────────────────
// HOOKS — EEG simulator (from Phase 1)
// ─────────────────────────────────────────────
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
            sample = Math.sin((t * 0.08 + phase) * 1.0) * 18 + Math.sin((t * 0.2 + phase) * 1.3) * 8 + (Math.random() - 0.5) * 6;
          } else if (stateId === "alert") {
            sample = Math.sin((t * 0.15 + phase) * 1.6) * 28 + Math.sin((t * 0.4 + phase) * 2.1) * 14 + (Math.random() - 0.5) * 10;
          } else if (stateId === "seizure") {
            const spike = Math.sin((t * 0.35 + phase) * 3.5) > 0.7 ? 60 : 0;
            sample = Math.sin((t * 0.3 + phase) * 2.8) * 40 + spike + (Math.random() - 0.5) * 18;
          } else {
            sample = Math.sin((t * 0.03 + phase) * 0.4) * 35 + (Math.random() - 0.5) * 5;
          }
          return [...ch.slice(1), sample];
        })
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stateId]);

  return waveData;
}

// ─────────────────────────────────────────────
// SHARED SMALL COMPONENTS
// ─────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: COLORS.surface,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 16,
      padding: "18px 20px",
      ...style,
    }}>{children}</div>
  );
}

function SectionTitle({ title, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: COLORS.text }}>{title}</h2>
      {sub && <p style={{ fontSize: 10, color: COLORS.textMuted, margin: "2px 0 0", fontFamily: "monospace" }}>{sub}</p>}
    </div>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{
      fontSize: 10, padding: "3px 9px", borderRadius: 20,
      background: color + "22", border: `1px solid ${color}44`,
      color, fontFamily: "monospace", fontWeight: 600,
    }}>{label}</span>
  );
}

function ProgressBar({ value, color, height = 6 }) {
  return (
    <div style={{ background: COLORS.border, borderRadius: height, overflow: "hidden", height }}>
      <div style={{
        width: `${value}%`, height: "100%", borderRadius: height,
        background: `linear-gradient(90deg, ${color}bb, ${color})`,
        boxShadow: `0 0 8px ${color}66`,
        transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
      }} />
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

// ─────────────────────────────────────────────
// SIDEBAR (Phase 2 — extended nav)
// ─────────────────────────────────────────────
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
            <p style={{ fontSize: 9, color: COLORS.textMuted, margin: "2px 0 0 36px", letterSpacing: "0.1em" }}>BCI SYSTEM v2.0</p>
          </div>
        )}
        <button onClick={onToggle} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: COLORS.textSub }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>
      </div>

      <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
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

// ─────────────────────────────────────────────
// EEG COMPONENTS (from Phase 1 — preserved)
// ─────────────────────────────────────────────
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
  const label = risk < 33 ? "Low Risk" : risk < 66 ? "Elevated" : "High Risk";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0 0" }}>
      <svg viewBox="0 0 200 120" width="100%" style={{ maxWidth: 220, overflow: "visible" }}>
        <defs>
          <linearGradient id="riskGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={COLORS.success} /><stop offset="50%" stopColor={COLORS.warning} /><stop offset="100%" stopColor={COLORS.danger} />
          </linearGradient>
          <filter id="glowFilter2"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={COLORS.border} strokeWidth="14" strokeLinecap="round" />
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#riskGrad2)" strokeWidth="14" strokeLinecap="round" opacity="0.85" />
        <circle cx="100" cy="100" r="6" fill={COLORS.surface} stroke={COLORS.border} strokeWidth="1.5" />
        <line x1="100" y1="100" x2={100 + 65 * Math.cos((angle * Math.PI) / 180)} y2={100 + 65 * Math.sin((angle * Math.PI) / 180)}
          stroke={color} strokeWidth="2.5" strokeLinecap="round" filter="url(#glowFilter2)"
          style={{ transition: "all 0.4s cubic-bezier(.4,0,.2,1)" }} />
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
    <div style={{ background: state.bg, border: `1px solid ${state.color}44`, borderRadius: 14, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
      {pulse && (<div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, ${state.color}18 0%, transparent 70%)`, animation: "pulseGlow 1.2s ease-in-out infinite alternate" }} />)}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div>
          <p style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 6px" }}>Brain State</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 22 }}>{state.icon}</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: state.color, letterSpacing: "-0.02em" }}>{state.label}</span>
          </div>
          <p style={{ fontSize: 12, color: COLORS.textSub, margin: 0, lineHeight: 1.5 }}>{state.desc}</p>
        </div>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: state.color, boxShadow: `0 0 8px ${state.color}`, flexShrink: 0, marginTop: 4, animation: pulse ? "pulseGlow 0.8s ease-in-out infinite alternate" : "none" }} />
      </div>
      <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
        {BRAIN_STATES.map(s => (<div key={s.id} style={{ flex: 1, height: 3, borderRadius: 2, background: s.id === stateId ? s.color : COLORS.border, transition: "background 0.4s", boxShadow: s.id === stateId ? `0 0 6px ${s.color}88` : "none" }} />))}
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
  const s = colors[alert.type] || colors.info;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 10, background: alert.acked ? "transparent" : s.bg, border: `1px solid ${alert.acked ? COLORS.border : s.c + "44"}`, marginBottom: 6, transition: "all 0.3s" }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, flexShrink: 0, marginTop: 5, boxShadow: `0 0 4px ${s.dot}` }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, color: alert.acked ? COLORS.textSub : COLORS.text, margin: "0 0 2px", lineHeight: 1.4 }}>{alert.msg}</p>
        <p style={{ fontSize: 10, color: COLORS.textMuted, margin: 0, fontFamily: "monospace" }}>{alert.time}</p>
      </div>
      {!alert.acked && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: s.c + "22", color: s.c, flexShrink: 0 }}>NEW</span>}
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE: LANDING
// ─────────────────────────────────────────────
function LandingPage({ onEnter }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: COLORS.bg, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse at 30% 40%, ${COLORS.accent}08 0%, transparent 55%), radial-gradient(ellipse at 70% 70%, ${COLORS.purple}08 0%, transparent 55%)` }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, ${COLORS.border}44 39px, ${COLORS.border}44 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, ${COLORS.border}22 39px, ${COLORS.border}22 40px)`, opacity: 0.5 }} />
      <div style={{ position: "relative", textAlign: "center", maxWidth: 680, padding: "0 24px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 20, border: `1px solid ${COLORS.accent}44`, background: COLORS.accentGlow, marginBottom: 32 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.success, boxShadow: `0 0 6px ${COLORS.success}`, animation: "pulseGlow 1.4s ease-in-out infinite alternate" }} />
          <span style={{ fontSize: 11, color: COLORS.accent, letterSpacing: "0.12em", fontFamily: "monospace" }}>SYSTEM ONLINE — PHASE 2 ACTIVE</span>
        </div>
        <h1 style={{ fontSize: "clamp(36px, 8vw, 72px)", fontWeight: 800, color: COLORS.text, margin: "0 0 8px", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
          Neuro<span style={{ color: COLORS.accent }}>Guard</span>
          <br /><span style={{ fontSize: "0.55em", color: COLORS.textSub, fontWeight: 400, letterSpacing: "-0.02em" }}>Brain-Computer Interface · Phase 2</span>
        </h1>
        <p style={{ fontSize: "clamp(14px, 2.5vw, 18px)", color: COLORS.textSub, margin: "20px auto 40px", lineHeight: 1.7, maxWidth: 520 }}>
          Full medical monitoring platform. AI predictions, EEG upload, seizure timelines, brain health scoring, and emergency alerts — all in one interface.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 56 }}>
          {["Patient Profiles", "EEG Upload", "AI Prediction", "Brain Health Score", "Seizure Timeline", "Emergency Alerts"].map(f => (
            <span key={f} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: `1px solid ${COLORS.border}`, color: COLORS.textSub, background: COLORS.surfaceAlt }}>✦ {f}</span>
          ))}
        </div>
        <button onClick={onEnter} style={{ padding: "14px 40px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDim})`, border: "none", color: COLORS.bg, letterSpacing: "-0.01em", boxShadow: `0 0 32px ${COLORS.accent}44`, transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 48px ${COLORS.accent}66`; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 0 32px ${COLORS.accent}44`; e.currentTarget.style.transform = "none"; }}>
          Launch Platform →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE: DASHBOARD (Phase 1 preserved)
// ─────────────────────────────────────────────
function DashboardPage({ brainState, onStateChange, waveData, riskLevel }) {
  const [alerts, setAlerts] = useState(ALERT_LOG);
  const channelColors = [COLORS.accent, "#5eead4", "#a78bfa", "#fb7185", COLORS.accent, "#5eead4", "#a78bfa", "#fb7185"];
  const unreadCount = alerts.filter(a => !a.acked).length;

  return (
    <div style={{ flex: 1, padding: "20px 24px", display: "flex", gap: 20, minHeight: 0, overflow: "auto" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <StatCard label="Heart Rate" value="72" unit="bpm" color={COLORS.success} delta={-2} />
          <StatCard label="SpO₂" value="98" unit="%" color={COLORS.accent} />
          <StatCard label="Session Time" value="4:32" unit="h" color={COLORS.textSub} />
          <StatCard label="Alerts Today" value={alerts.length} color={COLORS.warning} delta={12} />
        </div>
        <Card style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: COLORS.text }}>Live EEG Monitor</h2>
              <p style={{ fontSize: 10, color: COLORS.textMuted, margin: "2px 0 0", fontFamily: "monospace" }}>256 Hz · 8-channel · CHB-MIT Protocol</p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["Delta", "Theta", "Alpha", "Beta"].map(b => (<span key={b} style={{ fontSize: 9, padding: "3px 8px", borderRadius: 4, background: COLORS.surfaceAlt, color: COLORS.textSub, border: `1px solid ${COLORS.border}` }}>{b}</span>))}
            </div>
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            {CHANNELS.map((ch, i) => (<EEGChannel key={ch} data={waveData[i] || []} label={ch} color={channelColors[i]} height={42} />))}
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>Simulate state:</span>
            {BRAIN_STATES.map(s => (
              <button key={s.id} onClick={() => onStateChange(s.id)} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, cursor: "pointer", background: brainState === s.id ? s.color + "22" : COLORS.surfaceAlt, border: `1px solid ${brainState === s.id ? s.color + "88" : COLORS.border}`, color: brainState === s.id ? s.color : COLORS.textSub, transition: "all 0.2s" }}>{s.label}</button>
            ))}
          </div>
        </Card>
        {/* Brain Health + AI Prediction row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <BrainHealthScoreCard />
          <AIPredictionCard brainState={brainState} riskLevel={riskLevel} />
        </div>
      </div>
      <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
        <BrainStateCard stateId={brainState} />
        <Card>
          <h2 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 4px", color: COLORS.text }}>Seizure Risk</h2>
          <p style={{ fontSize: 10, color: COLORS.textMuted, margin: "0 0 4px", fontFamily: "monospace" }}>AI prediction confidence: 94%</p>
          <SeizureRiskMeter risk={riskLevel} />
          <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 8, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}` }}>
            <p style={{ fontSize: 10, color: COLORS.textMuted, margin: "0 0 4px" }}>MODEL OUTPUT</p>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.textSub }}>
              <span>Focal onset likelihood</span><span style={{ color: COLORS.warning, fontFamily: "monospace" }}>67%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.textSub, marginTop: 4 }}>
              <span>Generalized onset</span><span style={{ color: COLORS.textSub, fontFamily: "monospace" }}>21%</span>
            </div>
          </div>
        </Card>
        <Card style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: COLORS.text }}>Recent Alerts</h2>
            {unreadCount > 0 && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 10, background: COLORS.dangerGlow, border: `1px solid ${COLORS.danger}44`, color: COLORS.danger }}>{unreadCount} NEW</span>}
          </div>
          <div style={{ overflow: "auto", flex: 1 }}>
            {alerts.map(a => <AlertItem key={a.id} alert={a} />)}
          </div>
        </Card>
        <SeizureTimelineCard />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENT: AI PREDICTION CARD
// ─────────────────────────────────────────────
function AIPredictionCard({ brainState, riskLevel }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 2000);
    return () => clearInterval(t);
  }, []);

  const state = BRAIN_STATES.find(s => s.id === brainState) || BRAIN_STATES[0];
  const conf = brainState === "seizure" ? 94 : brainState === "alert" ? 81 : brainState === "postictal" ? 88 : 97;
  const riskLabel = riskLevel < 33 ? "LOW" : riskLevel < 66 ? "MODERATE" : "HIGH";
  const riskColor = riskLevel < 33 ? COLORS.success : riskLevel < 66 ? COLORS.warning : COLORS.danger;
  const predictedEvent = brainState === "seizure" ? "Focal Onset Detected" : brainState === "alert" ? "Pre-Ictal Imminent" : brainState === "postictal" ? "Recovery Phase" : "No Event Predicted";

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <SectionTitle title="AI Prediction Engine" sub="ONNX Model · v3.1.2" />
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: COLORS.successGlow, border: `1px solid ${COLORS.success}44` }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: COLORS.success, animation: "pulseGlow 1.2s ease-in-out infinite alternate" }} />
          <span style={{ fontSize: 9, color: COLORS.success, fontFamily: "monospace" }}>MODEL ACTIVE</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "Brain State", value: state.label, color: state.color, icon: state.icon },
          { label: "Prediction Confidence", value: `${conf}%`, color: COLORS.accent },
          { label: "Risk Level", value: riskLabel, color: riskColor },
          { label: "Predicted Event", value: predictedEvent, color: COLORS.textSub, small: true },
        ].map(item => (
          <div key={item.label} style={{ padding: "10px 12px", borderRadius: 10, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}` }}>
            <p style={{ fontSize: 9, color: COLORS.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 5px" }}>{item.label}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {item.icon && <span style={{ fontSize: 14 }}>{item.icon}</span>}
              <span style={{ fontSize: item.small ? 11 : 14, fontWeight: 700, color: item.color, fontFamily: "monospace", lineHeight: 1.3 }}>{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: COLORS.accentGlow, border: `1px solid ${COLORS.accent}33`, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.accent, animation: `pulseGlow ${1.5 + (tick % 3) * 0.3}s ease-in-out infinite alternate` }} />
        <span style={{ fontSize: 10, color: COLORS.accent, fontFamily: "monospace" }}>Inference running · {tick % 2 === 0 ? "256ms" : "243ms"} latency</span>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
// COMPONENT: BRAIN HEALTH SCORE CARD
// ─────────────────────────────────────────────
function BrainHealthScoreCard() {
  const { score, metrics } = BRAIN_HEALTH;
  const scoreColor = score >= 80 ? COLORS.success : score >= 60 ? COLORS.warning : COLORS.danger;

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <SectionTitle title="Brain Health Score" sub="Computed from last 24h session" />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: scoreColor, fontFamily: "monospace", lineHeight: 1, letterSpacing: "-0.04em" }}>{score}</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: "monospace" }}>/ 100</div>
        </div>
      </div>

      <div style={{ position: "relative", marginBottom: 14 }}>
        <div style={{ height: 8, borderRadius: 4, background: COLORS.border, overflow: "hidden" }}>
          <div style={{
            width: `${score}%`, height: "100%", borderRadius: 4,
            background: `linear-gradient(90deg, ${COLORS.success}, ${COLORS.warning}, ${scoreColor})`,
            boxShadow: `0 0 12px ${scoreColor}66`,
            transition: "width 1s cubic-bezier(.4,0,.2,1)",
          }} />
        </div>
        <div style={{ position: "absolute", left: `${score}%`, top: -3, transform: "translateX(-50%)", width: 14, height: 14, borderRadius: "50%", background: scoreColor, border: `2px solid ${COLORS.surface}`, boxShadow: `0 0 8px ${scoreColor}` }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {metrics.map(m => (
          <div key={m.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: COLORS.textSub }}>{m.label}</span>
              <span style={{ fontSize: 11, color: m.color, fontFamily: "monospace", fontWeight: 600 }}>{m.invert ? 100 - m.value : m.value}%</span>
            </div>
            <ProgressBar value={m.invert ? 100 - m.value : m.value} color={m.color} height={5} />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
// COMPONENT: SEIZURE TIMELINE CARD
// ─────────────────────────────────────────────
function SeizureTimelineCard({ compact = true }) {
  return (
    <Card>
      <SectionTitle title="Seizure Timeline" sub="Session · Jun 01, 2025" />
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 22, top: 0, bottom: 0, width: 1, background: `linear-gradient(to bottom, ${COLORS.border}, ${COLORS.border}44)` }} />
        {SEIZURE_TIMELINE.map((ev, i) => (
          <div key={i} style={{ display: "flex", gap: 14, marginBottom: compact ? 10 : 14, position: "relative" }}>
            <div style={{ width: 44, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", paddingTop: 2 }}>
              <span style={{ fontSize: 9, color: COLORS.textMuted, fontFamily: "monospace" }}>{ev.time}</span>
            </div>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: ev.color, flexShrink: 0, boxShadow: `0 0 8px ${ev.color}88`, border: `2px solid ${COLORS.surface}`, zIndex: 1, marginTop: 2 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: ev.color }}>{ev.state}</span>
                <span style={{ fontSize: 13 }}>{ev.icon}</span>
              </div>
              {!compact && <p style={{ fontSize: 10, color: COLORS.textSub, margin: 0, lineHeight: 1.4 }}>{ev.desc}</p>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
// PAGE: PATIENT PROFILE
// ─────────────────────────────────────────────
function PatientProfilePage() {
  return (
    <div style={{ padding: "20px 24px", overflow: "auto", flex: 1 }}>
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, maxWidth: 1100 }}>

        {/* Left: ID card */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ background: `linear-gradient(135deg, ${COLORS.surface}, ${COLORS.surfaceAlt})`, border: `1px solid ${COLORS.accent}33` }}>
            {/* Avatar */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 16, borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS.purple}44, ${COLORS.accent}33)`, border: `2px solid ${COLORS.accent}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 12 }}>👩‍⚕️</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, margin: "0 0 4px" }}>{PATIENT.name}</h2>
              <div style={{ fontSize: 11, color: COLORS.accent, fontFamily: "monospace", marginBottom: 8 }}>{PATIENT.id}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <Badge label="ACTIVE" color={COLORS.success} />
                <Badge label="SESSION 14" color={COLORS.accent} />
              </div>
            </div>

            {/* Stats */}
            <div style={{ paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                ["Age", `${PATIENT.age} years`],
                ["Gender", PATIENT.gender],
                ["Date of Birth", PATIENT.dob],
                ["Blood Group", PATIENT.bloodGroup],
                ["Last Seizure", PATIENT.lastSeizure],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: COLORS.textMuted }}>{k}</span>
                  <span style={{ fontSize: 12, color: COLORS.text, fontWeight: 600, fontFamily: "monospace" }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Emergency Contacts */}
          <Card>
            <SectionTitle title="Emergency Contacts" />
            {PATIENT.emergencyContacts.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: i < PATIENT.emergencyContacts.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                  {c.relation === "Assigned Neurologist" ? "👩‍⚕️" : c.relation === "Father" ? "👨" : "👩"}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, margin: "0 0 2px" }}>{c.name}</p>
                  <p style={{ fontSize: 10, color: COLORS.textMuted, margin: "0 0 2px" }}>{c.relation}</p>
                  <p style={{ fontSize: 10, color: COLORS.accent, fontFamily: "monospace", margin: 0 }}>{c.phone}</p>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Right: Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Epilepsy info */}
          <Card style={{ border: `1px solid ${COLORS.warning}33`, background: COLORS.warningGlow }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ fontSize: 28 }}>⚡</div>
              <div>
                <p style={{ fontSize: 10, color: COLORS.textMuted, margin: "0 0 4px", letterSpacing: "0.1em" }}>EPILEPSY TYPE</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: COLORS.warning, margin: "0 0 6px" }}>{PATIENT.epilepsyType}</p>
                <p style={{ fontSize: 11, color: COLORS.textSub, margin: 0 }}>Assigned neurologist: <span style={{ color: COLORS.accent }}>{PATIENT.neurologist}</span> · {PATIENT.neurology_dept}</p>
              </div>
            </div>
          </Card>

          {/* Medical History */}
          <Card>
            <SectionTitle title="Medical History" sub="Curated clinical records" />
            {PATIENT.medicalHistory.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, background: COLORS.accentGlow, border: `1px solid ${COLORS.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 9, color: COLORS.accent }}>✓</span>
                </div>
                <p style={{ fontSize: 12, color: COLORS.textSub, margin: 0, lineHeight: 1.5 }}>{item}</p>
              </div>
            ))}
          </Card>

          {/* Medications */}
          <Card>
            <SectionTitle title="Current Medications" sub="Prescribed regimen" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {PATIENT.medications.map((med, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "10px 14px", borderRadius: 10, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.purpleGlow, border: `1px solid ${COLORS.purple}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>💊</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, margin: "0 0 3px" }}>{med.name}</p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <span style={{ fontSize: 10, color: COLORS.accent, fontFamily: "monospace" }}>{med.dose}</span>
                      <span style={{ fontSize: 10, color: COLORS.textMuted }}>·</span>
                      <span style={{ fontSize: 10, color: COLORS.textSub }}>{med.freq}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Seizure Timeline in full detail */}
          <Card>
            <SectionTitle title="Latest Seizure Timeline" sub="Jun 01, 2025 — Full session trace" />
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 30, top: 0, bottom: 0, width: 1, background: `linear-gradient(to bottom, ${COLORS.border}, ${COLORS.border}44)` }} />
              {SEIZURE_TIMELINE.map((ev, i) => (
                <div key={i} style={{ display: "flex", gap: 14, marginBottom: 14, position: "relative" }}>
                  <div style={{ width: 60, flexShrink: 0, textAlign: "right", paddingTop: 3 }}>
                    <span style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: "monospace" }}>{ev.time}</span>
                  </div>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: ev.color, flexShrink: 0, boxShadow: `0 0 10px ${ev.color}88`, border: `2px solid ${COLORS.surface}`, zIndex: 1, marginTop: 2 }} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: ev.color }}>{ev.state}</span>
                      <span style={{ fontSize: 16 }}>{ev.icon}</span>
                    </div>
                    <p style={{ fontSize: 11, color: COLORS.textSub, margin: 0, lineHeight: 1.5 }}>{ev.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE: EEG UPLOAD
// ─────────────────────────────────────────────
function EEGUploadPage() {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processed, setProcessed] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    setProcessing(true);
    setProgress(0);
    setProcessed(false);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setProcessing(false);
          setProcessed(true);
          return 100;
        }
        return p + Math.random() * 8 + 2;
      });
    }, 120);
  };

  const PIPELINE_STEPS = ["Reading EDF", "Artifact Removal", "Band-pass Filter", "Feature Extraction", "Model Inference", "Risk Assessment"];
  const currentStep = processing ? Math.min(Math.floor(progress / 17), 5) : processed ? 5 : -1;

  return (
    <div style={{ padding: "20px 24px", flex: 1, overflow: "auto" }}>
      <div style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, margin: "0 0 4px" }}>EEG Upload</h1>
          <p style={{ fontSize: 11, color: COLORS.textMuted, margin: 0, fontFamily: "monospace" }}>Upload .edf or .eeg files for AI analysis</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? COLORS.accent : COLORS.border}`,
                borderRadius: 16,
                padding: "48px 24px",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.2s",
                background: dragOver ? COLORS.accentGlow : COLORS.surfaceAlt,
                boxShadow: dragOver ? `inset 0 0 30px ${COLORS.accent}11` : "none",
              }}>
              <input ref={fileInputRef} type="file" accept=".edf,.eeg,.csv" style={{ display: "none" }} onChange={handleFileSelect} />
              <div style={{ fontSize: 40, marginBottom: 16 }}>📂</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: dragOver ? COLORS.accent : COLORS.text, margin: "0 0 6px" }}>
                {dragOver ? "Release to upload" : "Drag & Drop EEG file here"}
              </p>
              <p style={{ fontSize: 12, color: COLORS.textMuted, margin: "0 0 20px" }}>Supports .edf, .eeg, .csv — max 100MB</p>
              <div style={{ padding: "8px 20px", borderRadius: 8, background: COLORS.accentGlow, border: `1px solid ${COLORS.accent}44`, fontSize: 12, color: COLORS.accent, cursor: "pointer" }}>
                Browse Files
              </div>
            </div>

            {/* Selected File Card */}
            {selectedFile && (
              <Card>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: COLORS.accentGlow, border: `1px solid ${COLORS.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🧪</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedFile.name}</p>
                    <p style={{ fontSize: 11, color: COLORS.textMuted, margin: "0 0 10px", fontFamily: "monospace" }}>{(selectedFile.size / 1024 / 1024).toFixed(1)} MB · EDF Format</p>
                    {processing && (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 10, color: COLORS.accent, fontFamily: "monospace" }}>
                            {PIPELINE_STEPS[currentStep] || "Initializing..."}
                          </span>
                          <span style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: "monospace" }}>{Math.round(Math.min(progress, 100))}%</span>
                        </div>
                        <ProgressBar value={Math.min(progress, 100)} color={COLORS.accent} height={6} />
                      </div>
                    )}
                    {processed && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.success }} />
                        <span style={{ fontSize: 11, color: COLORS.success, fontFamily: "monospace" }}>Analysis complete — 0 seizure events found</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleUpload}
                    disabled={processing}
                    style={{ padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: processing ? "default" : "pointer", background: processing ? COLORS.surfaceAlt : `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDim})`, border: "none", color: processing ? COLORS.textMuted : COLORS.bg, flexShrink: 0, transition: "all 0.2s" }}>
                    {processing ? "Processing..." : "Upload & Analyze"}
                  </button>
                </div>
              </Card>
            )}

            {/* Pipeline Animation */}
            {(processing || processed) && (
              <Card>
                <SectionTitle title="Signal Processing Pipeline" sub="Real-time AI analysis stages" />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {PIPELINE_STEPS.map((step, i) => {
                    const done = processed || i < currentStep;
                    const active = processing && i === currentStep;
                    const c = done ? COLORS.success : active ? COLORS.accent : COLORS.border;
                    return (
                      <div key={step} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: done ? COLORS.successGlow : active ? COLORS.accentGlow : COLORS.surfaceAlt, border: `1.5px solid ${c}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s", boxShadow: active ? `0 0 8px ${COLORS.accent}88` : "none" }}>
                          <span style={{ fontSize: 9, color: c }}>{done ? "✓" : i + 1}</span>
                        </div>
                        <span style={{ fontSize: 12, color: done ? COLORS.success : active ? COLORS.accent : COLORS.textMuted, transition: "all 0.3s", fontWeight: active ? 600 : 400 }}>{step}</span>
                        {active && <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.accent, animation: "pulseGlow 0.8s ease-in-out infinite alternate", marginLeft: "auto" }} />}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* Right: Upload History */}
          <div>
            <Card>
              <SectionTitle title="Upload History" sub={`${UPLOAD_HISTORY.length} sessions`} />
              {UPLOAD_HISTORY.map((h, i) => (
                <div key={h.id} style={{ padding: "10px 12px", borderRadius: 10, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.text, margin: 0 }}>{h.name}</p>
                    <Badge label={h.status === "analyzed" ? "DONE" : "PARTIAL"} color={h.status === "analyzed" ? COLORS.success : COLORS.warning} />
                  </div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: "monospace" }}>{h.size}</span>
                    <span style={{ fontSize: 10, color: COLORS.textMuted }}>·</span>
                    <span style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: "monospace" }}>{h.duration}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: COLORS.textMuted }}>{h.date}</span>
                    <span style={{ fontSize: 10, color: h.events > 0 ? COLORS.danger : COLORS.success, fontFamily: "monospace" }}>
                      {h.events > 0 ? `⚡ ${h.events} event${h.events > 1 ? "s" : ""}` : "✓ Clean"}
                    </span>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE: ANALYTICS
// ─────────────────────────────────────────────
function AnalyticsPage() {
  return (
    <div style={{ padding: "20px 24px", flex: 1, overflow: "auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, margin: "0 0 4px" }}>Analytics</h1>
        <p style={{ fontSize: 11, color: COLORS.textMuted, margin: 0, fontFamily: "monospace" }}>Patient {PATIENT.id} · Session data analysis</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Sessions" value="14" color={COLORS.accent} />
        <StatCard label="Seizures (30d)" value="4" color={COLORS.danger} delta={-33} />
        <StatCard label="Risk-Free Days" value="18" color={COLORS.success} />
        <StatCard label="Avg. Risk Score" value="24%" color={COLORS.warning} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Daily Risk Graph */}
        <Card>
          <SectionTitle title="Daily Risk Score" sub="Jun 01, 2025 — 24h trace" />
          <DailyRiskChart />
        </Card>

        {/* Weekly Seizure Count */}
        <Card>
          <SectionTitle title="Weekly Seizure Count" sub="Last 7 days" />
          <WeeklyBarChart />
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Brain Wave Distribution */}
        <Card>
          <SectionTitle title="Brain Wave Distribution" sub="Dominant frequency bands" />
          <BrainwaveDistChart />
        </Card>

        {/* Monthly Trend */}
        <Card style={{ gridColumn: "span 2" }}>
          <SectionTitle title="Monthly Prediction Accuracy" sub="Predicted vs. actual seizure events" />
          <MonthlyTrendChart />
        </Card>
      </div>

      {/* Activity Summary */}
      <Card>
        <SectionTitle title="Patient Activity Summary" sub="Session-level metrics — last 30 days" />
        <ActivitySummaryTable />
      </Card>

      {/* Signal Pipeline */}
      <div style={{ marginTop: 20 }}>
        <BrainSignalPipeline />
      </div>
    </div>
  );
}

function DailyRiskChart() {
  const max = Math.max(...DAILY_RISK.map(d => d.v));
  const w = 480, h = 120, padL = 10, padR = 10, padT = 10, padB = 20;
  const iw = w - padL - padR, ih = h - padT - padB;
  const pts = DAILY_RISK.map((d, i) => {
    const x = padL + (i / (DAILY_RISK.length - 1)) * iw;
    const y = padT + ih - (d.v / max) * ih;
    return `${x},${y}`;
  });
  const area = `M${pts[0]} L${pts.join(" L")} L${padL + iw},${padT + ih} L${padL},${padT + ih} Z`;
  const line = `M${pts[0]} L${pts.join(" L")}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", overflow: "visible" }}>
      <defs>
        <linearGradient id="riskAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.accent} stopOpacity="0.4" />
          <stop offset="100%" stopColor={COLORS.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[25, 50, 75].map(v => (
        <line key={v} x1={padL} x2={padL + iw} y1={padT + ih - (v / max) * ih} y2={padT + ih - (v / max) * ih}
          stroke={COLORS.border} strokeWidth="0.5" strokeDasharray="3 3" />
      ))}
      <path d={area} fill="url(#riskAreaGrad)" />
      <path d={line} fill="none" stroke={COLORS.accent} strokeWidth="1.5" strokeLinejoin="round" />
      {DAILY_RISK.filter((_, i) => i % 3 === 0).map((d, i) => {
        const idx = i * 3;
        const x = padL + (idx / (DAILY_RISK.length - 1)) * iw;
        return <text key={i} x={x} y={h - 4} textAnchor="middle" fontSize="7" fill={COLORS.textMuted} fontFamily="monospace">{d.h}</text>;
      })}
      {/* Seizure spike marker */}
      {DAILY_RISK.map((d, i) => d.v > 80 ? (
        <circle key={i} cx={padL + (i / (DAILY_RISK.length - 1)) * iw} cy={padT + ih - (d.v / max) * ih} r={4} fill={COLORS.danger} opacity={0.9} />
      ) : null)}
    </svg>
  );
}

function WeeklyBarChart() {
  const maxC = Math.max(...WEEKLY_SEIZURES.map(d => d.count), 1);
  const barW = 28, gap = 14, h = 120, padB = 20;

  return (
    <svg viewBox={`0 0 ${WEEKLY_SEIZURES.length * (barW + gap)} ${h}`} style={{ width: "100%", height: 120 }}>
      {WEEKLY_SEIZURES.map((d, i) => {
        const x = i * (barW + gap);
        const barH = d.count === 0 ? 4 : (d.count / maxC) * (h - padB - 10);
        const y = h - padB - barH;
        const color = d.count === 0 ? COLORS.success : d.count === 1 ? COLORS.warning : COLORS.danger;
        return (
          <g key={d.day}>
            <rect x={x} y={y} width={barW} height={barH} rx={4} fill={color} opacity={0.8} />
            <rect x={x} y={y} width={barW} height={Math.min(barH, 4)} rx={4} fill={color} />
            <text x={x + barW / 2} y={h - 6} textAnchor="middle" fontSize="9" fill={COLORS.textMuted} fontFamily="monospace">{d.day}</text>
            {d.count > 0 && <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="9" fill={color} fontFamily="monospace" fontWeight="700">{d.count}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function BrainwaveDistChart() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
      {BRAINWAVE_DIST.map(b => (
        <div key={b.band}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: COLORS.textSub }}>{b.band}</span>
            <span style={{ fontSize: 11, color: b.color, fontFamily: "monospace", fontWeight: 600 }}>{b.pct}%</span>
          </div>
          <ProgressBar value={b.pct} color={b.color} height={7} />
        </div>
      ))}
    </div>
  );
}

function MonthlyTrendChart() {
  const max = 5;
  const h = 130, padT = 16, padB = 24, padL = 10, padR = 10;
  const iw = 560 - padL - padR;
  const ih = h - padT - padB;

  const pts = (key) => MONTHLY_TREND.map((d, i) => {
    const x = padL + (i / (MONTHLY_TREND.length - 1)) * iw;
    const y = padT + ih - (d[key] / max) * ih;
    return `${x},${y}`;
  }).join(" L ");

  return (
    <svg viewBox={`0 0 560 ${h}`} style={{ width: "100%", overflow: "visible" }}>
      {[1, 2, 3, 4].map(v => (
        <line key={v} x1={padL} x2={padL + iw} y1={padT + ih - (v / max) * ih} y2={padT + ih - (v / max) * ih}
          stroke={COLORS.border} strokeWidth="0.5" strokeDasharray="3 3" />
      ))}
      <path d={`M${pts("pred")}`} fill="none" stroke={COLORS.accent} strokeWidth="2" strokeLinejoin="round" strokeDasharray="6 3" />
      <path d={`M${pts("actual")}`} fill="none" stroke={COLORS.danger} strokeWidth="2" strokeLinejoin="round" />
      {MONTHLY_TREND.map((d, i) => {
        const x = padL + (i / (MONTHLY_TREND.length - 1)) * iw;
        return (
          <g key={d.month}>
            <circle cx={x} cy={padT + ih - (d.pred / max) * ih} r={3} fill={COLORS.accent} />
            <circle cx={x} cy={padT + ih - (d.actual / max) * ih} r={3} fill={COLORS.danger} />
            <text x={x} y={h - 6} textAnchor="middle" fontSize="8" fill={COLORS.textMuted} fontFamily="monospace">{d.month}</text>
          </g>
        );
      })}
      <circle cx={padL + iw - 20} cy={12} r={4} fill={COLORS.accent} />
      <text x={padL + iw - 14} y={16} fontSize="9" fill={COLORS.accent} fontFamily="monospace">Predicted</text>
      <circle cx={padL + iw + 55} cy={12} r={4} fill={COLORS.danger} />
      <text x={padL + iw + 61} y={16} fontSize="9" fill={COLORS.danger} fontFamily="monospace">Actual</text>
    </svg>
  );
}

function ActivitySummaryTable() {
  const rows = [
    ["Jun 01", "4h 32m", "87", "1", "Analyzed", COLORS.danger],
    ["May 28", "3h 51m", "32", "0", "Analyzed", COLORS.success],
    ["May 20", "5h 04m", "72", "2", "Analyzed", COLORS.danger],
    ["May 12", "3h 12m", "28", "0", "Partial", COLORS.warning],
    ["May 05", "4h 18m", "44", "0", "Analyzed", COLORS.success],
  ];
  const headers = ["Date", "Duration", "Peak Risk", "Seizures", "Status"];

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} style={{ fontSize: 10, color: COLORS.textMuted, textAlign: "left", padding: "6px 12px", borderBottom: `1px solid ${COLORS.border}`, letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([date, dur, risk, sz, status, color], i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}44` }}>
              <td style={{ fontSize: 12, color: COLORS.text, padding: "10px 12px", fontFamily: "monospace" }}>{date}</td>
              <td style={{ fontSize: 12, color: COLORS.textSub, padding: "10px 12px", fontFamily: "monospace" }}>{dur}</td>
              <td style={{ fontSize: 12, color: color, padding: "10px 12px", fontFamily: "monospace", fontWeight: 600 }}>{risk}%</td>
              <td style={{ fontSize: 12, color: sz === "0" ? COLORS.success : COLORS.danger, padding: "10px 12px", fontFamily: "monospace", fontWeight: 600 }}>{sz}</td>
              <td style={{ padding: "10px 12px" }}><Badge label={status.toUpperCase()} color={status === "Analyzed" ? COLORS.success : COLORS.warning} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENT: BRAIN SIGNAL PIPELINE
// ─────────────────────────────────────────────
function BrainSignalPipeline() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveStep(p => (p + 1) % 7), 1200);
    return () => clearInterval(t);
  }, []);

  const STEPS = [
    { icon: "📡", label: "EEG Signal", sub: "Raw 256Hz input", color: COLORS.accent },
    { icon: "🔧", label: "Preprocessing", sub: "Artifact removal", color: COLORS.textSub },
    { icon: "🔬", label: "Feature Extraction", sub: "Band-power, entropy", color: COLORS.purple },
    { icon: "🤖", label: "AI Model", sub: "ONNX neural net", color: COLORS.warning },
    { icon: "🧠", label: "Brain State", sub: "Classification", color: COLORS.success },
    { icon: "⚖️", label: "Risk Assessment", sub: "Probability score", color: COLORS.warning },
    { icon: "🚨", label: "Emergency Alert", sub: "Caregiver notify", color: COLORS.danger },
  ];

  return (
    <Card>
      <SectionTitle title="Brain Signal Processing Pipeline" sub="Animated AI inference flow" />
      <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", paddingBottom: 8 }}>
        {STEPS.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 16px",
              borderRadius: 12, minWidth: 100,
              background: activeStep === i ? step.color + "22" : COLORS.surfaceAlt,
              border: `1.5px solid ${activeStep === i ? step.color : COLORS.border}`,
              transition: "all 0.4s cubic-bezier(.4,0,.2,1)",
              boxShadow: activeStep === i ? `0 0 16px ${step.color}44` : "none",
              transform: activeStep === i ? "translateY(-3px)" : "none",
            }}>
              <span style={{ fontSize: 22, marginBottom: 6 }}>{step.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: activeStep === i ? step.color : COLORS.text, textAlign: "center", lineHeight: 1.3 }}>{step.label}</span>
              <span style={{ fontSize: 9, color: COLORS.textMuted, textAlign: "center", marginTop: 3 }}>{step.sub}</span>
              {activeStep === i && (
                <div style={{ marginTop: 6, width: 6, height: 6, borderRadius: "50%", background: step.color, animation: "pulseGlow 0.6s ease-in-out infinite alternate" }} />
              )}
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 4px" }}>
                <div style={{ width: 24, height: 2, background: activeStep > i ? COLORS.accent : COLORS.border, transition: "background 0.4s", boxShadow: activeStep > i ? `0 0 6px ${COLORS.accent}66` : "none" }} />
                <span style={{ fontSize: 12, color: activeStep > i ? COLORS.accent : COLORS.border, lineHeight: 1, marginTop: -1 }}>▶</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
// PAGE: ALERTS
// ─────────────────────────────────────────────
function AlertsPage() {
  const [alerts, setAlerts] = useState(ALERT_LOG);

  const ackAll = () => setAlerts(a => a.map(x => ({ ...x, acked: true })));

  return (
    <div style={{ padding: "20px 24px", flex: 1, overflow: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, margin: "0 0 4px" }}>Caregiver Alerts</h1>
          <p style={{ fontSize: 11, color: COLORS.textMuted, margin: 0, fontFamily: "monospace" }}>{alerts.filter(a => !a.acked).length} unread · {alerts.length} total</p>
        </div>
        <button onClick={ackAll} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, color: COLORS.textSub }}>Mark all read</button>
      </div>

      <div style={{ maxWidth: 700, display: "flex", flexDirection: "column", gap: 8 }}>
        {alerts.map(a => <AlertItem key={a.id} alert={a} />)}
      </div>

      <div style={{ marginTop: 24, maxWidth: 700 }}>
        <BrainSignalPipeline />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE: SETTINGS
// ─────────────────────────────────────────────
function SettingsPage() {
  const [toggles, setToggles] = useState({
    smsAlerts: true, emailAlerts: false, autoEscalate: true,
    darkMode: true, animations: true, highContrast: false,
  });

  const toggle = (key) => setToggles(t => ({ ...t, [key]: !t[key] }));

  const Toggle = ({ label, sub, k }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${COLORS.border}44` }}>
      <div>
        <p style={{ fontSize: 13, color: COLORS.text, margin: "0 0 2px", fontWeight: 500 }}>{label}</p>
        {sub && <p style={{ fontSize: 10, color: COLORS.textMuted, margin: 0 }}>{sub}</p>}
      </div>
      <div onClick={() => toggle(k)} style={{ width: 40, height: 22, borderRadius: 11, background: toggles[k] ? COLORS.accent : COLORS.border, cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: 3, left: toggles[k] ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
      </div>
    </div>
  );

  return (
    <div style={{ padding: "20px 24px", flex: 1, overflow: "auto" }}>
      <div style={{ maxWidth: 680 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, margin: "0 0 20px" }}>Settings</h1>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <SectionTitle title="Alert Preferences" />
            <Toggle label="SMS Caregiver Alerts" sub="Send text message when seizure risk > 70%" k="smsAlerts" />
            <Toggle label="Email Notifications" sub="Daily session summary to neurologist" k="emailAlerts" />
            <Toggle label="Auto-escalate to Emergency" sub="Call services if caregiver doesn't respond in 5 min" k="autoEscalate" />
          </Card>
          <Card>
            <SectionTitle title="Display" />
            <Toggle label="Dark Mode" sub="Dark medical UI theme" k="darkMode" />
            <Toggle label="Animations" sub="Enable EEG waveform and UI animations" k="animations" />
            <Toggle label="High Contrast Mode" sub="Accessibility — WCAG 2.1 AA" k="highContrast" />
          </Card>
          <Card>
            <SectionTitle title="System Info" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                ["Platform", "NeuroGuard BCI v2.0"],
                ["AI Model", "SeizureNet ONNX v3.1.2"],
                ["EEG Protocol", "CHB-MIT · 256 Hz · 8-channel"],
                ["Session ID", "NGS-20250601-0042"],
                ["Last Sync", "Jun 01, 2025 · 14:32 UTC"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${COLORS.border}33` }}>
                  <span style={{ fontSize: 11, color: COLORS.textMuted }}>{k}</span>
                  <span style={{ fontSize: 11, color: COLORS.textSub, fontFamily: "monospace" }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENT: EMERGENCY POPUP
// ─────────────────────────────────────────────
function EmergencyModal({ brainState, riskLevel, onClose }) {
  const [notified, setNotified] = useState(false);
  const [called, setCalled] = useState(false);
  const now = new Date().toLocaleTimeString("en-US", { hour12: false });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Overlay */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }} />
      {/* Pulsing danger bg */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, ${COLORS.danger}11 0%, transparent 60%)`, animation: "pulseGlow 1s ease-in-out infinite alternate" }} />

      <div style={{ position: "relative", width: "100%", maxWidth: 520, margin: "0 24px" }}>
        {/* Top strip */}
        <div style={{ background: COLORS.danger, borderRadius: "16px 16px 0 0", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🚨</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "0.05em" }}>PATIENT ALERT</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: "rgba(255,255,255,0.2)" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", animation: "pulseGlow 0.8s ease-in-out infinite alternate" }} />
            <span style={{ fontSize: 10, color: "#fff", fontFamily: "monospace" }}>LIVE</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.danger}66`, borderTop: "none", borderRadius: "0 0 16px 16px", padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Patient ID", value: PATIENT.id, color: COLORS.text },
              { label: "Current Time", value: now, color: COLORS.accent },
              { label: "Risk Score", value: `${riskLevel}%`, color: COLORS.danger },
              { label: "Brain State", value: "Seizure Activity", color: COLORS.danger },
              { label: "Current Status", value: "EMERGENCY", color: COLORS.danger },
              { label: "Patient", value: PATIENT.name, color: COLORS.text },
            ].map(item => (
              <div key={item.label} style={{ padding: "10px 12px", borderRadius: 10, background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}` }}>
                <p style={{ fontSize: 9, color: COLORS.textMuted, margin: "0 0 4px", letterSpacing: "0.1em", textTransform: "uppercase" }}>{item.label}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: item.color, margin: 0, fontFamily: "monospace" }}>{item.value}</p>
              </div>
            ))}
          </div>

          <div style={{ padding: "12px 14px", borderRadius: 10, background: COLORS.dangerGlow, border: `1px solid ${COLORS.danger}44`, marginBottom: 20 }}>
            <p style={{ fontSize: 11, color: COLORS.danger, margin: 0, lineHeight: 1.5 }}>
              ⚡ High-amplitude polyspike discharge detected across F3/F4/C3 channels. Duration: 18s. Immediate caregiver response required.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button onClick={() => setNotified(true)} style={{ padding: "11px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", background: notified ? COLORS.successGlow : COLORS.warningGlow, border: `1px solid ${notified ? COLORS.success : COLORS.warning}66`, color: notified ? COLORS.success : COLORS.warning, transition: "all 0.2s" }}>
              {notified ? "✓ Notified" : "📲 Notify Caregiver"}
            </button>
            <button onClick={() => setCalled(true)} style={{ padding: "11px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", background: called ? COLORS.successGlow : COLORS.dangerGlow, border: `1px solid ${called ? COLORS.success : COLORS.danger}66`, color: called ? COLORS.success : COLORS.danger, transition: "all 0.2s" }}>
              {called ? "✓ Called" : "📞 Call Emergency"}
            </button>
            <button style={{ padding: "11px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", background: COLORS.accentGlow, border: `1px solid ${COLORS.accent}44`, color: COLORS.accent }}>
              📈 View EEG
            </button>
            <button onClick={onClose} style={{ padding: "11px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", background: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}`, color: COLORS.textSub }}>
              ✕ Close Alert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE HEADER (shared)
// ─────────────────────────────────────────────
function PageHeader({ title, sub, brainState, riskLevel, onEmergency }) {
  const state = BRAIN_STATES.find(s => s.id === brainState) || BRAIN_STATES[0];
  return (
    <header style={{ padding: "16px 24px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: COLORS.surface, flexShrink: 0 }}>
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: "-0.02em", color: COLORS.text }}>{title}</h1>
        <p style={{ fontSize: 11, color: COLORS.textMuted, margin: "2px 0 0", fontFamily: "monospace" }}>{sub}</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ padding: "5px 10px", borderRadius: 8, background: state.bg, border: `1px solid ${state.color}44`, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12 }}>{state.icon}</span>
          <span style={{ fontSize: 11, color: state.color, fontFamily: "monospace" }}>{state.label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8, background: COLORS.successGlow, border: `1px solid ${COLORS.success}44` }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.success, boxShadow: `0 0 5px ${COLORS.success}`, animation: "pulseGlow 1.5s ease-in-out infinite alternate" }} />
          <span style={{ fontSize: 11, color: COLORS.success, fontFamily: "monospace" }}>LIVE</span>
        </div>
        <button onClick={onEmergency} style={{ background: COLORS.dangerGlow, border: `1px solid ${COLORS.danger}44`, borderRadius: 8, padding: "5px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: COLORS.danger, fontWeight: 600 }}>🚨 Emergency</span>
        </button>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────
// ROOT APP — NeuroGuard BCI Phase 2
// ─────────────────────────────────────────────
export default function NeuroGuardBCI() {
  const [view, setView] = useState("landing");
  const [activeNav, setActiveNav] = useState("dashboard");
  const [brainState, setBrainState] = useState("normal");
  const [riskLevel, setRiskLevel] = useState(22);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const waveData = useEEGSimulator(brainState);

  // Auto-trigger emergency when seizure state is active
  useEffect(() => {
    if (brainState === "seizure") {
      const t = setTimeout(() => setShowEmergency(true), 1200);
      return () => clearTimeout(t);
    }
  }, [brainState]);

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

  const clampedRisk = Math.max(0, Math.min(100, riskLevel));

  // Page titles
  const pageMeta = {
    dashboard: ["Patient Dashboard", `Patient: ${PATIENT.name} · ${PATIENT.id} · Session 14`],
    profile: ["Patient Profile", `${PATIENT.name} · ${PATIENT.id} · ${PATIENT.epilepsyType}`],
    eeg: ["Live EEG Monitor", "256 Hz · 8-channel · CHB-MIT Protocol"],
    eegupload: ["EEG Upload", "Upload & analyze EEG session files"],
    analytics: ["Analytics", `${PATIENT.id} · Data insights & trends`],
    alerts: ["Caregiver Alerts", "Real-time alert management"],
    settings: ["Settings", "System configuration"],
  };

  if (view === "landing") return (
    <>
      <LandingPage onEnter={() => setView("dashboard")} />
      <style>{`@keyframes pulseGlow { from { opacity: 0.6; transform: scale(0.97); } to { opacity: 1; transform: scale(1.03); } } * { box-sizing: border-box; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #1a2d4a; border-radius: 2px; }`}</style>
    </>
  );

  const [pageTitle, pageSub] = pageMeta[activeNav] || pageMeta.dashboard;

  return (
    <div style={{ display: "flex", height: "100vh", background: COLORS.bg, color: COLORS.text, fontFamily: "'Inter', system-ui, sans-serif", overflow: "hidden" }}>
      <Sidebar active={activeNav} onNav={setActiveNav} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} />

      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <PageHeader title={pageTitle} sub={pageSub} brainState={brainState} riskLevel={clampedRisk} onEmergency={() => setShowEmergency(true)} />

        {/* Page content routing */}
        {activeNav === "dashboard" && (
          <DashboardPage brainState={brainState} onStateChange={setBrainState} waveData={waveData} riskLevel={clampedRisk} />
        )}
        {activeNav === "profile" && <PatientProfilePage />}
        {activeNav === "eeg" && (
          <div style={{ flex: 1, padding: "20px 24px", overflow: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Card style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <SectionTitle title="Live EEG Monitor" sub="256 Hz · 8-channel · CHB-MIT Protocol" />
                    <div style={{ display: "flex", gap: 6 }}>
                      {BRAIN_STATES.map(s => (
                        <button key={s.id} onClick={() => setBrainState(s.id)} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, cursor: "pointer", background: brainState === s.id ? s.color + "22" : COLORS.surfaceAlt, border: `1px solid ${brainState === s.id ? s.color + "88" : COLORS.border}`, color: brainState === s.id ? s.color : COLORS.textSub, transition: "all 0.2s" }}>{s.label}</button>
                      ))}
                    </div>
                  </div>
                  {CHANNELS.map((ch, i) => (
                    <EEGChannel key={ch} data={waveData[i] || []} label={ch} color={[COLORS.accent, "#5eead4", "#a78bfa", "#fb7185", COLORS.accent, "#5eead4", "#a78bfa", "#fb7185"][i]} height={48} />
                  ))}
                </Card>
                <AIPredictionCard brainState={brainState} riskLevel={clampedRisk} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <BrainStateCard stateId={brainState} />
                <Card>
                  <SectionTitle title="Seizure Risk" sub="AI confidence: 94%" />
                  <SeizureRiskMeter risk={clampedRisk} />
                </Card>
                <BrainHealthScoreCard />
              </div>
            </div>
          </div>
        )}
        {activeNav === "eegupload" && <EEGUploadPage />}
        {activeNav === "analytics" && <AnalyticsPage />}
        {activeNav === "alerts" && <AlertsPage />}
        {activeNav === "settings" && <SettingsPage />}
      </main>

      {/* Emergency Modal */}
      {showEmergency && (
        <EmergencyModal brainState={brainState} riskLevel={clampedRisk} onClose={() => setShowEmergency(false)} />
      )}

      <style>{`
        @keyframes pulseGlow {
          from { opacity: 0.6; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1.03); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }
        button { font-family: inherit; }
      `}</style>
    </div>
  );
}
