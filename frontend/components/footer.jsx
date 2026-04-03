import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Github, Twitter, Linkedin, Globe,
  Send, Shield, ArrowUpRight,
  Terminal, MapPin, Clock,
  Cpu, Activity,
} from "lucide-react";

const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/* ─── NAV COLUMNS ─────────────────────────────────────────── */
const NAV = [
  {
    heading: "System",
    links: [
      { label: "Architecture",      href: "#" },
      { label: "How It Works",      href: "#" },
      { label: "Risk Engine",       href: "#" },
      { label: "Policy Engine",     href: "#" },
      { label: "Forensics Layer",   href: "#" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Documentation",     href: "#" },
      { label: "API Reference",     href: "#" },
      { label: "Attack Simulation", href: "#" },
      { label: "Threat Model",      href: "#" },
      { label: "Canary Design",     href: "#" },
    ],
  },
  {
    heading: "Project",
    links: [
      { label: "GitHub Repository", href: "#" },
      { label: "Changelog",         href: "#" },
      { label: "Roadmap",           href: "#" },
      { label: "Contributors",      href: "#" },
      { label: "Security Policy",   href: "#" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "MIT License",       href: "#" },
      { label: "Privacy Policy",    href: "#" },
      { label: "Terms of Use",      href: "#" },
      { label: "Responsible Disc.", href: "#" },
      { label: "Data Handling",     href: "#" },
    ],
  },
];

/* ─── FOOT LINK ───────────────────────────────────────────── */
function FootLink({ label, href, delay, inView }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.a
      href={href}
      initial={{ opacity: 0, x: -8 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.45, delay }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="flex items-center gap-0 group"
      style={{ textDecoration: "none", display: "flex", alignItems: "center" }}
    >
      {/* Caret */}
      <motion.span
        animate={{ opacity: hov ? 1 : 0, x: hov ? 0 : -6, width: hov ? 14 : 0 }}
        transition={{ duration: 0.18 }}
        className="font-['JetBrains_Mono'] overflow-hidden"
        style={{ fontSize: 10, color: "#22d3ee", flexShrink: 0, display: "inline-block" }}
      >
        &gt;{" "}
      </motion.span>

      <span
        className="font-['JetBrains_Mono'] transition-colors duration-200"
        style={{
          fontSize: 11,
          letterSpacing: "0.06em",
          color: hov ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.32)",
          lineHeight: 1,
        }}
      >
        {label}
      </span>

      {/* External arrow — faint */}
      <motion.div
        animate={{ opacity: hov ? 0.4 : 0 }}
        transition={{ duration: 0.18 }}
        className="ml-1.5"
      >
        <ArrowUpRight size={9} color="#22d3ee" />
      </motion.div>
    </motion.a>
  );
}

/* ─── SOCIAL ICON ─────────────────────────────────────────── */
function SocialBtn({ Icon, label, color = "#22d3ee", href, delay, inView }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.a
      href={href}
      aria-label={label}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ textDecoration: "none" }}
    >
      <motion.div
        animate={{
          borderColor: hov ? `${color}50` : "rgba(255,255,255,0.1)",
          background: hov ? `${color}12` : "rgba(255,255,255,0.03)",
          boxShadow: hov
            ? `0 0 16px ${color}40, 0 0 32px ${color}18`
            : "none",
        }}
        transition={{ duration: 0.25 }}
        className="w-9 h-9 flex items-center justify-center border backdrop-blur-sm"
        style={{ borderRadius: 0 }}
      >
        <motion.div
          animate={{ color: hov ? color : "rgba(255,255,255,0.3)" }}
          transition={{ duration: 0.22 }}
        >
          <Icon size={15} strokeWidth={1.6} />
        </motion.div>
      </motion.div>
    </motion.a>
  );
}

/* ─── SYSTEM CLOCK ────────────────────────────────────────── */
function SystemClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n) => String(n).padStart(2, "0");
  const timeStr = `${pad(time.getUTCHours())}:${pad(time.getUTCMinutes())}:${pad(time.getUTCSeconds())}`;
  return (
    <span className="font-['JetBrains_Mono'] tabular-nums"
      style={{ fontSize: 10, letterSpacing: "0.12em", color: "rgba(34,211,238,0.5)" }}>
      {timeStr} UTC
    </span>
  );
}

/* ─── NEWSLETTER INPUT ────────────────────────────────────── */
function NewsletterInput({ inView }) {
  const [val, setVal] = useState("");
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!val.trim()) return;
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setVal("");
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Label */}
      <div className="font-['Space_Grotesk'] font-bold uppercase tracking-widest mb-1"
        style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.18em" }}>
        Stay Updated
      </div>
      <div className="font-['JetBrains_Mono'] mb-5"
        style={{ fontSize: 9, letterSpacing: "0.14em", color: "rgba(255,255,255,0.2)" }}>
        // deployment alerts · architecture updates · threat briefs
      </div>

      {/* Input group */}
      <div className="relative flex items-stretch">
        {/* Glow border on focus */}
        <motion.div
          className="absolute -inset-px pointer-events-none"
          animate={{
            boxShadow: focused
              ? "0 0 0 1px rgba(34,211,238,0.4), 0 0 20px rgba(34,211,238,0.12)"
              : "0 0 0 1px rgba(255,255,255,0.07)",
          }}
          transition={{ duration: 0.25 }}
        />

        {/* Terminal prompt */}
        <div
          className="flex items-center px-3 border-r flex-shrink-0"
          style={{
            background: "rgba(34,211,238,0.05)",
            backdropFilter: "blur(16px)",
            borderColor: "rgba(255,255,255,0.07)",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            borderLeft: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <Terminal size={11} color="rgba(34,211,238,0.5)" />
        </div>

        {/* Input */}
        <input
          type="email"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="enter@your.email"
          className="flex-1 outline-none"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: "0.08em",
            color: "rgba(255,255,255,0.65)",
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(16px)",
            border: "none",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            padding: "12px 14px",
            caretColor: "#22d3ee",
          }}
          // placeholder color via CSS
        />

        {/* Submit button */}
        <motion.button
          type="submit"
          whileHover={{
            background: "#22d3ee",
            boxShadow: "0 0 24px rgba(34,211,238,0.45)",
          }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.22 }}
          className="flex items-center gap-2 px-5 flex-shrink-0"
          style={{
            background: "rgba(34,211,238,0.15)",
            border: "1px solid rgba(34,211,238,0.3)",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <motion.span
            animate={{ color: "#030a10" }}
            className="font-['Space_Grotesk'] font-bold uppercase"
            style={{ fontSize: 10, letterSpacing: "0.14em", color: "#22d3ee" }}
          >
            {sent ? "Sent ✓" : "Deploy"}
          </motion.span>
          {!sent && <Send size={11} color="#22d3ee" />}
        </motion.button>
      </div>

      {/* Hint */}
      <div className="font-['JetBrains_Mono'] mt-2.5"
        style={{ fontSize: 8, letterSpacing: "0.14em", color: "rgba(255,255,255,0.15)" }}>
        No spam. Unsubscribe anytime. Zero tracking.
      </div>
    </motion.form>
  );
}

/* ─── STATUS STRIP ────────────────────────────────────────── */
function StatusStrip({ inView }) {
  const items = [
    { icon: Activity, label: "All Systems",   val: "Operational",  color: "#10b981" },
    { icon: Shield,   label: "Threat Level",  val: "Monitoring",   color: "#22d3ee" },
    { icon: Cpu,      label: "Risk Engine",   val: "Advisory",     color: "#f59e0b" },
    { icon: Globe,    label: "Decoy Layer",   val: "Active",       color: "#a78bfa" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="grid grid-cols-2 sm:grid-cols-4 gap-[1px]"
      style={{ background: "rgba(255,255,255,0.04)" }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label}
            className="flex items-center gap-2.5 px-4 py-3"
            style={{ background: "#030a10" }}
          >
            <Icon size={11} color={item.color} strokeWidth={1.5} />
            <div>
              <div className="font-['JetBrains_Mono']"
                style={{ fontSize: 7.5, letterSpacing: "0.16em", color: "rgba(255,255,255,0.22)", textTransform: "uppercase" }}>
                {item.label}
              </div>
              <div className="font-['Space_Grotesk'] font-semibold"
                style={{ fontSize: 11, letterSpacing: "-0.01em", color: item.color, marginTop: 1 }}>
                {item.val}
              </div>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

/* ─── MAIN FOOTER ─────────────────────────────────────────── */
export default function Footer() {
  const ref     = useRef(null);
  const inView  = useInView(ref, { once: true, margin: "-40px" });
  const year    = new Date().getFullYear();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;700&display=swap');

        input::placeholder {
          color: rgba(255,255,255,0.18);
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
        }
        @keyframes liveRipple {
          0%  { transform:scale(1);   opacity:.4; }
          100%{ transform:scale(3.2); opacity:0;  }
        }
        @keyframes breathe {
          0%,100%{ opacity:.04; }
          50%    { opacity:.08; }
        }
        @keyframes ticker {
          0%  { transform:translateX(0); }
          100%{ transform:translateX(-50%); }
        }
      `}</style>

      <footer
        ref={ref}
        className="relative overflow-hidden"
        style={{ background: "#030a10", fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {/* 40px grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34,211,238,0.018) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34,211,238,0.018) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Grain */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: GRAIN, backgroundSize: "200px", opacity: 0.028, mixBlendMode: "overlay" }}
        />

        {/* Top radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: 900, height: 500,
            background: "radial-gradient(ellipse, rgba(34,211,238,0.045) 0%, transparent 65%)",
            animation: "breathe 12s ease-in-out infinite",
          }}
        />



        {/* ── MAIN GRID ── */}
        <div className="max-w-[88rem] mx-auto px-6 sm:px-10 pt-16 pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr_1fr_1fr_1fr] gap-12 lg:gap-8">

            {/* ── BRAND + NEWSLETTER ── */}
            <div>
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-3 mb-6"
              >
                <svg width="30" height="34" viewBox="0 0 30 34" fill="none">
                  <path d="M15 1L29 6V17C29 25.5 22 31.5 15 33C8 31.5 1 25.5 1 17V6L15 1z"
                    fill="rgba(34,211,238,0.1)" stroke="rgba(34,211,238,0.6)" strokeWidth="1"/>
                  <path d="M15 7.5L22 10.5V17C22 21.5 18.5 25 15 26C11.5 25 8 21.5 8 17V10.5L15 7.5z"
                    fill="rgba(34,211,238,0.06)" stroke="rgba(34,211,238,0.3)" strokeWidth="0.8"/>
                  <circle cx="15" cy="17" r="3.5" fill="rgba(34,211,238,0.9)"/>
                </svg>
                <div>
                  <div className="font-['JetBrains_Mono'] text-[10px] tracking-[0.2em] text-cyan-400">PHANTOM</div>
                  <div className="font-['JetBrains_Mono'] text-[10px] tracking-[0.2em] text-white/45 -mt-0.5">SHIELD</div>
                </div>
              </motion.div>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.08 }}
                className="font-['Space_Grotesk'] font-normal leading-[1.7] text-white/32 mb-8"
                style={{ fontSize: 13, letterSpacing: "-0.005em", maxWidth: 280 }}
              >
                Active deception framework for post-authentication threat isolation.
                Every intrusion attempt becomes an intelligence asset.
              </motion.p>

              {/* Build info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.12 }}
                className="flex flex-col gap-2 mb-8"
              >
                {[
                  ["Version",   "v1.0 · Production"],
                  ["Stack",     "FastAPI · Redis · Postgres · Mongo"],
                  ["License",   "MIT · Open Source"],
                  ["Ref",       "PS-v1 · PhantomShield"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline gap-2.5">
                    <span className="font-['JetBrains_Mono']"
                      style={{ fontSize: 8, letterSpacing: "0.18em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", minWidth: 48 }}>
                      {k}
                    </span>
                    <span className="font-['JetBrains_Mono']"
                      style={{ fontSize: 9, letterSpacing: "0.06em", color: "rgba(255,255,255,0.38)" }}>
                      {v}
                    </span>
                  </div>
                ))}
              </motion.div>

              {/* Social icons */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.18 }}
                className="flex gap-2 mb-10"
              >
                {[
                  { Icon: Github,   label: "GitHub",   color: "#22d3ee",  href: "#" },
                  { Icon: Twitter,  label: "Twitter",  color: "#22d3ee",  href: "#" },
                  { Icon: Linkedin, label: "LinkedIn", color: "#22d3ee",  href: "#" },
                  { Icon: Globe,    label: "Website",  color: "#a78bfa",  href: "#" },
                ].map((s, i) => (
                  <SocialBtn key={i} {...s} delay={0.2 + i * 0.05} inView={inView} />
                ))}
              </motion.div>

              {/* Newsletter */}
              <NewsletterInput inView={inView} />
            </div>

            {/* ── NAV COLUMNS ── */}
            {NAV.map((col, ci) => (
              <div key={ci}>
                {/* Column header — Space Grotesk */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.1 + ci * 0.05 }}
                  className="font-['Space_Grotesk'] font-bold uppercase tracking-widest mb-5 pb-4 border-b"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.22em",
                    color: "rgba(255,255,255,0.5)",
                    borderColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  {col.heading}
                </motion.div>

                {/* Links */}
                <div className="flex flex-col gap-4">
                  {col.links.map((link, li) => (
                    <FootLink
                      key={li}
                      label={link.label}
                      href={link.href}
                      inView={inView}
                      delay={0.15 + ci * 0.05 + li * 0.035}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── STATUS STRIP ── */}
        <div className="max-w-[88rem] mx-auto px-6 sm:px-10 pb-8">
          <div className="mb-2">
            <span className="font-['JetBrains_Mono']"
              style={{ fontSize: 8, letterSpacing: "0.2em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase" }}>
              System Status
            </span>
          </div>
          <StatusStrip inView={inView} />
        </div>

        {/* ── DIVIDER ── */}
        <div className="max-w-[88rem] mx-auto px-6 sm:px-10">
          <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="max-w-[88rem] mx-auto px-6 sm:px-10 py-5">
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap items-center justify-between gap-4"
          >
            {/* Left — copyright */}
            <div className="flex items-center gap-5">
              <span className="font-['JetBrains_Mono']"
                style={{ fontSize: 9, letterSpacing: "0.12em", color: "rgba(255,255,255,0.2)" }}>
                © {year} PhantomShield
              </span>
              <span style={{ color: "rgba(255,255,255,0.08)", fontSize: 12 }}>·</span>
              <span className="font-['JetBrains_Mono']"
                style={{ fontSize: 9, letterSpacing: "0.12em", color: "rgba(255,255,255,0.14)" }}>
                MIT License
              </span>
              <span style={{ color: "rgba(255,255,255,0.08)", fontSize: 12 }}>·</span>
              <span className="font-['JetBrains_Mono']"
                style={{ fontSize: 9, letterSpacing: "0.12em", color: "rgba(255,255,255,0.14)" }}>
                REF: PS-v1
              </span>
            </div>

            {/* Centre — principles */}
            <div className="hidden md:flex items-center gap-5">
              {["Auth ≠ Trust", "One-Way Escalation", "Zero Crossover", "100% Forensics"].map((p, i) => (
                <span key={i} className="font-['JetBrains_Mono']"
                  style={{ fontSize: 7.5, letterSpacing: "0.16em", color: "rgba(255,255,255,0.16)", textTransform: "uppercase" }}>
                  {p}
                </span>
              ))}
            </div>

            {/* Right — system time + location */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <MapPin size={9} color="rgba(34,211,238,0.4)" />
                <span className="font-['JetBrains_Mono']"
                  style={{ fontSize: 9, letterSpacing: "0.14em", color: "rgba(34,211,238,0.4)" }}>
                  SERVER: GLOBAL
                </span>
              </div>
              <div className="w-px h-3" style={{ background: "rgba(255,255,255,0.1)" }} />
              <div className="flex items-center gap-1.5">
                <Clock size={9} color="rgba(34,211,238,0.4)" />
                <SystemClock />
              </div>
              <div className="w-px h-3" style={{ background: "rgba(255,255,255,0.1)" }} />
              {/* Live dot */}
              <div className="flex items-center gap-1.5">
                <div className="relative w-[7px] h-[7px]">
                  <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-25"
                    style={{ animation: "liveRipple 2.5s ease-out infinite" }} />
                  <span className="absolute inset-[1.5px] rounded-full bg-emerald-400" />
                </div>
                <span className="font-['JetBrains_Mono']"
                  style={{ fontSize: 8, letterSpacing: "0.16em", color: "rgba(52,211,153,0.5)", textTransform: "uppercase" }}>
                  Online
                </span>
              </div>
            </div>
          </motion.div>
        </div>

      </footer>
    </>
  );
}