import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────
   PHANTOMSHIELD — HOW IT WORKS
   Aesthetic: Classified SIGINT Dossier meets
   Industrial Process Schematic. Each step is
   a "OPERATION STAGE" card — sliced diagonally,
   oversized ghost numbers bleeding out of frame,
   redacted labels, animated data pipes, live
   signal bars. Think NSA meets brutalist print.
───────────────────────────────────────────── */

// ── Intersection observer hook ──────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

// ── Signal Bar (animated strength indicator) ─
function SignalBars({ strength = 3, color = "#22d3ee" }) {
  return (
    <div className="flex items-end gap-[3px]">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: 4 + i * 3,
            background: i <= strength ? color : "rgba(255,255,255,0.08)",
            borderRadius: 1,
            transition: `background 0.3s ease ${i * 60}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ── Redacted Label ────────────────────────────
function Redacted({ children, reveal = false }) {
  return (
    <span
      className="relative inline-block transition-all duration-500"
      style={{
        background: reveal ? "transparent" : "rgba(34,211,238,0.15)",
        color: reveal ? "inherit" : "transparent",
        borderRadius: 2,
        padding: "0 4px",
        userSelect: reveal ? "auto" : "none",
        filter: reveal ? "none" : "blur(0px)",
      }}
    >
      {children}
    </span>
  );
}

// ── Data Flow Pipe (animated dots) ───────────
function DataPipe({ active = true, color = "#22d3ee", vertical = false }) {
  const dots = 6;
  return (
    <div
      className={`flex ${vertical ? "flex-col items-center" : "items-center"} gap-1`}
      style={{ minWidth: vertical ? 12 : 48, minHeight: vertical ? 48 : 12 }}
    >
      {Array.from({ length: dots }).map((_, i) => (
        <div
          key={i}
          style={{
            width: vertical ? 2 : 6,
            height: vertical ? 6 : 2,
            borderRadius: 99,
            background: active ? color : "rgba(255,255,255,0.06)",
            animation: active ? `pipeDot 1.4s ease-in-out infinite` : "none",
            animationDelay: `${i * 0.18}s`,
            opacity: active ? 1 : 0.2,
          }}
        />
      ))}
    </div>
  );
}

// ── Code Snippet ──────────────────────────────
function CodeBlock({ lines, inView }) {
  const [revealed, setRevealed] = useState([]);
  useEffect(() => {
    if (!inView) return;
    lines.forEach((_, i) => {
      setTimeout(() => setRevealed((p) => [...p, i]), 300 + i * 220);
    });
  }, [inView]);

  return (
    <div
      className="rounded-sm p-3 flex flex-col gap-1"
      style={{
        background: "rgba(0,0,0,0.4)",
        border: "1px solid rgba(34,211,238,0.08)",
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 10,
      }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          className="flex gap-2 transition-all duration-300"
          style={{
            opacity: revealed.includes(i) ? 1 : 0,
            transform: revealed.includes(i) ? "none" : "translateX(-6px)",
            color: line.color || "rgba(34,211,238,0.7)",
            letterSpacing: "0.05em",
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.15)", minWidth: 14 }}>{i + 1}</span>
          <span>{line.text}</span>
        </div>
      ))}
    </div>
  );
}

// ── Stage Card ────────────────────────────────
function StageCard({ stage, index, total }) {
  const [ref, inView] = useInView(0.1);
  const [hovered, setHovered] = useState(false);
  const isEven = index % 2 === 0;
  const isDecoy = stage.type === "DECOY";
  const isCritical = stage.type === "CRITICAL";
  const accentColor = isDecoy
    ? "#ef4444"
    : isCritical
    ? "#f59e0b"
    : "#22d3ee";

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Ghost number — MASSIVE, bleeds off-screen */}
      <div
        className="absolute pointer-events-none select-none"
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "clamp(140px, 18vw, 220px)",
          fontWeight: 900,
          lineHeight: 1,
          top: "-0.1em",
          [isEven ? "left" : "right"]: "-0.08em",
          color: "transparent",
          WebkitTextStroke: `1px ${accentColor}12`,
          opacity: inView ? 1 : 0,
          transition: "opacity 0.8s ease",
          zIndex: 0,
          letterSpacing: "-0.05em",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>

      {/* Main card grid */}
      <div
        className={`relative z-10 grid items-start gap-0 transition-all duration-700 ${
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{
          transitionDelay: `${index * 60}ms`,
          gridTemplateColumns: isEven
            ? "1fr 2px 1.6fr"
            : "1.6fr 2px 1fr",
        }}
      >
        {/* LEFT PANEL */}
        <div
          className={`py-8 ${isEven ? "pr-10 text-right" : "pl-10"}`}
          style={{ order: isEven ? 0 : 2 }}
        >
          {/* Stage label */}
          <div
            className={`flex items-center gap-2 mb-3 ${
              isEven ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className="font-mono text-[9px] tracking-[0.3em] px-2 py-0.5 rounded-sm"
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                background: `${accentColor}12`,
                border: `1px solid ${accentColor}30`,
                color: accentColor,
              }}
            >
              STAGE {String(index + 1).padStart(2, "0")} · {stage.type}
            </div>
            <SignalBars strength={stage.signal} color={accentColor} />
          </div>

          {/* Title */}
          <h3
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
              fontWeight: 700,
              color: "#e2e8f0",
              letterSpacing: "0.02em",
              lineHeight: 1.1,
              marginBottom: 10,
            }}
          >
            {stage.title}
          </h3>

          {/* Description */}
          <p
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.95rem",
              color: "rgba(148,163,184,0.75)",
              lineHeight: 1.65,
              fontWeight: 400,
              maxWidth: 320,
              marginLeft: isEven ? "auto" : 0,
            }}
          >
            {stage.description}
          </p>

          {/* Tags */}
          <div
            className={`flex flex-wrap gap-2 mt-4 ${
              isEven ? "justify-end" : "justify-start"
            }`}
          >
            {stage.tags.map((t) => (
              <span
                key={t}
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 9,
                  letterSpacing: "0.18em",
                  padding: "3px 8px",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "rgba(100,116,139,1)",
                  borderRadius: 2,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* CENTER SPINE */}
        <div
          className="relative flex flex-col items-center"
          style={{ order: 1, minHeight: 200 }}
        >
          {/* Spine line */}
          <div
            className="absolute inset-y-0 left-1/2 -translate-x-1/2"
            style={{
              width: 1,
              background: `linear-gradient(to bottom, transparent, ${accentColor}40, ${accentColor}60, ${accentColor}40, transparent)`,
            }}
          />

          {/* Center node */}
          <div
            className="relative z-10 mt-8"
            style={{
              width: 36,
              height: 36,
              border: `1.5px solid ${accentColor}`,
              borderRadius: 2,
              background: `${accentColor}10`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: hovered ? `0 0 20px ${accentColor}40` : `0 0 8px ${accentColor}20`,
              transition: "box-shadow 0.3s ease",
              transform: "rotate(45deg)",
            }}
          >
            <div style={{ transform: "rotate(-45deg)", color: accentColor }}>
              {stage.icon}
            </div>
          </div>

          {/* Data pipe below node */}
          {index < total - 1 && (
            <div className="mt-4">
              <DataPipe active={inView} color={accentColor} vertical />
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div
          className={`py-8 ${isEven ? "pl-10" : "pr-10"}`}
          style={{ order: isEven ? 2 : 0 }}
        >
          <CodeBlock lines={stage.code} inView={inView} />

          {/* Metric chips */}
          <div className="flex flex-wrap gap-3 mt-4">
            {stage.metrics.map((m) => (
              <div
                key={m.label}
                className="flex flex-col gap-0.5"
                style={{
                  borderLeft: `2px solid ${accentColor}40`,
                  paddingLeft: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: 9,
                    color: "rgba(100,116,139,1)",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                  }}
                >
                  {m.label}
                </span>
                <span
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: accentColor,
                    letterSpacing: "0.05em",
                  }}
                >
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── STAGES DATA ───────────────────────────────
const STAGES = [
  {
    type: "INGRESS",
    signal: 2,
    title: "User Authenticates",
    description:
      "Credentials are verified and a JWT token is issued. Identity is proven — but authentication is not trust. The token is cryptographically signed proof of who you are, nothing more.",
    tags: ["app/api/auth/routes.py", "core/security.py", "JWT · SIGNED"],
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="5" width="12" height="8" rx="1" stroke="#22d3ee" strokeWidth="1.2"/><path d="M4 5V4a3 3 0 016 0v1" stroke="#22d3ee" strokeWidth="1.2"/><circle cx="7" cy="9" r="1.2" fill="#22d3ee"/></svg>,
    code: [
      { text: "POST /api/auth/login", color: "#22d3ee" },
      { text: '→ verify credentials', color: "rgba(148,163,184,0.5)" },
      { text: '→ sign JWT { user_id, exp }', color: "rgba(148,163,184,0.5)" },
      { text: "← return: { token, session_id }", color: "#22d3ee" },
    ],
    metrics: [
      { label: "Token TTL", value: "15 min" },
      { label: "Algorithm", value: "RS256" },
    ],
  },
  {
    type: "SESSION",
    signal: 3,
    title: "Session Created Server-Side",
    description:
      "A server-side session is instantiated in Redis with a fresh risk score of 0.0. This session — not the JWT — is the authoritative source of trust state throughout the entire lifecycle.",
    tags: ["session/store.py", "session/models.py", "REDIS · TTL"],
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="12" rx="1" stroke="#22d3ee" strokeWidth="1.2"/><path d="M4 4h6M4 7h4M4 10h5" stroke="#22d3ee" strokeWidth="1" strokeLinecap="round"/></svg>,
    code: [
      { text: "session = {", color: "#22d3ee" },
      { text: "  session_id: uuid4(),", color: "rgba(148,163,184,0.5)" },
      { text: "  risk_score:  0.0,", color: "rgba(148,163,184,0.5)" },
      { text: "  routing_state: 'REAL',", color: "#22d3ee" },
      { text: "  last_activity: now()", color: "rgba(148,163,184,0.5)" },
      { text: "}", color: "#22d3ee" },
    ],
    metrics: [
      { label: "Initial Risk", value: "0.00" },
      { label: "State", value: "REAL" },
    ],
  },
  {
    type: "MONITOR",
    signal: 4,
    title: "Behavior Collected Passively",
    description:
      "Every request passes through the telemetry middleware. Navigation velocity, API probe patterns, endpoint enumeration depth, and payload shape are extracted without the user's awareness.",
    tags: ["middleware/telemetry.py", "behavior/collector.py", "PASSIVE · SILENT"],
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#22d3ee" strokeWidth="1.2"/><circle cx="7" cy="7" r="2.5" stroke="#22d3ee" strokeWidth="1"/><circle cx="7" cy="7" r="0.8" fill="#22d3ee"/></svg>,
    code: [
      { text: "signals = extract_features(req)", color: "#22d3ee" },
      { text: "# api_enum, nav_velocity,", color: "rgba(100,116,139,0.6)" },
      { text: "# endpoint_depth, payload_shape", color: "rgba(100,116,139,0.6)" },
      { text: "apply_rules(signals, session)", color: "rgba(148,163,184,0.5)" },
    ],
    metrics: [
      { label: "Signals", value: "12 types" },
      { label: "Latency", value: "<2ms" },
    ],
  },
  {
    type: "ADVISORY",
    signal: 4,
    title: "Risk Engine Scores the Session",
    description:
      "Behavioral signals are weighted and combined into a single 0–1 risk score. The scorer is purely advisory — it calculates probability of threat, never makes access decisions.",
    tags: ["risk/scorer.py", "risk/thresholds.py", "ADVISORY ONLY"],
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 10L5 6l2.5 2.5L10 4l2 2" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 12h12" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round"/></svg>,
    code: [
      { text: "risk = score(signals) # 0.0–1.0", color: "#f59e0b" },
      { text: "# ADVISORY ONLY — no routing here", color: "rgba(100,116,139,0.6)" },
      { text: "session.risk_score = risk", color: "rgba(148,163,184,0.5)" },
      { text: "apply_decay(session, delta_t)", color: "rgba(148,163,184,0.5)" },
    ],
    metrics: [
      { label: "Score Range", value: "0.0 – 1.0" },
      { label: "Decay", value: "temporal" },
    ],
  },
  {
    type: "CRITICAL",
    signal: 5,
    title: "Policy Engine Routes the Session",
    description:
      "The policy engine reads the risk score and applies escalation rules. This is the only component that can change routing state. No other system may set routing_state directly.",
    tags: ["policy/engine.py", "policy/rules.py", "SOLE AUTHORITY"],
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.5 4h4l-3.2 2.4 1.2 3.9L7 9.1l-3.5 2.2 1.2-3.9L1.5 5h4L7 1z" stroke="#f59e0b" strokeWidth="1.1" fill="rgba(251,191,36,0.1)"/></svg>,
    code: [
      { text: "if risk > THRESHOLD_HIGH:", color: "#f59e0b" },
      { text: "  if state == 'REAL':", color: "rgba(148,163,184,0.5)" },
      { text: "    session.routing = 'DECOY'", color: "#ef4444" },
      { text: "    # ONE-WAY — no reversal", color: "rgba(100,116,139,0.6)" },
      { text: "    forensics.arm(session)", color: "#ef4444" },
    ],
    metrics: [
      { label: "Threshold", value: "0.65" },
      { label: "Reversal", value: "FORBIDDEN" },
    ],
  },
  {
    type: "DECOY",
    signal: 5,
    title: "Attacker Enters the Phantom",
    description:
      "Routing middleware silently redirects all requests to the decoy system. Fake APIs return believable data from MongoDB. The attacker believes they are inside the real system.",
    tags: ["api/decoy/routes.py", "db/mongo/repo.py", "DECEPTION · LIVE"],
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L13 4v4c0 3.5-2.8 5.8-6 6.5C1.8 13.8 1 10.5 1 8V4L7 1z" stroke="#ef4444" strokeWidth="1.2" fill="rgba(239,68,68,0.08)"/><path d="M4.5 7.5L6.5 9.5L10 5.5" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round"/></svg>,
    code: [
      { text: "# Attacker calls: GET /api/data", color: "#ef4444" },
      { text: "→ middleware: routing == 'DECOY'", color: "rgba(148,163,184,0.5)" },
      { text: "→ decoy_service.respond(req)", color: "rgba(148,163,184,0.5)" },
      { text: "← fake_data from MongoDB", color: "#ef4444" },
      { text: "# Real PostgreSQL: untouched", color: "rgba(100,116,139,0.6)" },
    ],
    metrics: [
      { label: "DB Source", value: "MongoDB" },
      { label: "Real DB", value: "ISOLATED" },
    ],
  },
  {
    type: "FORENSICS",
    signal: 5,
    title: "Intelligence Captured",
    description:
      "Every decoy interaction is logged with full fidelity — session ID, endpoint, payload, headers, timestamp. Canary traps are armed. The attacker's entire operation is reconstructed into a threat intelligence timeline.",
    tags: ["forensics/logger.py", "forensics/timeline.py", "canary/detector.py"],
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#22d3ee" strokeWidth="1.2"/><path d="M7 4v3.5l2 1.5" stroke="#22d3ee" strokeWidth="1.2" strokeLinecap="round"/></svg>,
    code: [
      { text: "forensics.log({", color: "#22d3ee" },
      { text: "  session_id, endpoint,", color: "rgba(148,163,184,0.5)" },
      { text: "  payload, headers, ts,", color: "rgba(148,163,184,0.5)" },
      { text: "  canary_triggered: bool", color: "#22d3ee" },
      { text: "})", color: "#22d3ee" },
    ],
    metrics: [
      { label: "Coverage", value: "100%" },
      { label: "Timeline", value: "rebuilt" },
    ],
  },
];

// ── Main Export ───────────────────────────────
export default function HowItWorks() {
  const [headerRef, headerInView] = useInView(0.2);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@300;400;500;600;700&display=swap');

        @keyframes pipeDot {
          0%, 100% { opacity: 0.15; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes scanDiag {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(200%) skewX(-20deg); }
        }
        @keyframes marqueeTape {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <section
        style={{
          background: "linear-gradient(180deg, #030a10 0%, #020608 50%, #04080e 100%)",
          position: "relative",
          overflow: "hidden",
          paddingBottom: 80,
        }}
      >
        {/* ── BG Grid ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(34,211,238,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34,211,238,0.025) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            pointerEvents: "none",
          }}
        />

        {/* ── Diagonal accent slash ── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background:
              "linear-gradient(90deg, transparent, #22d3ee40, #22d3ee80, #22d3ee40, transparent)",
          }}
        />

        {/* ── Marquee Tape at top ── */}
        <div
          style={{
            borderTop: "1px solid rgba(34,211,238,0.08)",
            borderBottom: "1px solid rgba(34,211,238,0.08)",
            background: "rgba(34,211,238,0.03)",
            overflow: "hidden",
            padding: "6px 0",
            marginBottom: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              whiteSpace: "nowrap",
              animation: "marqueeTape 18s linear infinite",
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 9,
              letterSpacing: "0.25em",
              color: "rgba(34,211,238,0.35)",
              gap: "4rem",
            }}
          >
            {Array(6).fill(
              "PHANTOMSHIELD · ACTIVE DECEPTION FRAMEWORK · SESSION ISOLATION ACTIVE · FORENSICS ARMED · CANARY TRAPS ENABLED · ONE-WAY ESCALATION · "
            ).map((t, i) => <span key={i}>{t}</span>)}
          </div>
        </div>

        {/* ── Section Header ── */}
        <div
          ref={headerRef}
          className="max-w-7xl mx-auto px-8 pt-20 pb-8"
        >
          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: "auto 1fr", alignItems: "end" }}
          >
            <div>
              {/* Overline */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                  opacity: headerInView ? 1 : 0,
                  transform: headerInView ? "none" : "translateY(10px)",
                  transition: "all 0.6s ease",
                }}
              >
                <div style={{ display: "flex", gap: 4 }}>
                  {[0,1,2,3,4,5,6].map(i => (
                    <div
                      key={i}
                      style={{
                        width: i < 4 ? 16 : 4,
                        height: 2,
                        background: i < 4 ? "#22d3ee" : "rgba(34,211,238,0.2)",
                        borderRadius: 1,
                      }}
                    />
                  ))}
                </div>
                <span
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: 10,
                    letterSpacing: "0.3em",
                    color: "#22d3ee",
                    textTransform: "uppercase",
                  }}
                >
                  OPERATIONAL SEQUENCE · 7 STAGES
                </span>
              </div>

              {/* Main heading */}
              <h2
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(2.8rem, 5vw, 4.5rem)",
                  lineHeight: 1,
                  letterSpacing: "-0.01em",
                  color: "#f1f5f9",
                  opacity: headerInView ? 1 : 0,
                  transform: headerInView ? "none" : "translateY(16px)",
                  transition: "all 0.7s ease 0.1s",
                }}
              >
                HOW IT{" "}
                <span
                  style={{
                    WebkitTextStroke: "1px rgba(34,211,238,0.8)",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  OPERATES.
                </span>
              </h2>
            </div>

            {/* Right — dossier stamp */}
            <div
              style={{
                marginLeft: "auto",
                textAlign: "right",
                opacity: headerInView ? 1 : 0,
                transition: "opacity 0.8s ease 0.3s",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  border: "2px solid rgba(239,68,68,0.3)",
                  padding: "8px 16px",
                  transform: "rotate(-1.5deg)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: 11,
                    letterSpacing: "0.25em",
                    color: "rgba(239,68,68,0.6)",
                    fontWeight: 700,
                  }}
                >
                  CLASSIFIED
                </div>
                <div
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: 8,
                    letterSpacing: "0.2em",
                    color: "rgba(239,68,68,0.35)",
                  }}
                >
                  THREAT DOSSIER · REF: PS-v1
                </div>
                {/* Corner marks */}
                {["top-0 left-0","top-0 right-0","bottom-0 left-0","bottom-0 right-0"].map((pos, i) => (
                  <div key={i} className={`absolute ${pos} w-2 h-2`}
                    style={{ border: "1px solid rgba(239,68,68,0.4)",
                      borderRight: pos.includes("right") ? undefined : "none",
                      borderLeft: pos.includes("left") ? undefined : "none",
                      borderBottom: pos.includes("bottom") ? undefined : "none",
                      borderTop: pos.includes("top") ? undefined : "none",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Desc + breadcrumb */}
          <div
            style={{
              marginTop: 20,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 24,
              flexWrap: "wrap",
              opacity: headerInView ? 1 : 0,
              transform: headerInView ? "none" : "translateY(10px)",
              transition: "all 0.7s ease 0.25s",
              borderTop: "1px solid rgba(34,211,238,0.07)",
              paddingTop: 16,
            }}
          >
            <p
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "1rem",
                fontWeight: 300,
                color: "rgba(148,163,184,0.65)",
                lineHeight: 1.7,
                maxWidth: 560,
                letterSpacing: "0.01em",
              }}
            >
              From the first authentication handshake to full forensic capture —
              every stage is deterministic, isolated, and architecturally enforced.
              No configuration toggles. No ambiguity.
            </p>
            <div style={{ display: "flex", gap: 24 }}>
              {[
                { n: "07", label: "Operational Stages" },
                { n: "∞", label: "One-Way Escalation" },
                { n: "0", label: "DB Crossover Events" },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: "1.8rem",
                      fontWeight: 700,
                      color: "#22d3ee",
                      lineHeight: 1,
                    }}
                  >
                    {s.n}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: 8,
                      color: "rgba(100,116,139,1)",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      marginTop: 2,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Divider rule ── */}
        <div
          style={{
            maxWidth: "80rem",
            margin: "0 auto",
            padding: "0 2rem",
          }}
        >
          <div
            style={{
              height: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(34,211,238,0.25) 30%, rgba(34,211,238,0.25) 70%, transparent)",
            }}
          />
        </div>

        {/* ── Stages ── */}
        <div
          style={{
            maxWidth: "80rem",
            margin: "0 auto",
            padding: "0 2rem",
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {STAGES.map((stage, i) => (
            <StageCard key={i} stage={stage} index={i} total={STAGES.length} />
          ))}
        </div>

        {/* ── Terminal Footer Strip ── */}
        <div
          style={{
            maxWidth: "80rem",
            margin: "48px auto 0",
            padding: "0 2rem",
          }}
        >
          <div
            style={{
              border: "1px solid rgba(34,211,238,0.12)",
              background: "rgba(34,211,238,0.02)",
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
              {[
                { label: "Auth Strategy", value: "JWT + Server-Side Session" },
                { label: "Risk Engine", value: "Advisory · Never Routes" },
                { label: "Escalation", value: "REAL → DECOY · Irreversible" },
                { label: "DB Isolation", value: "PostgreSQL / MongoDB · Zero Crossover" },
              ].map((item) => (
                <div key={item.label}>
                  <div
                    style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: 8,
                      letterSpacing: "0.2em",
                      color: "rgba(100,116,139,1)",
                      textTransform: "uppercase",
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "rgba(148,163,184,0.8)",
                      letterSpacing: "0.04em",
                      marginTop: 2,
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22d3ee", animation: "pulse 2s infinite" }} />
              <span
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 9,
                  letterSpacing: "0.2em",
                  color: "#22d3ee",
                }}
              >
                ALL SYSTEMS NOMINAL
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}