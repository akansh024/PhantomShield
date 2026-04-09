import { useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform, useSpring } from "framer-motion";
import {
  KeyRound, Database, Radar, Brain,
  GitBranch, Ghost, Crosshair, ShieldAlert,
  ChevronRight, ArrowDown,
} from "lucide-react";

const STEPS = [
  {
    id: "P-01",
    icon: KeyRound,
    title: "User Authenticates",
    tagline: "Identity confirmed. Trust unassigned.",
    body: "Credentials are verified and a JWT token is issued. Authentication proves identity — nothing more. Trust state is never derived from the token itself.",
    tags: ["app/api/auth/", "core/security.py"],
    color: "#22d3ee",
    metric: { v: "RS256", l: "Algorithm" },
    side: "right",
  },
  {
    id: "P-02",
    icon: Database,
    title: "Session Initialised",
    tagline: "Server-side. Redis. Score zero.",
    body: "A server-side session is created in Redis with risk_score 0.0, routing_state REAL, and last_activity timestamp. This session — not the JWT — is the authoritative source of trust.",
    tags: ["session/store.py", "session/models.py"],
    color: "#22d3ee",
    metric: { v: "0.00", l: "Initial Risk" },
    side: "left",
  },
  {
    id: "P-03",
    icon: Radar,
    title: "Behaviour Monitored",
    tagline: "Passive. Silent. Sub-2ms.",
    body: "Every request passes through the telemetry middleware. API enumeration depth, navigation velocity, endpoint access patterns, and payload shape anomalies are extracted without the user's knowledge.",
    tags: ["middleware/telemetry.py", "behavior/features.py"],
    color: "#f59e0b",
    metric: { v: "12", l: "Signal Types" },
    side: "right",
  },
  {
    id: "P-04",
    icon: Brain,
    title: "Risk Scored",
    tagline: "Advisory only. Never routes.",
    body: "Behavioural signals are weighted and combined into a 0–1 risk score. The scorer is purely advisory — it calculates threat probability and nothing else. Temporal decay is applied between requests.",
    tags: ["risk/scorer.py", "risk/thresholds.py"],
    color: "#f59e0b",
    metric: { v: "0.74", l: "Threshold Hit" },
    side: "left",
  },
  {
    id: "P-05",
    icon: GitBranch,
    title: "Policy Decides",
    tagline: "Sole authority. One law.",
    body: "The policy engine reads the risk score and applies escalation rules. It is the only component that can change routing_state. REAL → DECOY is a one-way, architecturally irreversible transition.",
    tags: ["policy/engine.py", "policy/rules.py"],
    color: "#ef4444",
    metric: { v: "0.65", l: "Threshold" },
    side: "right",
  },
  {
    id: "P-06",
    icon: Ghost,
    title: "Attacker Isolated",
    tagline: "Inside the phantom. Unaware.",
    body: "Routing middleware silently re-binds all requests to the decoy system. Fake APIs return believable data from MongoDB. The attacker can probe for hours and never detect the fiction.",
    tags: ["api/decoy/routes.py", "db/mongo/repo.py"],
    color: "#ef4444",
    metric: { v: "100%", l: "Fidelity" },
    side: "left",
  },
  {
    id: "P-07",
    icon: Crosshair,
    title: "Canaries Armed",
    tagline: "Bait set. Intelligence primed.",
    body: "38+ decoy endpoints are seeded throughout the phantom. A single access triggers deep forensic capture mode, spikes the risk score, and begins compound signal collection.",
    tags: ["canary/definitions.py", "canary/detector.py"],
    color: "#a78bfa",
    metric: { v: "38+", l: "Bait Endpoints" },
    side: "right",
  },
  {
    id: "P-08",
    icon: ShieldAlert,
    title: "Intelligence Captured",
    tagline: "Every move. Catalogued. Weaponised.",
    body: "Every decoy interaction is logged with full fidelity — session ID, endpoint, payload, headers, timing, and canary status. The attacker's entire operation is reconstructed into a threat intelligence timeline.",
    tags: ["forensics/logger.py", "forensics/timeline.py"],
    color: "#10b981",
    metric: { v: "100%", l: "Coverage" },
    side: "left",
  },
];

/* ─── ANIMATED FILL LINE ─────────────────────────────────── */
function FillLine({ inView, color, vertical = false }) {
  return (
    <div className={`relative ${vertical ? "w-px" : "h-px"} overflow-hidden`}
      style={{ background: "rgba(255,255,255,0.07)" }}>
      <motion.div
        className={`absolute ${vertical ? "inset-x-0 top-0" : "inset-y-0 left-0"}`}
        style={{
          background: `linear-gradient(${vertical ? "to bottom" : "to right"}, ${color}, ${color}80)`,
          [vertical ? "height" : "width"]: inView ? "100%" : "0%",
        }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

/* ─── ICON ORBS ─────────────────────────────────────────── */
function IconOrb({ Icon, color, hovered }) {
  return (
    <div className="relative flex-shrink-0">
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{ scale: hovered ? 1.35 : 1, opacity: hovered ? 0.5 : 0.2 }}
        transition={{ duration: 0.4 }}
        style={{ background: `radial-gradient(circle, ${color}40, transparent 70%)` }}
      />
      {/* Glass orb */}
      <motion.div
        className="relative w-14 h-14 rounded-full flex items-center justify-center
          backdrop-blur-xl border"
        animate={{
          boxShadow: hovered ? `0 0 22px ${color}50, inset 0 0 16px ${color}15` : `0 0 8px ${color}25`,
          borderColor: hovered ? `${color}55` : `${color}22`,
          background: hovered ? `${color}18` : `${color}0d`,
        }}
        transition={{ duration: 0.3 }}
      >
        <Icon size={20} style={{ color }} strokeWidth={1.5} />
      </motion.div>
    </div>
  );
}

/* ─── STEP CARD ─────────────────────────────────────────── */
function StepCard({ step, index, isLast }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [hovered, setHovered] = useState(false);
  const Icon = step.icon;
  const isRight = step.side === "right";

  return (
    <div ref={ref} className="relative">
      {/* ── DESKTOP LAYOUT ── */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_80px_1fr] items-start gap-0">

        {/* LEFT SLOT */}
        <div className={`${isRight ? "pr-8 flex justify-end" : "pr-8"}`}>
          {isRight && (
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.75, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[440px]"
            >
              <Card step={step} hovered={hovered} setHovered={setHovered} inView={inView} Icon={Icon} />
            </motion.div>
          )}
        </div>

        {/* CENTRE — spine + node */}
        <div className="flex flex-col items-center">
          {/* Top connector */}
          {index > 0 && (
            <div className="w-px flex-1 min-h-[32px]"
              style={{
                borderLeft: `1px dashed rgba(255,255,255,0.1)`,
                background: "none",
              }}
            />
          )}
          {index === 0 && <div className="min-h-[32px]" />}

          {/* Node */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative flex-shrink-0 z-10"
          >
            {/* Outer pulse */}
            {hovered && (
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{ background: step.color }}
              />
            )}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center border backdrop-blur-xl"
              style={{
                background: `${step.color}18`,
                borderColor: `${step.color}45`,
                boxShadow: hovered ? `0 0 20px ${step.color}50` : `0 0 8px ${step.color}25`,
                transition: "box-shadow 0.3s ease",
              }}
            >
              <Icon size={16} style={{ color: step.color }} strokeWidth={1.5} />
            </div>
          </motion.div>

          {/* Bottom connector + fill */}
          {!isLast && (
            <div className="flex-1 w-px min-h-[80px] relative overflow-hidden"
              style={{ borderLeft: "1px dashed rgba(255,255,255,0.07)" }}>
              <motion.div
                className="absolute top-0 left-0 w-px"
                initial={{ height: "0%" }}
                animate={inView ? { height: "100%" } : {}}
                transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                style={{ background: `linear-gradient(to bottom, ${step.color}80, transparent)` }}
              />
            </div>
          )}
        </div>

        {/* RIGHT SLOT */}
        <div className={`${!isRight ? "pl-8" : "pl-8"}`}>
          {!isRight && (
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.75, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[440px]"
            >
              <Card step={step} hovered={hovered} setHovered={setHovered} inView={inView} Icon={Icon} />
            </motion.div>
          )}
        </div>
      </div>

      {/* ── MOBILE LAYOUT ── */}
      <div className="lg:hidden flex gap-5">
        {/* Left spine */}
        <div className="flex flex-col items-center flex-shrink-0 w-10">
          {index > 0 && <div className="w-px flex-none h-8" style={{ borderLeft: "1px dashed rgba(255,255,255,0.1)" }} />}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.45, delay: 0.1, type: "spring" }}
            className="w-10 h-10 rounded-full flex items-center justify-center border backdrop-blur-xl flex-shrink-0"
            style={{
              background: `${step.color}18`,
              borderColor: `${step.color}45`,
              boxShadow: `0 0 10px ${step.color}30`,
            }}
          >
            <Icon size={16} style={{ color: step.color }} strokeWidth={1.5} />
          </motion.div>
          {!isLast && (
            <div className="w-px flex-1 min-h-[20px]" style={{ borderLeft: "1px dashed rgba(255,255,255,0.08)" }} />
          )}
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 pb-6"
        >
          <Card step={step} hovered={hovered} setHovered={setHovered} inView={inView} Icon={Icon} mobile />
        </motion.div>
      </div>
    </div>
  );
}

/* ─── GLASS CARD ─────────────────────────────────────────── */
function Card({ step, hovered, setHovered, inView, Icon, mobile = false }) {
  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={{
        boxShadow: hovered
          ? `0 0 40px ${step.color}20, 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)`
          : `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)`,
        borderColor: hovered ? `${step.color}35` : "rgba(255,255,255,0.08)",
      }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden border backdrop-blur-xl cursor-default"
      style={{
        background: hovered
          ? `linear-gradient(135deg, ${step.color}07 0%, rgba(255,255,255,0.025) 100%)`
          : "rgba(255,255,255,0.025)",
        padding: mobile ? "20px" : "28px",
      }}
    >
      {/* Noise */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "160px",
          mixBlendMode: "overlay",
        }}
      />

      {/* Top-right corner glow on hover */}
      <motion.div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
        animate={{ opacity: hovered ? 1 : 0 }}
        style={{ background: `radial-gradient(circle, ${step.color}18 0%, transparent 70%)` }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between mb-5">
        <IconOrb Icon={Icon} color={step.color} hovered={hovered} />

        {/* Protocol ID */}
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="font-['JetBrains_Mono'] font-semibold px-2 py-1 border"
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              color: step.color,
              borderColor: `${step.color}30`,
              background: `${step.color}0d`,
            }}
          >
            {step.id}
          </span>
          {step.metric && (
            <div className="text-right">
              <div className="font-['Space_Grotesk'] font-bold tracking-tight"
                style={{ fontSize: 18, color: step.color, lineHeight: 1 }}>
                {step.metric.v}
              </div>
              <div className="font-['JetBrains_Mono'] text-[7px] tracking-[0.16em] text-white/25 uppercase mt-0.5">
                {step.metric.l}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h3
        className="font-['Space_Grotesk'] font-bold tracking-tight leading-[1.1] mb-2"
        style={{
          fontSize: "clamp(1.15rem, 1.8vw, 1.45rem)",
          color: hovered ? "#ffffff" : "#dde4ee",
          transition: "color 0.25s ease",
        }}
      >
        {step.title}
      </h3>

      {/* Tagline */}
      <div className="font-['JetBrains_Mono'] text-[9px] tracking-[0.18em] mb-4"
        style={{ color: `${step.color}70` }}>
        {step.tagline}
      </div>

      {/* Body */}
      <p className="font-['Space_Grotesk'] font-normal text-[13.5px] leading-[1.72]
        text-white/38 mb-5 tracking-[-0.005em]">
        {step.body}
      </p>

      {/* File path tags */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-white/[0.06]">
        {step.tags.map((t) => (
          <span key={t}
            className="font-['JetBrains_Mono'] text-[7.5px] tracking-[0.12em] text-white/25
              px-2 py-1 border border-white/[0.06] uppercase">
            {t}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── PROGRESS INDICATOR ─────────────────────────────────── */
function ProgressDots({ activeIndex }) {
  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-3">
      {STEPS.map((s, i) => (
        <motion.div
          key={s.id}
          animate={{
            width: i === activeIndex ? 20 : 4,
            opacity: i <= activeIndex ? 1 : 0.3,
          }}
          transition={{ duration: 0.3 }}
          className="h-[3px] rounded-full"
          style={{ background: i === activeIndex ? s.color : "rgba(255,255,255,0.2)" }}
        />
      ))}
    </div>
  );
}

/* ─── MAIN EXPORT ────────────────────────────────────────── */
export default function HowItWorks() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });
  const [activeStep, setActiveStep] = useState(0);

  const [headerRef, headerInView] = [useRef(null), false];
  const hRef = useRef(null);
  const hV = useInView(hRef, { once: true, margin: "-50px" });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;700&display=swap');

        @keyframes liveRipple {
          0%  { transform:scale(1);   opacity:.4; }
          100%{ transform:scale(3);   opacity:0; }
        }
      `}</style>

      <section
        ref={containerRef}
        className="relative overflow-hidden isolate"
        style={{ background: "linear-gradient(160deg, #030a10 0%, #020810 60%, #040c14 100%)" }}
      >
        {/* Grid bg */}
        <div className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34,211,238,0.022) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34,211,238,0.022) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Grain */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px",
            mixBlendMode: "overlay",
          }}
        />

        {/* Glow blobs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] pointer-events-none z-0"
          style={{ background: "radial-gradient(ellipse, rgba(34,211,238,0.055) 0%, transparent 65%)" }}
        />
        <div className="absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
          style={{ background: "radial-gradient(ellipse, rgba(34,211,238,0.035) 0%, transparent 60%)" }}
        />
        <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
          style={{ background: "radial-gradient(ellipse, rgba(167,139,250,0.03) 0%, transparent 60%)" }}
        />
        <motion.div
          className="absolute left-0 right-0 h-px z-0"
          style={{ background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.25), transparent)" }}
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />

        {/* ── HEADER ── */}
        <div ref={hRef} className="relative z-10 max-w-[88rem] mx-auto px-6 sm:px-10 pt-28 pb-20">
          {/* Overline */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={hV ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55 }}
            className="flex items-center gap-3 mb-12"
          >
            <div className="relative w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-cyan-400 opacity-30"
                style={{ animation: "liveRipple 2.2s ease-out infinite" }} />
              <span className="absolute inset-[2px] rounded-full bg-cyan-400" />
            </div>
            <span className="font-['JetBrains_Mono'] text-[9px] tracking-[0.26em] text-cyan-400/55 uppercase">
              PhantomShield · Operational Sequence · 8 Stages
            </span>
            <div className="flex-1 h-px"
              style={{ background: "linear-gradient(90deg, rgba(34,211,238,0.15), transparent)" }}
            />
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={hV ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.85, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="font-['JetBrains_Mono'] text-[11px] tracking-[0.1em] text-cyan-400/30 mb-4">
              // From authentication to full forensic capture — eight deterministic stages.
            </div>
            <h2
              className="font-['Space_Grotesk'] font-bold uppercase tracking-tighter leading-[0.9]"
              style={{ fontSize: "clamp(3rem, 7.5vw, 7.5rem)", color: "#f1f5f9" }}
            >
              THE
              <span style={{
                WebkitTextStroke: "1.5px rgba(0,255,170,0.8)",
                WebkitTextFillColor: "transparent",
                marginLeft: "0.18em",
              }}>
                LOGIC
              </span>
              <span style={{ color: "#f1f5f9", marginLeft: "0.18em" }}>FLOW.</span>
            </h2>
          </motion.div>

          {/* Sub row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={hV ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 flex items-end justify-between gap-10 border-t pt-7"
            style={{ borderColor: "rgba(34,211,238,0.07)" }}
          >
            <p className="font-['Space_Grotesk'] text-[15px] leading-[1.75] text-white/38
              max-w-[520px] tracking-[-0.005em]">
              Every stage is deterministic, isolated, and architecturally enforced.
              No configuration toggle. No ambiguity. No path back.
            </p>
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              {STEPS.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color, opacity: 0.7 }} />
                  {i < STEPS.length - 1 && (
                    <div className="w-6 h-px" style={{ borderTop: "1px dashed rgba(255,255,255,0.1)" }} />
                  )}
                </div>
              ))}
              <span className="font-['JetBrains_Mono'] text-[8px] tracking-[0.15em]
                text-white/22 uppercase ml-3">
                8 / 8 stages
              </span>
            </div>
          </motion.div>
        </div>

        {/* ── STEPS ── */}
        <div className="relative z-10 max-w-[88rem] mx-auto px-6 sm:px-10 pb-32">
          {/* Outer spine background (desktop only) */}
          <div className="hidden lg:block absolute left-1/2 -translate-x-1/2"
            style={{
              top: "auto", width: 1,
              borderLeft: "1px dashed rgba(255,255,255,0.05)",
              height: "100%",
            }}
          />

          <div className="flex flex-col gap-0">
            {STEPS.map((step, index) => (
              <StepCard
                key={step.id}
                step={step}
                index={index}
                isLast={index === STEPS.length - 1}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
