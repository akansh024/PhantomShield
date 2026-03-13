import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────────────────
   PHANTOMSHIELD — WHY CHOOSE US
   Aesthetic: Darkroom Intelligence Brief meets Luxury Threat Report.
   Think a $50M cybersecurity firm's annual showcase — brutally
   confident, visually dominant, zero filler. Each reason is a
   "weapon spec" with live data visuals. Center piece is a rotating
   3D hexagonal threat wheel. Background: encrypted noise + slow
   heat-map bleed. Typography: massive, editorial, aggressive.
───────────────────────────────────────────────────────────────── */

function useInView(threshold = 0.1) {
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

// ── Animated counter ─────────────────────────
function Counter({ to, suffix = "", duration = 1800, inView }) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * to));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView]);
  return <>{val}{suffix}</>;
}

// ── Hex SVG ──────────────────────────────────
function Hex({ size = 60, fill = "none", stroke = "#22d3ee", opacity = 1, rotate = 0 }) {
  const r = size / 2;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${r + r * Math.cos(a)},${r + r * Math.sin(a)}`;
  }).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: `rotate(${rotate}deg)`, opacity }}>
      <polygon points={pts} fill={fill} stroke={stroke} strokeWidth="1" />
    </svg>
  );
}

// ── Radial bar ────────────────────────────────
function RadialBar({ pct, color, size = 56, inView }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const [dash, setDash] = useState(0);
  useEffect(() => {
    if (!inView) return;
    setTimeout(() => setDash(circ * pct), 200);
  }, [inView]);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth="3"
        strokeDasharray={`${circ}`}
        strokeDashoffset={circ - dash}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)" }}
      />
    </svg>
  );
}

// ── Weapon Card ───────────────────────────────
const WEAPONS = [
  {
    id: "W-01",
    title: "Deception-First Architecture",
    sub: "Not a bolt-on. Not a plugin.",
    body: "Built from the ground up around active deception. Every layer — session, middleware, policy, database — is engineered to sustain a parallel phantom reality indefinitely.",
    stat: { n: 100, suffix: "%", label: "Architectural Isolation" },
    radial: 1.0,
    color: "#22d3ee",
    tag: "CORE DOCTRINE",
    bars: [
      { label: "Session Isolation", pct: 1.0 },
      { label: "DB Segregation", pct: 1.0 },
      { label: "API Fidelity", pct: 0.97 },
    ],
    accent: "from-cyan-500/10 to-transparent",
    border: "rgba(34,211,238,0.2)",
  },
  {
    id: "W-02",
    title: "One-Way Escalation Law",
    sub: "Physics, not policy.",
    body: "Once a session crosses into DECOY state it cannot return. This isn't a rule stored in a config file — it's an architectural invariant enforced at every layer simultaneously.",
    stat: { n: 0, suffix: "", label: "Reversal Events Possible" },
    radial: 0.0,
    color: "#ef4444",
    tag: "HARD CONSTRAINT",
    bars: [
      { label: "REAL → DECOY", pct: 1.0 },
      { label: "DECOY → REAL", pct: 0.0 },
      { label: "False Reversion", pct: 0.0 },
    ],
    accent: "from-red-500/10 to-transparent",
    border: "rgba(239,68,68,0.2)",
  },
  {
    id: "W-03",
    title: "Advisory Risk Engine",
    sub: "Scored. Never sentenced.",
    body: "The risk scorer observes and advises. The policy engine alone holds routing authority. This separation prevents a single compromised module from altering attacker fate.",
    stat: { n: 12, suffix: " signals", label: "Behavioral Indicators" },
    radial: 0.74,
    color: "#f59e0b",
    tag: "SEPARATION OF CONCERNS",
    bars: [
      { label: "Signal Coverage", pct: 0.92 },
      { label: "False Positive Rate", pct: 0.04 },
      { label: "Decision Latency", pct: 0.02 },
    ],
    accent: "from-amber-500/10 to-transparent",
    border: "rgba(245,158,11,0.2)",
  },
  {
    id: "W-04",
    title: "Full-Spectrum Forensics",
    sub: "Every move. Recorded.",
    body: "No interaction inside the decoy system escapes logging. Session ID, endpoint, payload, timing, canary status — all captured, indexed, and reconstructed into a complete attacker timeline.",
    stat: { n: 100, suffix: "%", label: "Decoy Interaction Coverage" },
    radial: 1.0,
    color: "#a78bfa",
    tag: "INTELLIGENCE CAPTURE",
    bars: [
      { label: "Payload Capture", pct: 1.0 },
      { label: "Timeline Fidelity", pct: 0.99 },
      { label: "Canary Coverage", pct: 0.96 },
    ],
    accent: "from-violet-500/10 to-transparent",
    border: "rgba(167,139,250,0.2)",
  },
];

function WeaponCard({ w, index }) {
  const [ref, inView] = useInView(0.12);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        border: `1px solid ${hovered ? w.color + "60" : w.border}`,
        background: hovered
          ? `linear-gradient(135deg, ${w.color}08 0%, rgba(0,0,0,0) 60%)`
          : "rgba(0,0,0,0.3)",
        padding: "32px 28px",
        transition: "all 0.35s ease",
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : "translateY(24px)",
        transitionDelay: `${index * 100}ms`,
        cursor: "default",
        backdropFilter: "blur(8px)",
        overflow: "hidden",
      }}
    >
      {/* Diagonal scan on hover */}
      {hovered && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(105deg, transparent 40%, ${w.color}08 50%, transparent 60%)`,
            animation: "scanDiag 0.8s ease forwards",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Ghost ID */}
      <div
        style={{
          position: "absolute",
          top: -10,
          right: -8,
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 90,
          fontWeight: 900,
          color: "transparent",
          WebkitTextStroke: `1px ${w.color}10`,
          lineHeight: 1,
          pointerEvents: "none",
          letterSpacing: "-0.04em",
        }}
      >
        {w.id}
      </div>

      {/* Tag */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <span
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 9,
            letterSpacing: "0.25em",
            color: w.color,
            border: `1px solid ${w.color}30`,
            padding: "3px 8px",
            background: `${w.color}0a`,
          }}
        >
          {w.tag}
        </span>
        <div style={{ position: "relative", width: 56, height: 56 }}>
          <RadialBar pct={w.radial} color={w.color} size={56} inView={inView} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 9,
              color: w.color,
            }}
          >
            {Math.round(w.radial * 100)}%
          </div>
        </div>
      </div>

      {/* Title */}
      <h3
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "1.45rem",
          fontWeight: 700,
          color: "#e2e8f0",
          letterSpacing: "0.02em",
          lineHeight: 1.1,
          marginBottom: 4,
        }}
      >
        {w.title}
      </h3>
      <div
        style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 10,
          color: w.color,
          letterSpacing: "0.1em",
          marginBottom: 14,
          opacity: 0.7,
        }}
      >
        {w.sub}
      </div>

      {/* Body */}
      <p
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.92rem",
          fontWeight: 300,
          color: "rgba(148,163,184,0.7)",
          lineHeight: 1.65,
          marginBottom: 20,
        }}
      >
        {w.body}
      </p>

      {/* Bar metrics */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {w.bars.map((b) => (
          <div key={b.label}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  color: "rgba(100,116,139,1)",
                  textTransform: "uppercase",
                }}
              >
                {b.label}
              </span>
              <span
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 9,
                  color: b.pct > 0 ? w.color : "rgba(100,116,139,0.5)",
                }}
              >
                {b.pct === 0 ? "—" : `${Math.round(b.pct * 100)}%`}
              </span>
            </div>
            <div
              style={{
                height: 2,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: inView ? `${b.pct * 100}%` : "0%",
                  background: b.pct === 0
                    ? "rgba(100,116,139,0.2)"
                    : `linear-gradient(90deg, ${w.color}80, ${w.color})`,
                  transition: "width 1.2s cubic-bezier(0.4,0,0.2,1) 0.4s",
                  boxShadow: b.pct > 0 ? `0 0 6px ${w.color}60` : "none",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Big number */}
      <div
        style={{
          marginTop: 20,
          paddingTop: 16,
          borderTop: `1px solid ${w.color}15`,
          display: "flex",
          alignItems: "baseline",
          gap: 4,
        }}
      >
        <span
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "2.4rem",
            fontWeight: 800,
            color: w.color,
            lineHeight: 1,
          }}
        >
          <Counter to={w.stat.n} suffix={w.stat.suffix} inView={inView} />
        </span>
        <span
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 9,
            color: "rgba(100,116,139,0.8)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginLeft: 4,
          }}
        >
          {w.stat.label}
        </span>
      </div>
    </div>
  );
}

// ── Central Threat Wheel ──────────────────────
function ThreatWheel({ inView }) {
  const [angle, setAngle] = useState(0);
  const rafRef = useRef();
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const tick = (now) => {
      setAngle(((now - start) * 0.018) % 360);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [inView]);

  const layers = [
    { r: 110, count: 6, color: "#22d3ee", labels: ["AUTH", "JWT", "SESSION", "RISK", "POLICY", "ROUTE"] },
    { r: 70,  count: 4, color: "#f59e0b", labels: ["SCORE", "DECAY", "RULES", "THRESHOLD"] },
    { r: 36,  count: 3, color: "#ef4444", labels: ["DECOY", "LOG", "CANARY"] },
  ];

  return (
    <div
      style={{
        position: "relative",
        width: 280,
        height: 280,
        margin: "0 auto",
        opacity: inView ? 1 : 0,
        transition: "opacity 1s ease",
      }}
    >
      <svg width="280" height="280" viewBox="0 0 280 280">
        <defs>
          <filter id="glow-c">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-r">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Orbit rings */}
        {layers.map((l, i) => (
          <circle key={i} cx="140" cy="140" r={l.r} fill="none" stroke={l.color} strokeWidth="0.5" strokeDasharray="4 6" opacity="0.25" />
        ))}

        {/* Rotating elements */}
        <g transform={`rotate(${angle} 140 140)`}>
          {layers.map((layer, li) =>
            layer.labels.map((label, i) => {
              const a = (360 / layer.count) * i * (Math.PI / 180);
              const x = 140 + layer.r * Math.cos(a);
              const y = 140 + layer.r * Math.sin(a);
              return (
                <g key={`${li}-${i}`} transform={`rotate(${-angle} ${x} ${y})`}>
                  <circle cx={x} cy={y} r={4} fill={layer.color} opacity={0.8} filter="url(#glow-c)" />
                  <text
                    x={x} y={y - 8}
                    textAnchor="middle"
                    fill={layer.color}
                    fontSize="6"
                    fontFamily="'Share Tech Mono', monospace"
                    letterSpacing="0.5"
                    opacity="0.6"
                  >
                    {label}
                  </text>
                </g>
              );
            })
          )}
        </g>

        {/* Center core */}
        <circle cx="140" cy="140" r="18" fill="rgba(239,68,68,0.1)" stroke="#ef4444" strokeWidth="1" filter="url(#glow-r)" />
        <circle cx="140" cy="140" r="10" fill="rgba(239,68,68,0.25)" />
        <circle cx="140" cy="140" r="4" fill="#ef4444" />

        {/* Connecting spokes */}
        {layers[0].labels.map((_, i) => {
          const a = (360 / layers[0].count) * i * (Math.PI / 180) + (angle * Math.PI / 180);
          return (
            <line
              key={i}
              x1="140" y1="140"
              x2={140 + 110 * Math.cos(a)}
              y2={140 + 110 * Math.sin(a)}
              stroke="#22d3ee"
              strokeWidth="0.4"
              opacity="0.1"
            />
          );
        })}
      </svg>

      {/* Center label */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
        }}
      >
        <div
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 8,
            letterSpacing: "0.3em",
            color: "rgba(239,68,68,0.7)",
            textTransform: "uppercase",
          }}
        >
          CORE
        </div>
      </div>
    </div>
  );
}

// ── Comparison Row ────────────────────────────
const COMPARISONS = [
  { label: "Server-side session trust", us: true, them: false },
  { label: "One-way escalation guarantee", us: true, them: false },
  { label: "Risk scorer ≠ routing authority", us: true, them: false },
  { label: "Full decoy DB isolation", us: true, them: false },
  { label: "100% decoy interaction logging", us: true, them: false },
  { label: "Canary trap intelligence", us: true, them: false },
  { label: "Frontend deception transparency", us: true, them: false },
  { label: "Attack simulation included", us: true, them: false },
];

function ComparisonTable({ inView }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 100px 100px",
          borderBottom: "1px solid rgba(34,211,238,0.12)",
          paddingBottom: 8,
          marginBottom: 4,
        }}
      >
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, letterSpacing: "0.2em", color: "rgba(100,116,139,0.8)", textTransform: "uppercase" }}>Capability</span>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, letterSpacing: "0.2em", color: "#22d3ee", textTransform: "uppercase", textAlign: "center" }}>PhantomShield</span>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, letterSpacing: "0.2em", color: "rgba(100,116,139,0.5)", textTransform: "uppercase", textAlign: "center" }}>Typical SIEM</span>
      </div>

      {COMPARISONS.map((row, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 100px 100px",
            padding: "10px 0",
            borderBottom: "1px solid rgba(255,255,255,0.03)",
            opacity: inView ? 1 : 0,
            transform: inView ? "none" : "translateX(-12px)",
            transition: `all 0.4s ease ${i * 80}ms`,
          }}
        >
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.85rem", fontWeight: 400, color: "rgba(148,163,184,0.7)", letterSpacing: "0.02em" }}>
            {row.label}
          </span>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" fill="rgba(34,211,238,0.12)" stroke="#22d3ee" strokeWidth="0.8" />
              <path d="M4 7l2 2 4-4" stroke="#22d3ee" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" fill="rgba(100,116,139,0.05)" stroke="rgba(100,116,139,0.2)" strokeWidth="0.8" />
              <path d="M5 5l4 4M9 5l-4 4" stroke="rgba(100,116,139,0.4)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Export ───────────────────────────────
export default function WhyChooseUs() {
  const [heroRef, heroInView] = useInView(0.1);
  const [wheelRef, wheelInView] = useInView(0.2);
  const [cmpRef, cmpInView] = useInView(0.1);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@300;400;500;600;700&display=swap');

        @keyframes scanDiag {
          0% { transform: translateX(-120%) skewX(-15deg); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateX(220%) skewX(-15deg); opacity: 0; }
        }
        @keyframes floatHex {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(6deg); }
        }
        @keyframes breathe {
          0%, 100% { opacity: 0.06; transform: scale(1); }
          50% { opacity: 0.12; transform: scale(1.03); }
        }
        @keyframes marqueeTape {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <section
        style={{
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(180deg, #04080e 0%, #020508 60%, #040a0f 100%)",
        }}
      >
        {/* ── BG grid ── */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(rgba(34,211,238,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.022) 1px, transparent 1px)`,
          backgroundSize: "40px 40px", pointerEvents: "none",
        }} />

        {/* ── Floating hex BG shapes ── */}
        {[
          { size: 320, top: "8%",  left: "-6%",  dur: 9,  col: "#22d3ee" },
          { size: 200, top: "55%", right: "-4%", dur: 12, col: "#ef4444" },
          { size: 150, top: "30%", left: "45%",  dur: 7,  col: "#f59e0b" },
        ].map((h, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: h.top, left: h.left, right: h.right,
              animation: `floatHex ${h.dur}s ease-in-out infinite`,
              animationDelay: `${i * 2}s`,
              pointerEvents: "none",
              opacity: 0.07,
            }}
          >
            <Hex size={h.size} stroke={h.col} fill={`${h.col}08`} />
          </div>
        ))}

        {/* ── Heat blob glows ── */}
        <div style={{
          position: "absolute", top: "20%", left: "25%",
          width: 600, height: 500,
          background: "radial-gradient(ellipse, rgba(6,182,212,0.05) 0%, transparent 65%)",
          animation: "breathe 8s ease-in-out infinite", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "5%", right: "10%",
          width: 400, height: 400,
          background: "radial-gradient(ellipse, rgba(239,68,68,0.04) 0%, transparent 65%)",
          animation: "breathe 11s ease-in-out infinite 3s", pointerEvents: "none",
        }} />

        {/* ══════════════════════════════════════
            SECTION 1: EDITORIAL HEADER BLOCK
        ══════════════════════════════════════ */}
        <div
          ref={heroRef}
          style={{ maxWidth: "90rem", margin: "0 auto", padding: "80px 2rem 60px" }}
        >
          {/* Overline row */}
          <div style={{
            display: "flex", alignItems: "center", gap: 16, marginBottom: 32,
            opacity: heroInView ? 1 : 0, transform: heroInView ? "none" : "translateY(12px)",
            transition: "all 0.6s ease",
          }}>
            <div style={{ display: "flex", gap: 3 }}>
              {[1,1,1,1,0.3,0.15].map((op, i) => (
                <div key={i} style={{ width: 24, height: 2, background: `rgba(34,211,238,${op})`, borderRadius: 1 }} />
              ))}
            </div>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: "0.3em", color: "#22d3ee", textTransform: "uppercase" }}>
              WHY PHANTOMSHIELD
            </span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(34,211,238,0.15), transparent)" }} />
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: "rgba(100,116,139,0.6)" }}>
              THREAT SUPERIORITY BRIEF
            </span>
          </div>

          {/* MASSIVE headline — editorial split */}
          <div style={{
            opacity: heroInView ? 1 : 0, transform: heroInView ? "none" : "translateY(24px)",
            transition: "all 0.8s ease 0.1s",
          }}>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 900,
              fontSize: "clamp(3.5rem, 9vw, 9rem)",
              lineHeight: 0.9, letterSpacing: "-0.02em",
              textTransform: "uppercase", display: "flex", flexWrap: "wrap",
              alignItems: "baseline", gap: "0.2em",
            }}>
              <span style={{ color: "#f1f5f9" }}>THE ONLY</span>
              <span style={{ WebkitTextStroke: "1.5px #22d3ee", WebkitTextFillColor: "transparent" }}>
                SYSTEM
              </span>
            </div>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 900,
              fontSize: "clamp(3.5rem, 9vw, 9rem)",
              lineHeight: 0.7, letterSpacing: "-0.02em",
              textTransform: "uppercase", display: "flex", flexWrap: "wrap",
              alignItems: "baseline", gap: "0.2em",
            }}>
              <span style={{ color: "#f1f5f9" }}>WHERE</span>
              <span style={{ background: "linear-gradient(90deg, #22d3ee, #06b6d4 40%, #0e7490)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                ATTACKERS
              </span>
              <span style={{ color: "#f1f5f9" }}>DO YOUR</span>
            </div>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 900,
              fontSize: "clamp(3.5rem, 9vw, 9rem)",
              lineHeight: 0.9, letterSpacing: "-0.02em",
              color: "#ef4444",
              textTransform: "uppercase",
              textShadow: "0 0 60px rgba(239,68,68,0.3)",
            }}>
              INTELLIGENCE WORK.
            </div>
          </div>

          {/* Sub + stats row */}
          <div style={{
            marginTop: 40, display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 40, alignItems: "end",
            opacity: heroInView ? 1 : 0, transform: heroInView ? "none" : "translateY(12px)",
            transition: "all 0.7s ease 0.3s",
            borderTop: "1px solid rgba(34,211,238,0.07)", paddingTop: 28,
            flexWrap: "wrap",
          }}>
            <p style={{
              fontFamily: "'Rajdhani', sans-serif", fontSize: "1.1rem",
              fontWeight: 300, color: "rgba(148,163,184,0.65)",
              lineHeight: 1.7, maxWidth: 560, letterSpacing: "0.01em",
            }}>
              PhantomShield doesn't detect attackers and alert your team.
              It traps them in a cryptographically isolated reality and lets
              them <span style={{ color: "#22d3ee", fontWeight: 500 }}>exhaust themselves against phantom infrastructure</span>{" "}
              while you collect everything.
            </p>
            <div style={{ display: "flex", gap: 32, flexShrink: 0 }}>
              {[
                { n: 7, suffix: "", label: "System Layers" },
                { n: 0, suffix: "ms", label: "Routing Overhead" },
                { n: 100, suffix: "%", label: "Log Coverage" },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "2.5rem", fontWeight: 800, color: "#22d3ee", lineHeight: 1 }}>
                    {s.n}{s.suffix}
                  </div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: "rgba(100,116,139,1)", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 2 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            SECTION 2: WEAPON CARDS GRID
        ══════════════════════════════════════ */}
        <div style={{ maxWidth: "90rem", margin: "0 auto", padding: "0 2rem 80px" }}>
          {/* Section label */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: "0.28em", color: "rgba(100,116,139,0.7)", textTransform: "uppercase" }}>
              04 DECISIVE ADVANTAGES
            </span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(34,211,238,0.15), transparent)" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 1, background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.08)" }}>
            {WEAPONS.map((w, i) => (
              <WeaponCard key={w.id} w={w} index={i} />
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════
            SECTION 3: THREAT WHEEL + COMPARISON
        ══════════════════════════════════════ */}
        <div
          ref={wheelRef}
          style={{
            maxWidth: "90rem", margin: "0 auto", padding: "0 2rem 100px",
            display: "grid", gridTemplateColumns: "1fr 1px 1.4fr",
            gap: 0, alignItems: "center",
          }}
        >
          {/* LEFT — Threat Wheel */}
          <div style={{ padding: "0 60px 0 0", textAlign: "center" }}>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
              letterSpacing: "0.28em", color: "rgba(100,116,139,0.7)",
              textTransform: "uppercase", marginBottom: 16,
            }}>
              SYSTEM ORBIT MAP
            </div>
            <ThreatWheel inView={wheelInView} />
            <div style={{
              marginTop: 20, display: "flex", justifyContent: "center", gap: 20,
            }}>
              {[{ c: "#22d3ee", l: "Auth/Session" }, { c: "#f59e0b", l: "Risk/Policy" }, { c: "#ef4444", l: "Decoy/Intel" }].map(({ c, l }) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: c }} />
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: "rgba(100,116,139,0.8)", letterSpacing: "0.1em" }}>{l}</span>
                </div>
              ))}
            </div>

            {/* Pull quote */}
            <div style={{
              marginTop: 32,
              border: "1px solid rgba(239,68,68,0.2)",
              padding: "18px 20px",
              background: "rgba(239,68,68,0.03)",
              textAlign: "left",
            }}>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif", fontSize: "1.15rem",
                fontWeight: 600, color: "#e2e8f0", lineHeight: 1.45,
                marginBottom: 10,
              }}>
                "The attacker believes they penetrated the system. They have. It just isn't the real one."
              </div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: "#ef4444", letterSpacing: "0.2em" }}>
                — PHANTOMSHIELD CORE DOCTRINE
              </div>
            </div>
          </div>

          {/* SPINE */}
          <div style={{
            alignSelf: "stretch",
            background: "linear-gradient(to bottom, transparent, rgba(34,211,238,0.2) 30%, rgba(34,211,238,0.2) 70%, transparent)",
            width: 1,
          }} />

          {/* RIGHT — Comparison table */}
          <div ref={cmpRef} style={{ padding: "0 0 0 60px" }}>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
              letterSpacing: "0.28em", color: "rgba(100,116,139,0.7)",
              textTransform: "uppercase", marginBottom: 24,
            }}>
              COMPETITIVE ANALYSIS
            </div>
            <h3 style={{
              fontFamily: "'Rajdhani', sans-serif", fontSize: "2rem",
              fontWeight: 700, color: "#e2e8f0", letterSpacing: "0.01em",
              lineHeight: 1.1, marginBottom: 28,
            }}>
              Everything typical security tools<br />
              <span style={{ color: "#ef4444" }}>can't do.</span>
            </h3>
            <ComparisonTable inView={cmpInView} />
          </div>
        </div>

        {/* ══════════════════════════════════════
            SECTION 4: FINAL CTA BAR
        ══════════════════════════════════════ */}
        <div style={{
          borderTop: "1px solid rgba(34,211,238,0.08)",
          borderBottom: "1px solid rgba(34,211,238,0.08)",
          background: "rgba(34,211,238,0.02)",
          overflow: "hidden", padding: "6px 0",
        }}>
          <div style={{
            display: "flex", whiteSpace: "nowrap",
            animation: "marqueeTape 22s linear infinite",
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 9, letterSpacing: "0.25em",
            color: "rgba(34,211,238,0.3)", gap: "4rem",
          }}>
            {Array(6).fill("DECEPTION IS NOT A FEATURE — IT IS THE ENTIRE ARCHITECTURE · REAL SYSTEM UNTOUCHED · ATTACKERS FULLY INSTRUMENTED · NO ALERTS. NO NOISE. JUST INTELLIGENCE · ").map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: "90rem", margin: "0 auto", padding: "60px 2rem 80px" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr auto",
            gap: 32, alignItems: "center",
            border: "1px solid rgba(34,211,238,0.12)",
            background: "linear-gradient(135deg, rgba(6,182,212,0.04) 0%, rgba(0,0,0,0) 60%)",
            padding: "40px 48px",
          }}>
            <div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: "0.28em", color: "#22d3ee", textTransform: "uppercase", marginBottom: 12 }}>
                READY TO DEPLOY
              </div>
              <h3 style={{
                fontFamily: "'Rajdhani', sans-serif", fontSize: "2.2rem",
                fontWeight: 700, color: "#f1f5f9", lineHeight: 1.1, letterSpacing: "0.01em",
              }}>
                Stop alerting on attacks.<br />
                <span style={{ color: "#22d3ee" }}>Start profiting from them.</span>
              </h3>
            </div>
            <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
              <button style={{
                fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                fontSize: "0.85rem", letterSpacing: "0.2em",
                textTransform: "uppercase", padding: "14px 32px",
                background: "linear-gradient(135deg, #06b6d4, #0891b2)",
                color: "#020a10", border: "none", cursor: "pointer",
                boxShadow: "0 0 24px rgba(6,182,212,0.3)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => { e.target.style.boxShadow = "0 0 40px rgba(6,182,212,0.55)"; e.target.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.target.style.boxShadow = "0 0 24px rgba(6,182,212,0.3)"; e.target.style.transform = "none"; }}
              >
                Deploy PhantomShield
              </button>
              <button style={{
                fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                fontSize: "0.85rem", letterSpacing: "0.2em",
                textTransform: "uppercase", padding: "14px 32px",
                background: "transparent",
                color: "rgba(148,163,184,0.7)",
                border: "1px solid rgba(100,116,139,0.25)",
                cursor: "pointer", transition: "all 0.2s ease",
              }}
              onMouseEnter={e => { e.target.style.borderColor = "rgba(34,211,238,0.4)"; e.target.style.color = "#22d3ee"; }}
              onMouseLeave={e => { e.target.style.borderColor = "rgba(100,116,139,0.25)"; e.target.style.color = "rgba(148,163,184,0.7)"; }}
              >
                View Architecture
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}