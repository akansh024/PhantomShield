import { useEffect, useRef, useState } from "react";
import { Link } from 'react-router-dom';
import { motion, useAnimation, useInView, animate, useScroll, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Activity, ArrowRight, FileText,
  Zap, Lock, Eye, AlertTriangle, CheckCircle2,
  Terminal, Wifi, Server, Globe, ChevronRight, User, LogOut, ChevronDown
} from "lucide-react";

const MotionLink = motion(Link);


/* ─── THREAT LOG DATA ────────────────────────────────────── */
const LOGS = [
  { ts: "03:14:07.221", type: "INFO",  msg: "Session initialised — risk_score: 0.00",         color: "text-cyan-400" },
  { ts: "03:14:09.440", type: "SCAN",  msg: "Telemetry collector attached to request pipeline", color: "text-cyan-400/70" },
  { ts: "03:14:12.108", type: "WARN",  msg: "api_enumeration_depth anomaly detected: 7",       color: "text-amber-400" },
  { ts: "03:14:12.213", type: "WARN",  msg: "navigation_velocity: HIGH — threshold exceeded",  color: "text-amber-400" },
  { ts: "03:14:12.890", type: "RISK",  msg: "risk_scorer → 0.74  [12 signals processed]",      color: "text-orange-400" },
  { ts: "03:14:13.001", type: "CRIT",  msg: "POLICY_ENGINE: ESCALATE REAL → DECOY",            color: "text-red-400" },
  { ts: "03:14:13.002", type: "CRIT",  msg: "One-way escalation LOCKED — no reversal path",    color: "text-red-400" },
  { ts: "03:14:13.100", type: "INFO",  msg: "Routing re-bound → app/api/decoy/routes.py",      color: "text-cyan-400/70" },
  { ts: "03:14:13.220", type: "TRAP",  msg: "CANARY_TRAP armed — 12 bait endpoints active",    color: "text-violet-400" },
  { ts: "03:14:14.780", type: "FORS",  msg: "Forensics logger active — 100% capture rate",     color: "text-violet-400" },
  { ts: "03:14:17.992", type: "HIT",   msg: "CANARY_HIT /api/admin/export — intelligence++",   color: "text-red-300" },
  { ts: "03:14:19.004", type: "INTEL", msg: "Timeline entry #14 reconstructed successfully",   color: "text-emerald-400" },
  { ts: "03:14:21.330", type: "INFO",  msg: "Decoy response served — attacker unaware",        color: "text-cyan-400/70" },
  { ts: "03:14:22.100", type: "FORS",  msg: "payload captured: POST /api/users/export",        color: "text-violet-400" },
  { ts: "03:14:24.551", type: "INTEL", msg: "TTP fingerprint added to threat intelligence DB", color: "text-emerald-400" },
  { ts: "03:14:26.003", type: "WARN",  msg: "sensitive_probe.py pattern identified",           color: "text-amber-400" },
  { ts: "03:14:27.890", type: "RISK",  msg: "risk_scorer → 0.91  [compound signal]",           color: "text-orange-400" },
  { ts: "03:14:28.000", type: "INFO",  msg: "Real PostgreSQL: untouched — zero crossover",     color: "text-emerald-400" },
];

const TYPE_COLORS = {
  INFO:  "text-cyan-400/50 bg-cyan-400/8",
  SCAN:  "text-cyan-300/50 bg-cyan-300/5",
  WARN:  "text-amber-400/70 bg-amber-400/10",
  RISK:  "text-orange-400/70 bg-orange-400/10",
  CRIT:  "text-red-400 bg-red-400/12",
  TRAP:  "text-violet-400/70 bg-violet-400/10",
  FORS:  "text-violet-300/60 bg-violet-300/8",
  HIT:   "text-red-300 bg-red-300/12",
  INTEL: "text-emerald-400/70 bg-emerald-400/10",
};

/* ─── ANIMATED COUNTER ───────────────────────────────────── */
function Counter({ to, suffix = "", duration = 2 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return ctrl.stop;
  }, [inView, to, duration]);
  return <span ref={ref}>{val}{suffix}</span>;
}

function Navbar({ onAdminTrigger }) {
  const [scrolled, setScrolled] = useState(false);
  const [userSession, setUserSession] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    
    // Check initial session
    const token = localStorage.getItem('phantom_token');
    const userName = localStorage.getItem('user_name');
    
    if (token) {
      setUserSession(userName || 'Standard User');
    }

    return () => window.removeEventListener("scroll", fn);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('phantom_token');
    localStorage.removeItem('user_name');
    // Admin clearance remains untouched by standard user logout
    setUserSession(null);
    setMenuOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-xl bg-[#030a10]/80 border-b border-white/[0.06]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[88rem] mx-auto px-10 h-[68px] flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-9">
            <svg viewBox="0 0 32 36" fill="none" className="w-full h-full">
              <path d="M16 1L31 6.5V18C31 27 23 33.5 16 35C9 33.5 1 27 1 18V6.5L16 1z"
                fill="rgba(34,211,238,0.1)" stroke="rgba(34,211,238,0.65)" strokeWidth="1"/>
              <path d="M16 8L24 11.5V18C24 23 20 27 16 28C12 27 8 23 8 18V11.5L16 8z"
                fill="rgba(34,211,238,0.06)" stroke="rgba(34,211,238,0.3)" strokeWidth="0.8"/>
              {/* <circle cx="16" cy="18" r="3.5" fill="rgba(34,211,238,0.9)"/> */}
            </svg>
          </div>
          <div className="flex flex-col leading-none gap-[6px]">
            <span className="font-['JetBrains_Mono'] text-[15px] tracking-[0.2em] text-cyan-400">PHANTOM</span>
            <span className="font-['JetBrains_Mono'] text-[15px] tracking-[0.2em] text-white/55 -mt-0.5">SHIELD</span>
          </div>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8">
          {["Architecture", "Capabilities", "Docs"].map((item) => (
            <a key={item} href="#"
              className="font-['JetBrains_Mono'] text-[15px] tracking-[0.1em] text-white/50 hover:text-white uppercase transition-colors duration-200">
              {item}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-4 ">
          {!userSession ? (
            <MotionLink
              to="/signup"
              whileHover={{ borderColor: "rgba(34,211,238,0.45)", background: "rgba(34,211,238,0.06)" }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2.5 font-['Space_Grotesk'] font-semibold
                text-[13px] tracking-[0.1rem] uppercase px-7 py-[12px]
                backdrop-blur-xl bg-white/[0.03] border border-white/[0.12]
                text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer rounded-md"
            >
              Sign Up
            </MotionLink>
          ) : (
            <div className="relative">
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="hidden sm:flex flex-row items-center gap-2 font-['Space_Grotesk'] font-medium text-[12px] tracking-tight bg-white/5 border border-white/10 px-3 py-1.5 rounded-sm text-white/90 hover:bg-white/10 transition-colors"
              >
                <User size={14} className="text-[#00ffaa]" />
                {userSession}
                <ChevronDown size={14} className={`transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-3 w-40 bg-[#13141a] border border-white/10 rounded-sm shadow-xl p-1 z-50 overflow-hidden"
                  >
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-['Space_Grotesk'] text-white/60 hover:text-red-400 hover:bg-white/5 rounded-sm transition-colors text-left"
                    >
                      <LogOut size={14} />
                      Terminate Auth
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <button onClick={onAdminTrigger} className="hidden sm:flex items-center gap-2 font-['Space_Grotesk'] font-bold text-[15px] tracking-tight
            px-5 py-2.5 bg-[#00ffaa] text-[#13141a] uppercase rounded-sm hover:shadow-[0_0_20px_rgba(0,255,170,0.35)]
            hover:-translate-y-px transition-all duration-200 cursor-pointer border-0">
            Dashboard
          </button>
        </div>
      </div>
    </motion.nav>
  );
}

/* ─── ANIMATED GRID BACKGROUND ──────────────────────────── */
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base grid */}
      <div className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34,211,238,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,211,238,0.022) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Radial glow — centre */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        w-[900px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(34,211,238,0.055) 0%, transparent 65%)" }}
      />

      {/* Corner glows */}
      <div className="absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full"
        style={{ background: "radial-gradient(ellipse, rgba(34,211,238,0.035) 0%, transparent 60%)" }}
      />
      <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] rounded-full"
        style={{ background: "radial-gradient(ellipse, rgba(167,139,250,0.03) 0%, transparent 60%)" }}
      />

      {/* Grain */}
      <div className="absolute inset-0 opacity-[0.032]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px",
          mixBlendMode: "overlay",
        }}
      />

      {/* Horizontal scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.25), transparent)" }}
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

/* ─── TERMINAL CARD ──────────────────────────────────────── */
function TerminalCard() {
  const logs = [...LOGS, ...LOGS]; // duplicate for seamless scroll

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-[540px] mx-auto lg:mx-0"
    >
      {/* Outer glow */}
      <div className="absolute -inset-px rounded-2xl opacity-60"
        style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.25), transparent 50%, rgba(167,139,250,0.15))" }}
      />

      {/* Card shell */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.08]
        backdrop-blur-xl bg-white/[0.03] shadow-[0_24px_60px_rgba(0,0,0,0.5)]">

        {/* Terminal title bar */}
        <div className="flex items-center justify-between px-5 py-3.5
          border-b border-white/[0.07] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            {/* Traffic lights */}
            <div className="flex gap-1.5">
              {["#ef4444","#f59e0b","#22d3ee"].map((c, i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full"
                  style={{ background: c, opacity: 0.75 }}/>
              ))}
            </div>
            <Terminal size={12} className="text-cyan-400/50"/>
            <span className="font-['JetBrains_Mono'] text-[9px] tracking-[0.15em] text-white/30 uppercase">
              forensics@phantomshield:~
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-[6px] w-[6px]">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-50"/>
              <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-red-400"/>
            </span>
            <span className="font-['JetBrains_Mono'] text-[8px] tracking-[0.18em] text-red-400/70 uppercase">
              Capturing
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-white/[0.06] border-b border-white/[0.07]">
          {[
            { label: "Risk Score", value: "0.91", color: "text-red-400" },
            { label: "Routing",    value: "DECOY", color: "text-red-400" },
            { label: "Canaries",   value: "12 ARMED", color: "text-amber-400" },
          ].map((s) => (
            <div key={s.label} className="px-4 py-2.5">
              <div className="font-['JetBrains_Mono'] text-[7px] tracking-[0.18em] text-white/25 uppercase mb-1">
                {s.label}
              </div>
              <div className={`font-['Space_Grotesk'] font-bold text-[13px] tracking-tight ${s.color}`}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Log window — scrolling */}
        <div className="relative h-[340px] overflow-hidden">
          {/* Top fade */}
          <div className="absolute top-0 inset-x-0 h-10 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, rgba(3,10,16,0.95), transparent)" }}/>
          {/* Bottom fade */}
          <div className="absolute bottom-0 inset-x-0 h-16 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to top, rgba(3,10,16,0.98), transparent)" }}/>

          {/* Scrolling log rows */}
          <motion.div
            className="absolute inset-x-0"
            animate={{ y: [0, -(LOGS.length * 36)] }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          >
            {logs.map((log, i) => (
              <div key={i}
                className="flex items-start gap-3 px-5 py-[9px] border-b border-white/[0.03] group
                  hover:bg-white/[0.02] transition-colors duration-150"
              >
                {/* Type badge */}
                <span className={`font-['JetBrains_Mono'] text-[7px] tracking-[0.15em] px-1.5 py-0.5
                  rounded-[3px] uppercase flex-shrink-0 mt-0.5 ${TYPE_COLORS[log.type] || "text-white/30"}`}>
                  {log.type}
                </span>
                {/* Timestamp */}
                <span className="font-['JetBrains_Mono'] text-[8px] text-white/20 flex-shrink-0 mt-0.5 tabular-nums">
                  {log.ts}
                </span>
                {/* Message */}
                <span className={`font-['JetBrains_Mono'] text-[8.5px] leading-[1.55] tracking-[0.02em] ${log.color}`}>
                  {log.msg}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom input bar */}
        <div className="flex items-center gap-3 px-5 py-3 border-t border-white/[0.07] bg-white/[0.015]">
          <span className="font-['JetBrains_Mono'] text-[9px] text-cyan-400/50">$</span>
          <span className="font-['JetBrains_Mono'] text-[9px] text-white/30 tracking-[0.04em]">
            tail -f /var/log/phantomshield/forensics.log
          </span>
          <motion.span
            className="inline-block w-[6px] h-[13px] bg-cyan-400/60 ml-1"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: "steps(1)" }}
          />
        </div>
      </div>

      {/* Floating info chips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute -top-12 right-0 flex flex-row gap-3 z-20"
      >
        {[
          { icon: <Lock size={10}/>, label: "Real DB Isolated", color: "text-emerald-400", border: "border-emerald-400/20" },
          { icon: <Eye size={10}/>,  label: "100% Logged",       color: "text-violet-400",  border: "border-violet-400/20" },
          { icon: <Zap size={10}/>,  label: "<2ms Overhead",     color: "text-amber-400",   border: "border-amber-400/20" },
        ].map((chip, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 + i * 0.12 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full
              backdrop-blur-xl bg-[#030a10]/80 border ${chip.border}
              shadow-[0_4px_16px_rgba(0,0,0,0.5)]`}
          >
            <span className={chip.color}>{chip.icon}</span>
            <span className={`font-['JetBrains_Mono'] text-[12px] tracking-[0.12em] ${chip.color}`}>
              {chip.label}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ─── HERO SECTION ───────────────────────────────────────── */
export default function HeroSection({ onAdminTrigger }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;700&display=swap');
      `}</style>

      <Navbar onAdminTrigger={onAdminTrigger} />

      <section className="relative min-h-screen flex items-center overflow-hidden"
        style={{ background: "linear-gradient(160deg, #030a10 0%, #020810 60%, #040c14 100%)" }}>

        <GridBackground />

        {/* ── MAIN CONTENT ── */}
        <div className="relative z-10 max-w-[88rem] mx-auto px-6 sm:px-10 w-full pt-[68px]">
          <div className="grid lg:grid-cols-2 gap-12 xl:gap-16
            items-center min-h-[calc(100vh-68px)] py-12 lg:py-20">

            {/* ── LEFT — COPY ── */}
            <div className="flex flex-col gap-0">

              {/* System status badge */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-3 w-fit mb-8"
              >
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-full
                  backdrop-blur-xl bg-white/[0.04] border border-white/[0.08]">
                  <span className="relative flex h-[7px] w-[7px]">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40"/>
                    <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-emerald-400"/>
                  </span>
                  <span className="font-['JetBrains_Mono'] text-[9px] tracking-[0.22em] text-emerald-400/80 uppercase">
                    System Status: Active
                  </span>
                </div>
                {/* <div className="h-px w-16 bg-gradient-to-r from-cyan-400/30 to-transparent"/> */}
                <span className="font-['JetBrains_Mono'] text-[10px] tracking-[0.2em] text-white/25 uppercase">
                  v1.0 · Demo
                </span>
              </motion.div>

              {/* H1 */}
              <div className="mb-4">
                <motion.h1
                  initial={{ y: 80, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.85, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="font-['Space_Grotesk'] font-bold leading-[0.88] tracking-tighter uppercase"
                  style={{ fontSize: "clamp(3rem, 6.5vw, 6rem)" }}
                >
                  <span className="text-white block">Redefining</span>
                  <span className="text-white block">Digital</span>
                  <span
                    className="block"
                    style={{
                      background: "linear-gradient(90deg, #00ffaa 0%, #06b6d4 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Fortification.
                  </span>
                </motion.h1>
              </div>



              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="font-['Space_Grotesk'] font-medium text-lg leading-relaxed text-white/60 max-w-[500px] mb-10"
              >
                PhantomShield routes confirmed threats into a{" "}
                <span className="text-white/70 font-medium">cryptographically isolated decoy system</span>
                {" "}— capturing forensic intelligence while your real infrastructure remains entirely untouched.
                Seven hermetically sealed layers. Zero configuration paths to failure.
              </motion.p>

              {/* CTA Row */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-wrap items-center gap-3 mb-14"
              >
                {/* Primary */}
                  <motion.button
                    onClick={onAdminTrigger}
                    whileHover={{ y: -2, boxShadow: "0 0 32px rgba(0,255,170,0.4)" }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2.5 font-['Space_Grotesk'] font-bold
                      text-[14px] tracking-tight uppercase px-8 py-[16px] rounded-md
                      bg-[#00ffaa] text-[#13141a] transition-all duration-200 cursor-pointer border-0"
                  >
                    Enter Dashboard
                    <ArrowRight size={16} strokeWidth={2.5}/>
                  </motion.button>

                {/* Secondary ghost */}
                <motion.button
                  whileHover={{ borderColor: "rgba(34,211,238,0.45)", background: "rgba(34,211,238,0.06)" }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2.5 font-['Space_Grotesk'] font-semibold
                    text-[13px] hover:text-white tracking-[0.01rem] uppercase px-7 py-[17px]
                    backdrop-blur-xl bg-white/[0.03] border border-white/[0.12]
                    text-white/55 transition-all duration-200 cursor-pointer rounded-md"
                >
                  <FileText size={13} strokeWidth={1.8}/>
                  View Documentation
                </motion.button>
              </motion.div>

              {/* Metrics strip */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex items-center gap-0 border-t border-white/[0.06] pt-8"
              >
                {[
                  { n: 7,   s: "",   label: "Isolation Layers",   color: "text-cyan-400" },
                  { n: 100, s: "%",  label: "Forensic Coverage",  color: "text-cyan-400" },
                  { n: 0,   s: "",   label: "DB Crossovers",      color: "text-red-400" },
                  { n: 38,  s: "+",  label: "Canary Endpoints",   color: "text-amber-400" },
                ].map((m, i) => (
                  <div key={i} className={`pr-8 ${i > 0 ? "pl-8 border-l border-white/[0.06]" : ""}`}>
                    <div className={`font-['Space_Grotesk'] font-bold leading-none tracking-tighter ${m.color}`}
                      style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)" }}>
                      <Counter to={m.n} suffix={m.s} duration={1.8}/>
                    </div>
                    <div className="font-['JetBrains_Mono'] text-[7.5px] tracking-[0.16em]
                      text-white/25 uppercase mt-1.5 leading-none">
                      {m.label}
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* ── RIGHT — TERMINAL CARD ── */}
            <div className="flex items-center justify-center lg:justify-end">
              <TerminalCard />
            </div>
          </div>
        </div>

        {/* ── BOTTOM ARCHITECTURE PILLS ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="absolute bottom-0 inset-x-0 border-t border-white/[0.05]
            backdrop-blur-sm bg-white/[0.01] z-20"
        >
          <div className="max-w-[88rem] mx-auto px-10 h-12 flex items-center justify-between">
            <div className="flex items-center gap-6">
              {[
                { icon: <ShieldCheck size={9}/>, label: "Auth ≠ Trust",         color: "text-cyan-400/60" },
                { icon: <Activity    size={9}/>, label: "Risk Advisory Only",    color: "text-amber-400/60" },
                { icon: <Lock        size={9}/>, label: "One-Way Escalation",    color: "text-red-400/60" },
                { icon: <Server      size={9}/>, label: "Zero DB Crossover",     color: "text-emerald-400/60" },
              ].map((pill) => (
                <div key={pill.label} className={`hidden sm:flex items-center gap-1.5 ${pill.color}`}>
                  {pill.icon}
                  <span className="font-['JetBrains_Mono'] text-[7.5px] tracking-[0.18em] uppercase">
                    {pill.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Globe size={9} className="text-white/20"/>
              <span className="font-['JetBrains_Mono'] text-[7.5px] tracking-[0.18em] text-white/20 uppercase">
                REF: PS-v1 · PhantomShield
              </span>
            </div>
          </div>
        </motion.div>

      </section>
    </>
  );
}
