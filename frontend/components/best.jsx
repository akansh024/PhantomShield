import { useRef, useState, useEffect } from "react";
import { motion, useInView, useAnimation, animate } from "framer-motion";
import {
  ShieldCheck, Zap, Eye, Lock, Activity,
  Server, GitBranch, Clock, CheckCircle2,
  TrendingUp, AlertTriangle, Terminal,
} from "lucide-react";

const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/* ─── BORDER BEAM ─────────────────────────────────────────── */
function BorderBeam({ color = "#22d3ee", duration = 4, size = 200 }) {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
      <motion.div
        className="absolute"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `conic-gradient(transparent 270deg, ${color}, transparent)`,
          filter: `blur(8px)`,
          offsetPath: `rect(0 100% 100% 0 round 0px)`,
        }}
        animate={{ offsetDistance: ["0%", "100%"] }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

/* ─── ANIMATED COUNTER ────────────────────────────────────── */
function Counter({ from = 0, to, decimals = 0, prefix = "", suffix = "", duration = 2.2 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(from.toFixed(decimals));

  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(from, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v.toFixed(decimals)),
    });
    return ctrl.stop;
  }, [inView]);

  return (
    <span ref={ref}>
      {prefix}{display}{suffix}
    </span>
  );
}

/* ─── STAT CARD ───────────────────────────────────────────── */
const STATS = [
  {
    value: 99.9, from: 90, decimals: 1, prefix: "", suffix: "%",
    label: "[SYSTEM_UPTIME_SUCCESS_RATE]",
    sublabel: "Continuous availability",
    icon: Activity,
    color: "#22d3ee",
    beamColor: "#22d3ee",
    spec: "SLA · TIER-1",
  },
  {
    value: 0, from: 0, decimals: 0, prefix: "<", suffix: "ms",
    label: "[ROUTING_DECISION_LATENCY]",
    sublabel: "Policy engine overhead",
    icon: Zap,
    color: "#22d3ee",
    beamColor: "#22d3ee",
    spec: "MEASURED · PER-REQUEST",
  },
  {
    value: 100, from: 0, decimals: 0, prefix: "", suffix: "%",
    label: "[FORENSIC_CAPTURE_COVERAGE]",
    sublabel: "Decoy interaction logging",
    icon: Eye,
    color: "#a78bfa",
    beamColor: "#a78bfa",
    spec: "SCOPE · ALL DECOY SESSIONS",
  },
  {
    value: 0, from: 10, decimals: 0, prefix: "", suffix: "",
    label: "[DB_CROSSOVER_EVENTS]",
    sublabel: "Real-to-decoy DB leaks",
    icon: Lock,
    color: "#10b981",
    beamColor: "#10b981",
    spec: "ISOLATION · STRUCTURAL",
  },
  {
    value: 38, from: 0, decimals: 0, prefix: "", suffix: "+",
    label: "[CANARY_ENDPOINTS_ACTIVE]",
    sublabel: "Bait endpoints seeded",
    icon: Terminal,
    color: "#f59e0b",
    beamColor: "#f59e0b",
    spec: "MODULE · canary/definitions.py",
  },
  {
    value: 7, from: 0, decimals: 0, prefix: "", suffix: "",
    label: "[ISOLATION_LAYER_COUNT]",
    sublabel: "Hermetically sealed tiers",
    icon: Layers2,
    color: "#22d3ee",
    beamColor: "#22d3ee",
    spec: "ARCH · SESSION → FORENSICS",
  },
  {
    value: 12, from: 0, decimals: 0, prefix: "", suffix: "",
    label: "[BEHAVIOURAL_SIGNAL_TYPES]",
    sublabel: "Passive telemetry signals",
    icon: TrendingUp,
    color: "#f59e0b",
    beamColor: "#f59e0b",
    spec: "OVERHEAD · <2ms PER REQUEST",
  },
  {
    value: 0, from: 5, decimals: 0, prefix: "", suffix: "",
    label: "[ESCALATION_REVERSAL_PATHS]",
    sublabel: "DECOY→REAL code paths",
    icon: GitBranch,
    color: "#ef4444",
    beamColor: "#ef4444",
    spec: "INVARIANT · ARCHITECTURAL",
  },
];

function Layers2({ size, strokeWidth, color, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color || "currentColor"} strokeWidth={strokeWidth || 1.5}
      strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5" opacity=".5"/>
      <path d="M2 12l10 5 10-5" opacity=".75"/>
    </svg>
  );
}

function StatCard({ stat, index, inView }) {
  const [hov, setHov] = useState(false);
  const Icon = stat.icon;
  const c = stat.color;

  const isFeatured = [0, 2].includes(index);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="relative overflow-hidden"
      style={{
        background: hov
          ? `linear-gradient(145deg, ${c}0b 0%, rgba(255,255,255,0.03) 100%)`
          : "rgba(255,255,255,0.028)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${hov ? `${c}32` : "rgba(255,255,255,0.08)"}`,
        boxShadow: hov
          ? `0 0 40px ${c}1a, 0 16px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)`
          : "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
        transition: "all 0.3s ease",
        padding: "28px 24px",
        cursor: "default",
      }}
    >
      {/* Grain */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: GRAIN, backgroundSize: "140px", opacity: 0.028, mixBlendMode: "overlay" }}
      />

      {/* Top-right glow */}
      <motion.div
        className="absolute -top-10 -right-10 rounded-full pointer-events-none"
        animate={{ opacity: hov ? 1 : 0 }}
        style={{ width: 160, height: 160, background: `radial-gradient(circle, ${c}18 0%, transparent 65%)` }}
      />

      {/* Beam on hover */}
      {hov && <BorderBeam color={c} duration={2.5} size={120} />}

      <div className="relative z-10 flex flex-col h-full">
        {/* Icon + Spec */}
        <div className="flex items-center justify-between mb-5">
          <div
            className="flex items-center justify-center border backdrop-blur-sm"
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: `${c}12`,
              borderColor: `${c}28`,
              boxShadow: hov ? `0 0 16px ${c}35` : `0 0 5px ${c}18`,
              transition: "box-shadow 0.3s ease",
            }}
          >
            <Icon size={16} color={c} strokeWidth={1.5} />
          </div>
          <span
            className="font-['JetBrains_Mono'] px-2 py-[3px] border"
            style={{ fontSize: 8, letterSpacing: "0.18em", color: `${c}65`, borderColor: `${c}22`, background: `${c}09` }}
          >
            {stat.spec}
          </span>
        </div>

        {/* Number */}
        <div
          className="font-['Space_Grotesk'] font-bold tracking-tighter leading-none mb-2"
          style={{ fontSize: "clamp(2rem, 3.2vw, 2.9rem)", color: c }}
        >
          <Counter
            from={stat.from} to={stat.value}
            decimals={stat.decimals}
            prefix={stat.prefix} suffix={stat.suffix}
          />
        </div>

        {/* Sublabel */}
        <div className="font-['Space_Grotesk'] text-[12px] font-medium text-white/45 mb-3 tracking-tight">
          {stat.sublabel}
        </div>

        {/* Mono label */}
        <div
          className="font-['JetBrains_Mono'] mt-auto pt-3"
          style={{ fontSize: 8, letterSpacing: "0.14em", color: `${c}55`, borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          {stat.label}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── LOGO MARQUEE ────────────────────────────────────────── */
const LOGOS = [
  { name: "FastAPI",      abbr: "FastAPI" },
  { name: "Redis",        abbr: "Redis" },
  { name: "PostgreSQL",   abbr: "Postgres" },
  { name: "MongoDB",      abbr: "MongoDB" },
  { name: "React",        abbr: "React" },
  { name: "Vite",         abbr: "Vite" },
  { name: "Docker",       abbr: "Docker" },
  { name: "Python",       abbr: "Python" },
  { name: "JWTAuth",      abbr: "JWT" },
  { name: "Uvicorn",      abbr: "Uvicorn" },
  { name: "Pydantic",     abbr: "Pydantic" },
  { name: "SQLAlchemy",   abbr: "SQLAlch" },
];

function LogoChip({ logo }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      animate={{
        borderColor: hov ? "rgba(34,211,238,0.4)" : "rgba(255,255,255,0.07)",
        background: hov ? "rgba(34,211,238,0.06)" : "rgba(255,255,255,0.025)",
        boxShadow: hov ? "0 0 16px rgba(34,211,238,0.2)" : "none",
      }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-2.5 px-5 py-3 border flex-shrink-0 backdrop-blur-sm cursor-default"
    >
      {/* Icon placeholder — styled monogram */}
      <div
        className="w-5 h-5 flex items-center justify-center text-[8px] font-['JetBrains_Mono'] font-bold rounded-sm"
        style={{
          background: hov ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.06)",
          color: hov ? "#22d3ee" : "rgba(255,255,255,0.3)",
          transition: "all 0.25s ease",
        }}
      >
        {logo.abbr[0]}
      </div>
      <span
        className="font-['JetBrains_Mono']"
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          color: hov ? "#22d3ee" : "rgba(255,255,255,0.28)",
          transition: "color 0.25s ease",
        }}
      >
        {logo.abbr}
      </span>
    </motion.div>
  );
}

function LogoMarquee() {
  const doubled = [...LOGOS, ...LOGOS];
  return (
    <div className="relative overflow-hidden">
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to right, #030a10, transparent)" }}
      />
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to left, #030a10, transparent)" }}
      />

      <motion.div
        className="flex gap-3 w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((logo, i) => (
          <LogoChip key={i} logo={logo} />
        ))}
      </motion.div>
    </div>
  );
}

/* ─── HERO AUDIT CARD (border beam showcase) ─────────────── */
function AuditCard({ inView }) {
  const [angle, setAngle] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    let a = 0;
    const tick = () => {
      a = (a + 0.4) % 360;
      setAngle(a);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      {/* Rotating conic border */}
      <div
        className="absolute -inset-[1.5px] pointer-events-none"
        style={{
          // background: `conic-gradient(from ${angle}deg at 50% 50%,
          //   transparent 0deg,
          //   rgba(34,211,238,0.0) 60deg,
          //   rgba(34,211,238,0.7) 90deg,
          //   rgba(34,211,238,0.0) 120deg,
          //   transparent 180deg,
          //   rgba(167,139,250,0.0) 240deg,
          //   rgba(167,139,250,0.5) 270deg,
          //   rgba(167,139,250,0.0) 300deg,
          //   transparent 360deg)`,
          borderRadius: 2,
        }}
      />

      {/* Static outer border */}
      <div className="absolute inset-0 pointer-events-none border border-white/[0.06] rounded-[1px]" />

      {/* Card body */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, rgba(34,211,238,0.04) 0%, rgba(255,255,255,0.025) 50%, rgba(167,139,250,0.03) 100%)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          padding: "48px 56px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Grain */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: GRAIN, backgroundSize: "160px", opacity: 0.03, mixBlendMode: "overlay" }}
        />

        {/* Deep centre radial — draws eye to centre */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(34,211,238,0.06) 0%, transparent 70%)" }}
        />

        {/* Top-left corner accent */}
        <div className="absolute top-0 left-0 w-32 h-32 pointer-events-none"
          // style={{ background: "radial-gradient(circle at 0% 0%, rgba(34,211,238,0.1), transparent 70%)" }}
        />
        {/* Bottom-right corner accent */}
        <div className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none"
          // style={{ background: "radial-gradient(circle at 100% 100%, rgba(167,139,250,0.08), transparent 70%)" }}
        />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="font-['JetBrains_Mono'] text-[9px] tracking-[0.26em] text-cyan-400/50 uppercase mb-3">
                Performance Audit · REF: PS-AUDIT-v1
              </div>
              <h2
                className="font-['Space_Grotesk'] font-bold tracking-tighter leading-[0.92] uppercase"
                style={{ fontSize: "clamp(2rem, 4vw, 3.6rem)", color: "#f1f5f9" }}
              >
                The Proof of
                <span style={{
                  WebkitTextStroke: "1.5px rgba(0,255,170,0.8)",
                  WebkitTextFillColor: "transparent",
                  marginLeft: "0.18em",
                }}>
                  Defense.
                </span>
              </h2>
            </div>

            {/* Live badge */}
            <div className="hidden md:flex flex-col items-end gap-2">
              <div className="flex items-center gap-2.5 px-3 py-2 border border-white/[0.08] backdrop-blur-sm bg-white/[0.03]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-35" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="font-['JetBrains_Mono'] text-[8px] tracking-[0.2em] text-emerald-400/70 uppercase">
                  Audit · Passing
                </span>
              </div>
              <div className="flex items-center gap-2">
                {["#22d3ee","#f59e0b","#a78bfa","#10b981","#ef4444"].map((c,i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: c, opacity: 0.6 }} />
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="font-['Space_Grotesk'] text-[14px] leading-[1.75] text-white/38 max-w-[600px] mb-12 tracking-[-0.005em]">
            Eight independently verifiable architectural guarantees.
            Not marketing claims —{" "}
            <span className="text-white/62 font-medium">measurable properties of the codebase itself</span>
            {" "}that hold at every layer simultaneously.
          </p>

          {/* 4-col stat grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.06] border border-white/[0.06]">
            {[
              { v: "99.9%",  l: "[UPTIME]",       c: "#22d3ee", sub: "Availability" },
              { v: "<2ms",   l: "[LATENCY]",      c: "#22d3ee", sub: "Overhead" },
              { v: "100%",   l: "[FORENSICS]",    c: "#a78bfa", sub: "Coverage" },
              { v: "0",      l: "[CROSSOVERS]",   c: "#10b981", sub: "DB Leaks" },
            ].map((s, i) => (
              <div key={i} className="bg-[#030a10] px-6 py-5">
                <div className="font-['Space_Grotesk'] font-bold tracking-tighter leading-none mb-1.5"
                  style={{ fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", color: s.c }}>
                  {s.v}
                </div>
                <div className="font-['Space_Grotesk'] text-[11px] font-medium text-white/40 mb-2.5">
                  {s.sub}
                </div>
                <div className="font-['JetBrains_Mono'] text-[7.5px] tracking-[0.14em]"
                  style={{ color: `${s.c}50` }}>
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── TECHNICAL WORKFLOW STRIP ───────────────────────────────────── */
const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Passive Observation",
    desc: "No inline blocking. PhantomShield attaches to your application layer asynchronously, evaluating API sequences and behavior heuristics with zero added latency.",
    color: "#22d3ee",
  },
  {
    step: "02",
    title: "One-Way Escalation",
    desc: "When risk exceeds the threshold, trust is permanently revoked. The active session is transparently re-bound to an identical, isolated decoy environment.",
    color: "#ef4444",
  },
  {
    step: "03",
    title: "Forensic Exploitation",
    desc: "Inside the decoy, all payloads are safely executed and captured. Attackers trigger Canary traps, generating high-fidelity threat signatures without risking production data.",
    color: "#10b981",
  },
];

function WorkflowCard({ stepData, index, inView }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay: 0.2 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="relative overflow-hidden"
      style={{
        background: hov ? `rgba(255,255,255,0.032)` : "rgba(255,255,255,0.024)",
        backdropFilter: "blur(18px)",
        border: `1px solid ${hov ? `${stepData.color}28` : "rgba(255,255,255,0.07)"}`,
        boxShadow: hov ? `0 0 28px ${stepData.color}14, 0 12px 40px rgba(0,0,0,0.4)` : "0 8px 28px rgba(0,0,0,0.35)",
        padding: "32px 28px",
        transition: "all 0.3s ease",
        cursor: "default",
      }}
    >
      {/* Grain */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: GRAIN, backgroundSize: "140px", opacity: 0.025, mixBlendMode: "overlay" }}
      />

      {/* Accent top rule on hover */}
      <div className="absolute top-0 left-0 right-0 h-1 transition-all duration-300"
        style={{ background: hov ? `${stepData.color}80` : "transparent" }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Step Number */}
        <div className="font-['Space_Grotesk'] font-bold mb-6 leading-none select-none transition-colors duration-300"
          style={{ fontSize: 32, color: hov ? stepData.color : `${stepData.color}40`, lineHeight: 1 }}>
          {stepData.step}.
        </div>

        <div className="font-['Space_Grotesk'] font-bold text-[18px] text-white mb-4 tracking-tight">
          {stepData.title}
        </div>

        <p className="font-['Space_Grotesk'] font-normal text-[13.5px] leading-[1.72]
          text-white/50 tracking-[-0.005em] mb-4 flex-grow">
          {stepData.desc}
        </p>

        <div className="pt-5 border-t border-white/[0.06] mt-auto">
           <div className="font-['JetBrains_Mono'] text-[8px] tracking-[0.14em] uppercase"
                style={{ color: `${stepData.color}60` }}>
             PHANTOM ENGINE // STAGE {stepData.step}
           </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── MAIN EXPORT ─────────────────────────────────────────── */
export default function PerformanceAudit() {
  const hRef  = useRef(null);
  const hV    = useInView(hRef,  { once: true, margin: "-60px" });
  const sRef  = useRef(null);
  const sV    = useInView(sRef,  { once: true, margin: "-80px" });
  const tRef  = useRef(null);
  const tV    = useInView(tRef,  { once: true, margin: "-60px" });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;700&display=swap');

        @keyframes liveRipple {
          0%  { transform:scale(1);   opacity:.4; }
          100%{ transform:scale(3.2); opacity:0; }
        }
      `}</style>

      <section
        className="relative overflow-hidden isolate"
        style={{ background: "linear-gradient(160deg, #030a10 0%, #020810 60%, #040c14 100%)" }}
      >
        {/* 40px grid */}
        <div className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34,211,238,0.022) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34,211,238,0.022) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Section-wide grain */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.032] z-0"
          style={{ backgroundImage: GRAIN, backgroundSize: "200px", mixBlendMode: "overlay" }}
        />

        {/* Deep centre radial — draws focus */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"
          style={{
            width: 900, height: 600,
            background: "radial-gradient(ellipse, rgba(34,211,238,0.055) 0%, transparent 65%)",
          }}
        />
        <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
          style={{
            background: "radial-gradient(ellipse, rgba(167,139,250,0.03) 0%, transparent 60%)",
          }}
        />

        {/* ── HEADER ── */}
        <div className="absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
          style={{
            background: "radial-gradient(ellipse, rgba(34,211,238,0.035) 0%, transparent 60%)",
          }}
        />
        <motion.div
          className="absolute left-0 right-0 h-px z-0"
          style={{ background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.25), transparent)" }}
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />

        <div ref={hRef} className="relative z-10 max-w-[88rem] mx-auto px-6 sm:px-10 pt-28 pb-14">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={hV ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55 }}
            className="flex items-center gap-3 mb-12"
          >
            <div className="relative w-2 h-2 flex-shrink-0">
              <span className="absolute inset-0 rounded-full bg-cyan-400 opacity-30"
                style={{ animation: "liveRipple 2.2s ease-out infinite" }}
              />
              <span className="absolute inset-[2px] rounded-full bg-cyan-400" />
            </div>
            <span className="font-['JetBrains_Mono'] text-[9px] tracking-[0.26em] text-cyan-400/55 uppercase">
              PhantomShield · Social Proof · The Proof of Defense
            </span>
            <div className="flex-1 h-px"
              style={{ background: "linear-gradient(90deg,rgba(34,211,238,0.16),transparent)" }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={hV ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.85, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="font-['JetBrains_Mono'] text-[10px] tracking-[0.1em] text-cyan-400/28 mb-4">
              // Eight guarantees. Each one measurable. None of them marketing.
            </div>
            <h2
              className="font-['Space_Grotesk'] font-bold uppercase tracking-tighter leading-[0.9]"
              style={{ fontSize: "clamp(3.5rem,8vw,8.5rem)", color: "#f1f5f9" }}
            >
              PERFORMANCE
              <span style={{
                WebkitTextStroke: "1.5px rgba(0,255,170,0.8)",
                WebkitTextFillColor: "transparent",
                marginLeft: "0.15em",
              }}>
                AUDIT.
              </span>
            </h2>
          </motion.div>
        </div>

        {/* ── HERO AUDIT CARD ── */}
        <div className="relative z-10 max-w-[88rem] mx-auto px-6 sm:px-10 pb-14">
          <AuditCard inView={hV} />
        </div>

        {/* ── 8-STAT GRID ── */}
        <div ref={sRef} className="relative z-10 max-w-[88rem] mx-auto px-6 sm:px-10 pb-20">
          <div className="flex items-center gap-3 mb-8">
            <span className="font-['JetBrains_Mono'] text-[8px] tracking-[0.22em] text-white/22 uppercase">
              Detailed Metrics
            </span>
            <div className="flex-1 h-px"
              style={{ background: "linear-gradient(90deg, rgba(34,211,238,0.12), transparent)" }}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-[10px]">
            {STATS.map((stat, i) => (
              <StatCard key={i} stat={stat} index={i} inView={sV} />
            ))}
          </div>
        </div>



        {/* ── WORKFLOW TRINITY ── */}
        <div ref={tRef} className="relative z-10 max-w-[88rem] mx-auto px-6 sm:px-10 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={tV ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-8"
          >
            <span className="font-['JetBrains_Mono'] text-[8px] tracking-[0.22em] text-white/22 uppercase">
              System Architecture Flow
            </span>
            <div className="flex-1 h-px"
              style={{ background: "linear-gradient(90deg, rgba(34,211,238,0.12), transparent)" }}
            />
            <span className="font-['JetBrains_Mono'] text-[8px] tracking-[0.2em] text-white/18 uppercase">
              Automated Lifecycle
            </span>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[10px]">
            {WORKFLOW_STEPS.map((step, i) => (
              <WorkflowCard key={i} stepData={step} index={i} inView={tV} />
            ))}
          </div>
        </div>



      </section>
    </>
  );
}
