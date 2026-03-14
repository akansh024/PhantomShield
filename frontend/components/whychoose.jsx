import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  ShieldCheck, GitMerge, ScanLine, Layers,
  Lock, Zap, Eye, Database, Terminal,
  FlaskConical, Network, FileSearch,
} from "lucide-react";

const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/* ─── FEATURE DATA ─────────────────────────────────────────── */
const FEATURES = [
  /* ── HERO (large 2×2) ── */
  {
    id: "F-01", size: "hero",
    icon: ShieldCheck,
    color: "#22d3ee",
    title: "Deception-First Architecture",
    tagline: "Not a bolt-on. The entire foundation.",
    body: "Every layer — session, middleware, risk, policy, database — is engineered around active deception from the first import. The separation between real and phantom is structural, not configured.",
    specs: ["APP LAYER · 7 TIERS", "ISOLATION · STRUCTURAL", "CROSSOVER PATHS · 0"],
    stat: { v: "7", l: "Isolated Layers" },
    accent: false,
  },
  /* ── TALL ── */
  {
    id: "F-02", size: "tall",
    icon: Lock,
    color: "#22d3ee",
    title: "Auth ≠ Trust",
    tagline: "Identity proven. Trust unassigned.",
    body: "JWT proves who you are. A server-side Redis session decides what you're allowed to do. The two are permanently, architecturally decoupled.",
    specs: ["JWT · RS256", "SESSION STORE · REDIS", "TTL · CONFIGURABLE"],
    stat: { v: "0", l: "Trust from Token" },
    accent: false,
  },
  /* ── WIDE ── */
  {
    id: "F-03", size: "wide",
    icon: GitMerge,
    color: "#ef4444",
    title: "One-Way Escalation Law",
    tagline: "REAL → DECOY. Irreversible. Absolute.",
    body: "Escalation is not a rule stored in config — it is a non-existent code path. No admin flag, no runtime condition, no override can return a session to the real system once escalated.",
    specs: ["DIRECTION · REAL → DECOY", "REVERSAL PATHS · 0", "ENFORCEMENT · ARCH-LEVEL"],
    stat: { v: "∞", l: "Deception Duration" },
    accent: false,
  },
  /* ── STANDARD ── */
  {
    id: "F-04", size: "standard",
    icon: ScanLine,
    color: "#f59e0b",
    title: "Passive Telemetry",
    tagline: "12 signals. Sub-2ms. Silent.",
    body: "API enumeration depth, navigation velocity, payload shape, and endpoint access patterns — all extracted below attacker detection threshold.",
    specs: ["SIGNALS · 12 TYPES", "OVERHEAD · <2ms", "MODE · PASSIVE"],
    stat: null,
    accent: false,
  },
  /* ── STANDARD ── */
  {
    id: "F-05", size: "standard",
    icon: Layers,
    color: "#f59e0b",
    title: "Advisory Risk Engine",
    tagline: "Scores advice. Never sentences.",
    body: "Risk scorer calculates 0–1 threat probability and nothing else. Routing authority belongs exclusively to the policy engine — single responsibility enforced architecturally.",
    specs: ["RANGE · 0.0–1.0", "ROLE · ADVISORY", "DECAY · TEMPORAL"],
    stat: null,
    accent: false,
  },
  /* ── ACCENT (large, glowing) ── */
  {
    id: "F-06", size: "accent",
    icon: Eye,
    color: "#a78bfa",
    title: "Full-Spectrum Forensics",
    tagline: "Every move. Every payload. Reconstructed.",
    body: "Session ID, endpoint, headers, payload, timing, and canary status — all captured at 100% coverage and indexed into a reconstructible attacker timeline.",
    specs: ["COVERAGE · 100%", "FIELDS · SESSION · ENDPOINT · PAYLOAD · TS", "STORE · MONGODB"],
    stat: { v: "100%", l: "Capture Rate" },
    accent: true,
  },
  /* ── STANDARD ── */
  {
    id: "F-07", size: "standard",
    icon: Database,
    color: "#10b981",
    title: "Hard DB Isolation",
    tagline: "Postgres and Mongo. Never bridged.",
    body: "No shared ORM, no shared connection pool, no import path between real and decoy databases. Structural isolation that cannot be misconfigured.",
    specs: ["REAL DB · POSTGRESQL", "DECOY DB · MONGODB", "BRIDGE PATHS · 0"],
    stat: null,
    accent: false,
  },
  /* ── STANDARD ── */
  {
    id: "F-08", size: "standard",
    icon: FlaskConical,
    color: "#10b981",
    title: "Attack Simulation",
    tagline: "Three simulators. Built in.",
    body: "api_enumeration · sensitive_probe · slow_attacker — each produces real telemetry against the live stack, verifying risk scoring, policy escalation, and forensic capture.",
    specs: ["SCENARIOS · 3", "OUTPUT · REAL TELEMETRY", "PATH · attacks/scenarios/"],
    stat: null,
    accent: false,
  },
  /* ── WIDE ── */
  {
    id: "F-09", size: "wide",
    icon: Network,
    color: "#22d3ee",
    title: "Frontend Deception Transparency",
    tagline: "The UI never knows. The attacker never knows.",
    body: "The React frontend calls normal API endpoints. Routing decisions are entirely server-side. The interface has zero knowledge of real vs decoy state — preserving the illusion completely for any session duration.",
    specs: ["ROUTING · SERVER-SIDE ONLY", "FRONTEND AWARENESS · NONE", "STACK · REACT · VITE"],
    stat: { v: "0", l: "Client-Side Tells" },
    accent: false,
  },
  /* ── STANDARD ── */
  {
    id: "F-10", size: "standard",
    icon: Zap,
    color: "#22d3ee",
    title: "Canary Trap System",
    tagline: "Bait that bites back.",
    body: "38+ seeded decoy endpoints. A single access arms deep forensic mode and compounds risk score immediately with no false positive pathway.",
    specs: ["ENDPOINTS · 38+", "FALSE POSITIVES · 0", "MODULE · canary/"],
    stat: null,
    accent: false,
  },
  /* ── STANDARD ── */
  {
    id: "F-11", size: "standard",
    icon: Terminal,
    color: "#a78bfa",
    title: "Policy Engine Authority",
    tagline: "One decision. One component.",
    body: "The policy engine holds sole routing authority. No other module, middleware, or external input can set routing_state. Clean, auditable, and architecturally guaranteed.",
    specs: ["AUTHORITY · EXCLUSIVE", "INPUTS · RISK SCORE", "MODULE · policy/engine.py"],
    stat: null,
    accent: false,
  },
  /* ── STANDARD ── */
  {
    id: "F-12", size: "standard",
    icon: FileSearch,
    color: "#a78bfa",
    title: "Threat Intelligence Timeline",
    tagline: "Attack patterns. Fully reconstructed.",
    body: "Every canary hit, every payload, every timing anomaly is indexed into a chronological attacker timeline. Intelligence compounds the longer they operate.",
    specs: ["RESOLUTION · PER-REQUEST", "MODULE · forensics/timeline.py", "EXPORT · JSON"],
    stat: null,
    accent: false,
  },
];

/* ─── CARD COMPONENT ─────────────────────────────────────── */
function FeatureCard({ feat, delay = 0, inView }) {
  const [hov, setHov] = useState(false);
  const Icon = feat.icon;
  const c = feat.color;

  const isHero   = feat.size === "hero";
  const isAccent = feat.accent;
  const isTall   = feat.size === "tall";

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="relative overflow-hidden h-full"
      style={{
        background: isAccent
          ? `linear-gradient(145deg, ${c}14 0%, rgba(255,255,255,0.03) 60%)`
          : hov
          ? `linear-gradient(145deg, ${c}09 0%, rgba(255,255,255,0.028) 100%)`
          : "rgba(255,255,255,0.026)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${hov || isAccent ? `${c}${isAccent ? "35" : "28"}` : "rgba(255,255,255,0.08)"}`,
        borderRadius: 0,
        boxShadow: hov
          ? `0 0 36px ${c}18, 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)`
          : isAccent
          ? `0 0 48px ${c}22, 0 16px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)`
          : "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)",
        transition: "all 0.32s ease",
        cursor: "default",
        padding: isHero ? "36px" : isTall ? "32px" : "28px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Grain overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: GRAIN,
          backgroundSize: "140px",
          opacity: 0.03,
          mixBlendMode: "overlay",
        }}
      />

      {/* Top glow on hover */}
      <motion.div
        className="absolute -top-20 -right-20 rounded-full pointer-events-none"
        animate={{ opacity: hov ? 1 : isAccent ? 0.6 : 0, scale: hov ? 1 : 0.8 }}
        transition={{ duration: 0.4 }}
        style={{
          width: isHero ? 280 : 200,
          height: isHero ? 280 : 200,
          background: `radial-gradient(circle, ${c}20 0%, transparent 65%)`,
        }}
      />

      {/* Accent left edge line */}
      {isAccent && (
        <div className="absolute left-0 top-6 bottom-6 w-[2px]"
          style={{ background: `linear-gradient(to bottom, transparent, ${c}70, transparent)` }}
        />
      )}

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col h-full">

        {/* Header row */}
        <div className="flex items-start justify-between mb-5">
          {/* Icon */}
          <motion.div
            animate={{
              boxShadow: hov ? `0 0 20px ${c}45` : `0 0 6px ${c}20`,
              background: hov ? `${c}1a` : `${c}0f`,
              borderColor: hov ? `${c}45` : `${c}22`,
            }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center border backdrop-blur-sm flex-shrink-0"
            style={{
              width: isHero ? 56 : 48,
              height: isHero ? 56 : 48,
              borderRadius: 14,
            }}
          >
            <Icon
              strokeWidth={1.5}
              style={{ color: c }}
              size={isHero ? 22 : 18}
            />
          </motion.div>

          {/* Top-right: ID + optional stat */}
          <div className="flex flex-col items-end gap-2">
            <span
              className="font-['JetBrains_Mono'] font-semibold px-2 py-[3px] border"
              style={{
                fontSize: 10,
                letterSpacing: "0.18em",
                color: c,
                borderColor: `${c}28`,
                background: `${c}0c`,
              }}
            >
              {feat.id}
            </span>
            {feat.stat && (
              <div className="text-right">
                <div
                  className="font-['Space_Grotesk'] font-bold leading-none"
                  style={{ fontSize: isHero ? 28 : 20, color: c, letterSpacing: "-0.04em" }}
                >
                  {feat.stat.v}
                </div>
                <div className="font-['JetBrains_Mono'] text-[7px] tracking-[0.16em] text-white/25 uppercase mt-0.5">
                  {feat.stat.l}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tagline */}
        <div
          className="font-['JetBrains_Mono'] mb-3"
          style={{
            fontSize: 9,
            letterSpacing: "0.2em",
            color: `${c}70`,
            textTransform: "uppercase",
          }}
        >
          {feat.tagline}
        </div>

        {/* Title */}
        <h3
          className="font-['Space_Grotesk'] font-bold tracking-tight leading-[1.1] mb-3"
          style={{
            fontSize: isHero ? "clamp(1.4rem, 2vw, 1.9rem)" : "clamp(1rem, 1.5vw, 1.3rem)",
            color: hov ? "#ffffff" : "#dde4ee",
            transition: "color 0.25s ease",
          }}
        >
          {feat.title}
        </h3>

        {/* Body */}
        <p
          className="font-['Space_Grotesk'] font-normal leading-[1.72] text-white/38 tracking-[-0.005em] flex-1"
          style={{ fontSize: isHero ? "14px" : "13px" }}
        >
          {feat.body}
        </p>

        {/* System specs — JetBrains Mono metadata */}
        <div
          className="mt-5 pt-4 flex flex-wrap gap-x-4 gap-y-1.5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          {feat.specs.map((s, i) => (
            <span
              key={i}
              className="font-['JetBrains_Mono'] uppercase"
              style={{
                fontSize: 8,
                letterSpacing: "0.15em",
                color: i === 0 ? `${c}70` : "rgba(255,255,255,0.22)",
                lineHeight: 1.6,
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── MAIN EXPORT ─────────────────────────────────────────── */
export default function WhyChooseUs() {
  const hRef = useRef(null);
  const gRef = useRef(null);
  const hV   = useInView(hRef, { once: true, margin: "-60px" });
  const gV   = useInView(gRef, { once: true, margin: "-80px" });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;700&display=swap');

        @keyframes breathe {
          0%,100%{ opacity:.048; transform:scale(1);    }
          50%    { opacity:.09;  transform:scale(1.04); }
        }
        @keyframes liveRipple {
          0%  { transform:scale(1);   opacity:.4; }
          100%{ transform:scale(3.2); opacity:0; }
        }
        @keyframes ticker {
          0%  { transform:translateX(0); }
          100%{ transform:translateX(-50%); }
        }
      `}</style>

      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(180deg,#030a10 0%,#020810 100%)" }}
      >
        {/* 40px grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34,211,238,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34,211,238,0.02) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Grain */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: GRAIN, backgroundSize: "220px", mixBlendMode: "overlay" }}
        />

        {/* Glow pools */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: 900, height: 600,
            background: "radial-gradient(ellipse,rgba(34,211,238,0.048) 0%,transparent 65%)",
            animation: "breathe 11s ease-in-out infinite",
          }}
        />
        <div className="absolute bottom-1/4 right-0 pointer-events-none"
          style={{
            width: 500, height: 500,
            background: "radial-gradient(ellipse,rgba(167,139,250,0.035) 0%,transparent 65%)",
            animation: "breathe 15s ease-in-out infinite 5s",
          }}
        />

        {/* ── HEADER ── */}
        <div ref={hRef} className="max-w-[88rem] mx-auto px-6 sm:px-10 pt-28 pb-16">
          {/* Overline */}
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
              PhantomShield · Feature Matrix · 12 Capabilities
            </span>
            <div className="flex-1 h-px"
              style={{ background: "linear-gradient(90deg,rgba(34,211,238,0.15),transparent)" }}
            />
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={hV ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.85, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="font-['JetBrains_Mono'] text-[10px] tracking-[0.1em] text-cyan-400/28 mb-4">
              // Twelve architectural capabilities. Each one non-negotiable.
            </div>
            <h2
              className="font-['Space_Grotesk'] font-bold uppercase tracking-tighter leading-[0.9]"
              style={{ fontSize: "clamp(3rem,7.5vw,7.5rem)", color: "#f1f5f9" }}
            >
              BUILT AT
              <span style={{
                WebkitTextStroke: "1.5px rgba(34,211,238,0.65)",
                WebkitTextFillColor: "transparent",
                marginLeft: "0.18em",
              }}>
                THE LIMIT.
              </span>
            </h2>
          </motion.div>

          {/* Sub row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={hV ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.28 }}
            className="mt-10 flex flex-wrap items-end justify-between gap-8 border-t pt-7"
            style={{ borderColor: "rgba(34,211,238,0.07)" }}
          >
            <p className="font-['Space_Grotesk'] text-[15px] leading-[1.75] text-white/38
              max-w-[520px] tracking-[-0.005em]">
              Twelve capabilities engineered to a single standard: undetectable deception
              sustained by architecture that{" "}
              <span className="text-white/62 font-medium">cannot be misconfigured into failure.</span>
            </p>
            <div className="flex gap-10 flex-shrink-0">
              {[["12","Capabilities"],["0","Config Failures"],["∞","Deception TTL"]].map(([v,l]) => (
                <div key={l} className="text-right">
                  <div className="font-['Space_Grotesk'] font-bold text-cyan-400 leading-none"
                    style={{ fontSize: "2.4rem", letterSpacing: "-0.04em" }}>
                    {v}
                  </div>
                  <div className="font-['JetBrains_Mono'] text-[7.5px] tracking-[0.15em] text-white/24 uppercase mt-1.5">
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── BENTO GRID ── */}
        <div ref={gRef} className="max-w-[88rem] mx-auto px-6 sm:px-10 pb-32">
          <div
            className="grid gap-[10px]"
            style={{
              gridTemplateColumns: "repeat(12, 1fr)",
              gridAutoRows: "minmax(0, 1fr)",
            }}
          >
            {/* Row 1 */}
            {/* F-01 HERO 2×2 */}
            <div style={{ gridColumn: "span 5", gridRow: "span 2" }}>
              <FeatureCard feat={FEATURES[0]} delay={0}    inView={gV} />
            </div>
            {/* F-02 TALL 1×2 */}
            <div style={{ gridColumn: "span 3", gridRow: "span 2" }}>
              <FeatureCard feat={FEATURES[1]} delay={0.06} inView={gV} />
            </div>
            {/* F-04 STANDARD */}
            <div style={{ gridColumn: "span 4", gridRow: "span 1" }}>
              <FeatureCard feat={FEATURES[3]} delay={0.1}  inView={gV} />
            </div>
            {/* F-05 STANDARD */}
            <div style={{ gridColumn: "span 4", gridRow: "span 1" }}>
              <FeatureCard feat={FEATURES[4]} delay={0.15} inView={gV} />
            </div>

            {/* Row 3 */}
            {/* F-03 WIDE */}
            <div style={{ gridColumn: "span 8", gridRow: "span 1" }}>
              <FeatureCard feat={FEATURES[2]} delay={0.18} inView={gV} />
            </div>
            {/* F-07 STANDARD */}
            <div style={{ gridColumn: "span 4", gridRow: "span 1" }}>
              <FeatureCard feat={FEATURES[6]} delay={0.22} inView={gV} />
            </div>

            {/* Row 4 */}
            {/* F-06 ACCENT 2×2 */}
            <div style={{ gridColumn: "span 4", gridRow: "span 2" }}>
              <FeatureCard feat={FEATURES[5]} delay={0.24} inView={gV} />
            </div>
            {/* F-10 STANDARD */}
            <div style={{ gridColumn: "span 4", gridRow: "span 1" }}>
              <FeatureCard feat={FEATURES[9]}  delay={0.27} inView={gV} />
            </div>
            {/* F-11 STANDARD */}
            <div style={{ gridColumn: "span 4", gridRow: "span 1" }}>
              <FeatureCard feat={FEATURES[10]} delay={0.3}  inView={gV} />
            </div>
            {/* F-08 STANDARD */}
            <div style={{ gridColumn: "span 4", gridRow: "span 1" }}>
              <FeatureCard feat={FEATURES[7]} delay={0.33} inView={gV} />
            </div>
            {/* F-12 STANDARD */}
            <div style={{ gridColumn: "span 4", gridRow: "span 1" }}>
              <FeatureCard feat={FEATURES[11]} delay={0.36} inView={gV} />
            </div>

            {/* Row 5 — full width wide */}
            <div style={{ gridColumn: "span 12", gridRow: "span 1" }}>
              <FeatureCard feat={FEATURES[8]} delay={0.4} inView={gV} />
            </div>
          </div>
        </div>

        {/* ── SPECS TICKER ── */}
        <div
          className="border-t border-b overflow-hidden"
          style={{
            borderColor: "rgba(34,211,238,0.07)",
            background: "rgba(34,211,238,0.018)",
          }}
        >
          <div
            className="flex whitespace-nowrap py-2"
            style={{ animation: "ticker 28s linear infinite" }}
          >
            {Array(5).fill(
              "AUTH ≠ TRUST · SESSION · REDIS · RISK SCORER · ADVISORY ONLY · POLICY ENGINE · SOLE AUTHORITY · DECOY DB · MONGODB · REAL DB · POSTGRESQL · ESCALATION · ONE-WAY · FORENSICS · 100% · CANARY TRAPS · 38+ ENDPOINTS · "
            ).map((t, i) => (
              <span key={i}
                className="font-['JetBrains_Mono'] mr-16"
                style={{ fontSize: 8, letterSpacing: "0.22em", color: "rgba(34,211,238,0.24)" }}>
                {t}
              </span>
            ))}
          </div>
        </div>

      </section>
    </>
  );
}