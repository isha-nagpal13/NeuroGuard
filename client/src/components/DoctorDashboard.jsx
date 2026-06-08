import { useState, useEffect, useRef } from "react";

// ── Palette & constants ────────────────────────────────────────────────────────
const C = {
  bg0: "#07090f",
  bg1: "#0d1117",
  bg2: "#121820",
  bg3: "#1a2230",
  border: "rgba(56,180,255,0.13)",
  borderHover: "rgba(56,180,255,0.28)",
  text: "#e2eaf5",
  muted: "#6b8099",
  accent: "#38b4ff",
  accentDim: "rgba(56,180,255,0.12)",
  green: "#22d98a",
  greenDim: "rgba(34,217,138,0.12)",
  amber: "#f6a623",
  amberDim: "rgba(246,166,35,0.12)",
  red: "#ff4f62",
  redDim: "rgba(255,79,98,0.12)",
  purple: "#a78bfa",
  purpleDim: "rgba(167,139,250,0.12)",
  teal: "#2dd4bf",
  tealDim: "rgba(45,212,191,0.12)",
};

// ── Mock data ──────────────────────────────────────────────────────────────────
const PATIENTS = [
  {
    id: "P-001",
    name: "Arjun Mehta",
    age: 34,
    diagnosis: "Focal Epilepsy",
    state: "Normal",
    risk: "Low",
    sessions: 42,
    lastSeen: "2 hrs ago",
    seizures7d: 0,
    avatar: "AM",
  },
  {
    id: "P-002",
    name: "Priya Sharma",
    age: 27,
    diagnosis: "Generalised Epilepsy",
    state: "Pre-ictal",
    risk: "High",
    sessions: 61,
    lastSeen: "14 min ago",
    seizures7d: 3,
    avatar: "PS",
  },
  {
    id: "P-003",
    name: "Rohan Verma",
    age: 52,
    diagnosis: "Absence Seizure",
    state: "Normal",
    risk: "Medium",
    sessions: 18,
    lastSeen: "1 day ago",
    seizures7d: 1,
    avatar: "RV",
  },
  {
    id: "P-004",
    name: "Neha Joshi",
    age: 41,
    diagnosis: "PNES",
    state: "Ictal",
    risk: "Critical",
    sessions: 29,
    lastSeen: "Now",
    seizures7d: 5,
    avatar: "NJ",
  },
];

const SEIZURE_HISTORY = [
  { date: "Jun 07 04:12", duration: "38s", type: "Tonic-Clonic", severity: "Severe", conf: 97 },
  { date: "Jun 05 22:44", duration: "12s", type: "Absence", severity: "Mild", conf: 89 },
  { date: "Jun 04 08:33", duration: "25s", type: "Focal", severity: "Moderate", conf: 93 },
  { date: "Jun 01 17:09", duration: "19s", type: "Tonic-Clonic", severity: "Moderate", conf: 91 },
  { date: "May 29 03:55", duration: "44s", type: "Tonic-Clonic", severity: "Severe", conf: 98 },
];

const BANDS = [
  { name: "Delta", range: "0.5–4 Hz", value: 18, norm: [15, 25], color: C.purple, dim: C.purpleDim },
  { name: "Theta", range: "4–8 Hz", value: 22, norm: [10, 20], color: C.teal, dim: C.tealDim },
  { name: "Alpha", range: "8–13 Hz", value: 31, norm: [25, 40], color: C.accent, dim: C.accentDim },
  { name: "Beta", range: "13–30 Hz", value: 20, norm: [15, 30], color: C.green, dim: C.greenDim },
  { name: "Gamma", range: "30–100 Hz", value: 9, norm: [5, 15], color: C.amber, dim: C.amberDim },
];

const MODEL_METRICS = [
  { label: "Accuracy", value: "97.4%", sub: "+0.3% this week" },
  { label: "Sensitivity", value: "96.1%", sub: "True positive rate" },
  { label: "Specificity", value: "98.2%", sub: "True negative rate" },
  { label: "F1-Score", value: "0.968", sub: "Harmonic mean" },
  { label: "Latency", value: "34ms", sub: "Avg. inference time" },
  { label: "AUC-ROC", value: "0.991", sub: "Classification area" },
];

const SESSIONS = [
  { id: "S-062", date: "Jun 07, 2026", duration: "48 min", events: 2, state: "Pre-ictal detected" },
  { id: "S-061", date: "Jun 06, 2026", duration: "1h 2min", events: 0, state: "Normal" },
  { id: "S-060", date: "Jun 05, 2026", duration: "55 min", events: 1, state: "Absence recorded" },
  { id: "S-059", date: "Jun 04, 2026", duration: "38 min", events: 3, state: "Ictal + post-ictal" },
  { id: "S-058", date: "Jun 03, 2026", duration: "1h 11min", events: 0, state: "Normal" },
];

// ── Tiny sparkline for band bars ───────────────────────────────────────────────
function BandBar({ band, liveOffset }) {
  const pct = Math.min(100, ((band.value + liveOffset * 0.4) / 50) * 100);
  const inRange = band.value + liveOffset * 0.4 >= band.norm[0] && band.value + liveOffset * 0.4 <= band.norm[1];
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: band.color, letterSpacing: "0.04em" }}>
          {band.name}
        </span>
        <span style={{ fontSize: 12, color: C.muted }}>{band.range}</span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: inRange ? C.green : C.amber,
            background: inRange ? C.greenDim : C.amberDim,
            padding: "1px 7px",
            borderRadius: 20,
          }}
        >
          {(band.value + liveOffset * 0.4).toFixed(1)}%
        </span>
      </div>
      <div
        style={{
          height: 7,
          background: C.bg3,
          borderRadius: 10,
          overflow: "hidden",
          border: `0.5px solid ${C.border}`,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: band.color,
            borderRadius: 10,
            transition: "width 0.8s ease",
            opacity: 0.85,
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span style={{ fontSize: 10, color: C.muted }}>Normal: {band.norm[0]}–{band.norm[1]}%</span>
        {!inRange && (
          <span style={{ fontSize: 10, color: C.amber }}>⚠ Outside normal</span>
        )}
      </div>
    </div>
  );
}

// ── Mini EEG sparkline ─────────────────────────────────────────────────────────
function MiniEEG({ color = C.accent, active = false }) {
  const pts = Array.from({ length: 60 }, (_, i) => {
    const base = Math.sin(i * 0.3) * 8 + Math.sin(i * 1.1) * 3;
    const spike = active && i > 40 && i < 48 ? (i === 44 ? 22 : Math.abs(i - 44) < 3 ? 12 : 4) : 0;
    return 20 - base - spike;
  });
  const path = pts.map((y, x) => `${x === 0 ? "M" : "L"}${x * (220 / 59)},${y}`).join(" ");
  return (
    <svg viewBox="0 0 220 40" width="100%" height="36" preserveAspectRatio="none">
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── State badge ────────────────────────────────────────────────────────────────
function StateBadge({ state }) {
  const map = {
    Normal: { color: C.green, bg: C.greenDim },
    "Pre-ictal": { color: C.amber, bg: C.amberDim },
    Ictal: { color: C.red, bg: C.redDim },
    "Post-ictal": { color: C.purple, bg: C.purpleDim },
    Critical: { color: C.red, bg: C.redDim },
  };
  const { color, bg } = map[state] || { color: C.muted, bg: C.bg2 };
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        color,
        background: bg,
        border: `0.5px solid ${color}44`,
        padding: "2px 8px",
        borderRadius: 20,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      {state}
    </span>
  );
}

// ── Risk badge ─────────────────────────────────────────────────────────────────
function RiskBadge({ risk }) {
  const map = {
    Low: C.green,
    Medium: C.amber,
    High: C.red,
    Critical: C.red,
  };
  return (
    <span style={{ fontSize: 11, color: map[risk] || C.muted, fontWeight: 700 }}>{risk}</span>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, right }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16, color: C.accent }}>{icon}</span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: C.text,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </span>
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

// ── Card wrapper ───────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: C.bg2,
        border: `0.5px solid ${C.border}`,
        borderRadius: 14,
        padding: "18px 20px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── PDF "Report" button ────────────────────────────────────────────────────────
function PDFButton({ patient }) {
  const [state, setState] = useState("idle");
  const handleClick = () => {
    setState("loading");
    setTimeout(() => {
      setState("done");
      setTimeout(() => setState("idle"), 2000);
    }, 1600);
  };
  return (
    <button
      onClick={handleClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "8px 16px",
        background: state === "done" ? C.greenDim : C.accentDim,
        border: `0.5px solid ${state === "done" ? C.green + "88" : C.accent + "88"}`,
        borderRadius: 8,
        color: state === "done" ? C.green : C.accent,
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        letterSpacing: "0.05em",
        transition: "all 0.2s",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {state === "done" ? (
          <path d="M5 13l4 4L19 7" />
        ) : (
          <>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="12" y1="12" x2="12" y2="18" />
            <polyline points="9,15 12,18 15,15" />
          </>
        )}
      </svg>
      {state === "loading" ? "Generating…" : state === "done" ? "Downloaded" : "Export PDF Report"}
    </button>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const [activePatient, setActivePatient] = useState(PATIENTS[1]);
  const [liveOffset, setLiveOffset] = useState(0);
  const [tick, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const id = setInterval(() => {
      setLiveOffset((Math.random() - 0.5) * 4);
      setTick((t) => t + 1);
    }, 1400);
    return () => clearInterval(id);
  }, []);

  const riskCounts = {
    Low: PATIENTS.filter((p) => p.risk === "Low").length,
    Medium: PATIENTS.filter((p) => p.risk === "Medium").length,
    High: PATIENTS.filter((p) => p.risk === "High").length,
    Critical: PATIENTS.filter((p) => p.risk === "Critical").length,
  };

  const tabs = ["overview", "brain waves", "model", "sessions"];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg0,
        color: C.text,
        fontFamily: "'DM Mono', 'Fira Mono', 'Courier New', monospace",
        padding: "0 0 40px",
      }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          background: C.bg1,
          borderBottom: `0.5px solid ${C.border}`,
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M2 12h2M4 12c0-4.4 3.6-8 8-8M20 12h2M20 12c0 4.4-3.6 8-8 8" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M8 12h1l1.5-4 2 8 1.5-4H16" stroke={C.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: "0.05em" }}>
            NEUROGUARD <span style={{ color: C.accent }}>BCI</span>
          </span>
          <span
            style={{
              fontSize: 11,
              background: C.greenDim,
              color: C.green,
              border: `0.5px solid ${C.green}44`,
              padding: "2px 8px",
              borderRadius: 20,
              marginLeft: 4,
            }}
          >
            ● LIVE
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ fontSize: 12, color: C.muted }}>
            {new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: false })} IST
          </span>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: C.accentDim,
              border: `0.5px solid ${C.accent}66`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color: C.accent,
            }}
          >
            DR
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 28px 0" }}>
        {/* ── Summary strip ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {[
            { label: "Total Patients", value: PATIENTS.length, color: C.accent, icon: "👤" },
            { label: "Critical Alerts", value: riskCounts.Critical + riskCounts.High, color: C.red, icon: "⚠" },
            { label: "Active Sessions", value: 2, color: C.green, icon: "◎" },
            { label: "Seizures (7d)", value: PATIENTS.reduce((a, p) => a + p.seizures7d, 0), color: C.amber, icon: "⚡" },
          ].map((s) => (
            <Card key={s.label} style={{ padding: "14px 18px" }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, letterSpacing: "0.07em" }}>
                {s.icon} {s.label.toUpperCase()}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            </Card>
          ))}
        </div>

        {/* ── Main 2-col layout ── */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}>
          {/* ── Patient list ── */}
          <div>
            <Card style={{ padding: "14px 14px" }}>
              <SectionHeader icon="⊞" title="Patients" />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {PATIENTS.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setActivePatient(p)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: `0.5px solid ${activePatient.id === p.id ? C.accent + "88" : C.border}`,
                      background: activePatient.id === p.id ? C.accentDim : C.bg3,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background:
                            p.risk === "Critical" ? C.redDim : p.risk === "High" ? C.amberDim : C.accentDim,
                          border: `0.5px solid ${p.risk === "Critical" ? C.red + "66" : p.risk === "High" ? C.amber + "66" : C.accent + "44"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          color:
                            p.risk === "Critical" ? C.red : p.risk === "High" ? C.amber : C.accent,
                          flexShrink: 0,
                        }}
                      >
                        {p.avatar}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: C.text,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {p.name}
                        </div>
                        <div style={{ fontSize: 10, color: C.muted }}>{p.diagnosis}</div>
                      </div>
                      <StateBadge state={p.state} />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 7,
                        fontSize: 10,
                        color: C.muted,
                      }}
                    >
                      <span>{p.id}</span>
                      <span>{p.lastSeen}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── Right panel ── */}
          <div>
            {/* Patient header */}
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: C.accentDim,
                      border: `1px solid ${C.accent}66`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 700,
                      color: C.accent,
                    }}
                  >
                    {activePatient.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
                      {activePatient.name}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                      {activePatient.id} · Age {activePatient.age} · {activePatient.diagnosis}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>Current state</div>
                    <StateBadge state={activePatient.state} />
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>Risk</div>
                    <RiskBadge risk={activePatient.risk} />
                  </div>
                  <PDFButton patient={activePatient} />
                </div>
              </div>

              {/* Live EEG strip */}
              <div
                style={{
                  marginTop: 14,
                  background: C.bg3,
                  borderRadius: 8,
                  padding: "8px 12px",
                  border: `0.5px solid ${C.border}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                    fontSize: 10,
                    color: C.muted,
                  }}
                >
                  <span>LIVE EEG · CH1</span>
                  <span style={{ color: C.green }}>● streaming</span>
                </div>
                <MiniEEG
                  color={activePatient.state === "Ictal" ? C.red : activePatient.state === "Pre-ictal" ? C.amber : C.accent}
                  active={activePatient.state === "Ictal" || activePatient.state === "Pre-ictal"}
                />
              </div>
            </Card>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 8,
                    border: `0.5px solid ${activeTab === t ? C.accent + "88" : C.border}`,
                    background: activeTab === t ? C.accentDim : "transparent",
                    color: activeTab === t ? C.accent : C.muted,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    transition: "all 0.15s",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* ── Tab: overview ── */}
            {activeTab === "overview" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
                  {[
                    { label: "Total Sessions", value: activePatient.sessions, color: C.accent },
                    { label: "Seizures (7d)", value: activePatient.seizures7d, color: activePatient.seizures7d > 2 ? C.red : C.green },
                    { label: "Last Seen", value: activePatient.lastSeen, color: C.muted },
                  ].map((m) => (
                    <Card key={m.label} style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 6, letterSpacing: "0.07em" }}>
                        {m.label.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{m.value}</div>
                    </Card>
                  ))}
                </div>

                <Card>
                  <SectionHeader icon="⚡" title="Seizure History" />
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: `0.5px solid ${C.border}` }}>
                        {["Date & Time", "Duration", "Type", "Severity", "Confidence"].map((h) => (
                          <th
                            key={h}
                            style={{
                              textAlign: "left",
                              padding: "6px 10px",
                              color: C.muted,
                              fontWeight: 600,
                              fontSize: 10,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SEIZURE_HISTORY.map((row, i) => (
                        <tr
                          key={i}
                          style={{
                            borderBottom: `0.5px solid ${C.border}`,
                            background: i % 2 === 0 ? "transparent" : C.bg3 + "88",
                          }}
                        >
                          <td style={{ padding: "9px 10px", color: C.text }}>{row.date}</td>
                          <td style={{ padding: "9px 10px", color: C.accent }}>{row.duration}</td>
                          <td style={{ padding: "9px 10px", color: C.text }}>{row.type}</td>
                          <td style={{ padding: "9px 10px" }}>
                            <span
                              style={{
                                fontSize: 11,
                                color:
                                  row.severity === "Severe"
                                    ? C.red
                                    : row.severity === "Moderate"
                                    ? C.amber
                                    : C.green,
                                fontWeight: 700,
                              }}
                            >
                              {row.severity}
                            </span>
                          </td>
                          <td style={{ padding: "9px 10px", color: C.green, fontWeight: 700 }}>
                            {row.conf}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </>
            )}

            {/* ── Tab: brain waves ── */}
            {activeTab === "brain waves" && (
              <Card>
                <SectionHeader
                  icon="〰"
                  title="Brain Wave Band Power"
                  right={
                    <span style={{ fontSize: 11, color: C.green }}>
                      ● Live · updating every 1.4s
                    </span>
                  }
                />
                <div style={{ marginBottom: 18 }}>
                  {BANDS.map((b) => (
                    <BandBar key={b.name} band={b} liveOffset={liveOffset} />
                  ))}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: 8,
                    paddingTop: 12,
                    borderTop: `0.5px solid ${C.border}`,
                  }}
                >
                  {BANDS.map((b) => (
                    <div
                      key={b.name}
                      style={{
                        background: b.dim,
                        border: `0.5px solid ${b.color}44`,
                        borderRadius: 10,
                        padding: "8px 10px",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: b.color, marginBottom: 3 }}>
                        {b.name}
                      </div>
                      <div style={{ height: 28 }}>
                        <svg viewBox="0 0 60 28" width="100%" height="28">
                          {Array.from({ length: 30 }).map((_, i) => {
                            const y =
                              14 +
                              Math.sin(i * (0.5 + BANDS.indexOf(b) * 0.3) + tick * 0.2) *
                                (4 + BANDS.indexOf(b) * 1.5);
                            return i === 0 ? null : (
                              <line
                                key={i}
                                x1={(i - 1) * 2}
                                y1={
                                  14 +
                                  Math.sin((i - 1) * (0.5 + BANDS.indexOf(b) * 0.3) + tick * 0.2) *
                                    (4 + BANDS.indexOf(b) * 1.5)
                                }
                                x2={i * 2}
                                y2={y}
                                stroke={b.color}
                                strokeWidth="1"
                                opacity="0.8"
                              />
                            );
                          })}
                        </svg>
                      </div>
                      <div style={{ fontSize: 10, color: C.muted }}>{b.range}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* ── Tab: model ── */}
            {activeTab === "model" && (
              <Card>
                <SectionHeader icon="◈" title="Model Performance Summary" />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 12,
                    marginBottom: 20,
                  }}
                >
                  {MODEL_METRICS.map((m) => (
                    <div
                      key={m.label}
                      style={{
                        background: C.bg3,
                        borderRadius: 10,
                        padding: "14px 16px",
                        border: `0.5px solid ${C.border}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: C.muted,
                          marginBottom: 6,
                          letterSpacing: "0.07em",
                          textTransform: "uppercase",
                        }}
                      >
                        {m.label}
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: C.accent }}>{m.value}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{m.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Confusion matrix */}
                <div style={{ marginBottom: 18 }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: C.muted,
                      marginBottom: 10,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                    }}
                  >
                    Confusion Matrix (last 500 samples)
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr", gap: 4 }}>
                    {[
                      { label: "", v1: "Pred: Normal", v2: "Pred: Seizure" },
                      { label: "Act: Normal", v1: "244", v2: "6" },
                      { label: "Act: Seizure", v1: "7", v2: "243" },
                    ].map((row, i) => (
                      <div key={i} style={{ display: "contents" }}>
                        <div
                          style={{
                            padding: "8px 10px",
                            fontSize: 11,
                            color: C.muted,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {row.label}
                        </div>
                        {[row.v1, row.v2].map((v, j) => (
                          <div
                            key={j}
                            style={{
                              padding: "10px 14px",
                              borderRadius: 8,
                              background:
                                i === 0
                                  ? C.bg3
                                  : i === j + 1
                                  ? C.greenDim
                                  : C.redDim,
                              border: `0.5px solid ${
                                i === 0 ? C.border : i === j + 1 ? C.green + "44" : C.red + "44"
                              }`,
                              textAlign: "center",
                              fontSize: i === 0 ? 10 : 18,
                              fontWeight: i === 0 ? 600 : 700,
                              color:
                                i === 0 ? C.muted : i === j + 1 ? C.green : C.red,
                              letterSpacing: i === 0 ? "0.07em" : "0",
                              textTransform: i === 0 ? "uppercase" : "none",
                            }}
                          >
                            {v}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    background: C.bg3,
                    borderRadius: 10,
                    padding: "12px 16px",
                    border: `0.5px solid ${C.border}`,
                    display: "flex",
                    gap: 24,
                    flexWrap: "wrap",
                  }}
                >
                  {[
                    { k: "Architecture", v: "CNN-LSTM Hybrid" },
                    { k: "Input", v: "19-channel EEG" },
                    { k: "Window", v: "2s / 256 Hz" },
                    { k: "Classes", v: "Normal · Pre-ictal · Ictal · Post-ictal" },
                    { k: "Trained on", v: "CHB-MIT + in-house" },
                    { k: "Version", v: "v2.4.1" },
                  ].map((item) => (
                    <div key={item.k}>
                      <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.07em" }}>
                        {item.k.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 12, color: C.text, marginTop: 2, fontWeight: 600 }}>
                        {item.v}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* ── Tab: sessions ── */}
            {activeTab === "sessions" && (
              <Card>
                <SectionHeader
                  icon="◷"
                  title="Session Archive"
                  right={
                    <span style={{ fontSize: 11, color: C.muted }}>
                      {SESSIONS.length} recent sessions
                    </span>
                  }
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {SESSIONS.map((s, i) => (
                    <div
                      key={s.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: 10,
                        background: C.bg3,
                        border: `0.5px solid ${C.border}`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: C.accentDim,
                            border: `0.5px solid ${C.accent}44`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: 700,
                            color: C.accent,
                          }}
                        >
                          {s.id}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
                            {s.date}
                          </div>
                          <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>
                            Duration: {s.duration} · {s.events} event{s.events !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span
                          style={{
                            fontSize: 11,
                            color: s.events > 0 ? C.amber : C.green,
                            background: s.events > 0 ? C.amberDim : C.greenDim,
                            border: `0.5px solid ${s.events > 0 ? C.amber + "44" : C.green + "44"}`,
                            padding: "3px 10px",
                            borderRadius: 20,
                          }}
                        >
                          {s.state}
                        </span>
                        <button
                          style={{
                            background: "transparent",
                            border: `0.5px solid ${C.border}`,
                            borderRadius: 6,
                            color: C.muted,
                            fontSize: 11,
                            padding: "4px 10px",
                            cursor: "pointer",
                          }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 16,
                    padding: "12px 16px",
                    background: C.bg3,
                    borderRadius: 10,
                    border: `0.5px solid ${C.border}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 12, color: C.muted }}>
                    Showing 5 of {activePatient.sessions} total sessions
                  </span>
                  <button
                    style={{
                      background: C.accentDim,
                      border: `0.5px solid ${C.accent}66`,
                      borderRadius: 7,
                      color: C.accent,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "5px 14px",
                      cursor: "pointer",
                    }}
                  >
                    Load More
                  </button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
