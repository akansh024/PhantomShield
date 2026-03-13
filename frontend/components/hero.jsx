import { useState, useEffect, useRef } from "react";

// ─── Glitch Text Component ──────────────────────────────────────────────────
function GlitchText({ text, className = "" }) {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(
      () => {
        setGlitching(true);
        setTimeout(() => setGlitching(false), 180);
      },
      3800 + Math.random() * 2000,
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={`relative inline-block ${className}`}>
      <span
        className={`relative z-10 transition-all duration-75 ${
          glitching ? "opacity-0" : "opacity-100"
        }`}
      >
        {text}
      </span>
      {glitching && (
        <>
          <span
            className="absolute inset-0 z-20 text-cyan-400"
            style={{
              clipPath: "inset(20% 0 60% 0)",
              transform: "translateX(-3px)",
            }}
          >
            {text}
          </span>
          <span
            className="absolute inset-0 z-20 text-red-500"
            style={{
              clipPath: "inset(60% 0 10% 0)",
              transform: "translateX(3px)",
            }}
          >
            {text}
          </span>
        </>
      )}
    </span>
  );
}

// ─── Animated Terminal Line ──────────────────────────────────────────────────
function TerminalLine({ text, delay = 0, color = "text-emerald-400" }) {
  const [visible, setVisible] = useState(false);
  const [chars, setChars] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(true);
      let i = 0;
      const iv = setInterval(() => {
        setChars(text.slice(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(iv);
      }, 28);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [text, delay]);

  if (!visible) return null;
  return (
    <div
      className={`font-mono text-xs tracking-widest ${color} flex items-center gap-2`}
    >
      <span className="text-slate-600">▸</span>
      <span>{chars}</span>
      {chars.length < text.length && (
        <span className="inline-block w-1.5 h-3 bg-emerald-400 animate-pulse" />
      )}
    </div>
  );
}

// ─── Scan Line Overlay ───────────────────────────────────────────────────────
function ScanLine() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-none z-30">
      <div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
        style={{
          animation: "scanline 6s linear infinite",
          top: 0,
        }}
      />
    </div>
  );
}

// ─── Risk Pulse Node ────────────────────────────────────────────────────────
function RiskNode({ label, value, color, delay = 0 }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={`flex flex-col gap-1.5 transition-all duration-700 ${
        animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${color} animate-pulse`}
          style={{ boxShadow: `0 0 6px currentColor` }}
        />
        <span className="font-mono text-[10px] tracking-[0.2em] text-slate-500 uppercase">
          {label}
        </span>
      </div>
      <span className={`font-mono text-lg font-bold ${color} tracking-tight`}>
        {value}
      </span>
    </div>
  );
}

// ─── Particle Canvas ─────────────────────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.2 + 0.3,
      opacity: Math.random() * 0.4 + 0.1,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 211, 238, ${p.opacity})`;
        ctx.fill();
      });

      // Draw connections
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach((b) => {
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 90) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(34, 211, 238, ${0.07 * (1 - d / 90)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

// ─── Main Hero ───────────────────────────────────────────────────────────────
export default function PhantomShieldHero() {
  const [mounted, setMounted] = useState(false);
  const [ctaHover, setCtaHover] = useState(false);
  const [demoHover, setDemoHover] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=swap');

        @keyframes scanline {
          0% { top: -2px; }
          100% { top: 100%; }
        }
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          92% { opacity: 1; }
          93% { opacity: 0.8; }
          94% { opacity: 1; }
          96% { opacity: 0.6; }
          97% { opacity: 1; }
        }
        @keyframes borderPulse {
          0%, 100% { border-color: rgba(34,211,238,0.25); }
          50% { border-color: rgba(34,211,238,0.6); }
        }
        @keyframes gridMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(40px); }
        }
        .font-rajdhani { font-family: 'Rajdhani', sans-serif; }
        .font-geist-mono { font-family: "Geist Mono", monospace; }
        .font-mono-tech { font-family: 'Share Tech Mono', monospace; }
        .flicker { animation: flicker 8s infinite; }
        .border-pulse { animation: borderPulse 3s ease-in-out infinite; }
        .cta-primary {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
          box-shadow: 0 0 20px rgba(6,182,212,0.35), inset 0 1px 0 rgba(255,255,255,0.1);
          transition: all 0.2s ease;
        }
        .cta-primary:hover {
          box-shadow: 0 0 35px rgba(6,182,212,0.6), inset 0 1px 0 rgba(255,255,255,0.15);
          transform: translateY(-1px);
        }
        .cta-secondary {
          background: transparent;
          border: 1px solid rgba(34,211,238,0.3);
          transition: all 0.2s ease;
        }
        .cta-secondary:hover {
          background: rgba(34,211,238,0.08);
          border-color: rgba(34,211,238,0.7);
          box-shadow: 0 0 18px rgba(34,211,238,0.15);
        }
      `}</style>

      <div
        className="relative min-h-screen overflow-hidden font-rajdhani"
        style={{
          background:
            "linear-gradient(160deg, #020508 0%, #050d12 40%, #030a10 100%)",
        }}
      >
        {/* ── Grid Background ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34,211,238,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34,211,238,0.04) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            animation: "gridMove 20s linear infinite",
          }}
        />

        {/* ── Radial Glow ── */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "15%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "700px",
            height: "400px",
            background:
              "radial-gradient(ellipse, rgba(6,182,212,0.07) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "10%",
            right: "5%",
            width: "300px",
            height: "300px",
            background:
              "radial-gradient(ellipse, rgba(239,68,68,0.04) 0%, transparent 70%)",
          }}
        />

        {/* ── Particles ── */}
        <ParticleField />
        <ScanLine />

        {/* ── Navbar ── */}
        <nav className="relative z-20 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Shield SVG */}
            <svg width="28" height="32" viewBox="0 0 28 32" fill="none">
              <path
                d="M14 0L28 5.5V16C28 24 21 30.5 14 32C7 30.5 0 24 0 16V5.5L14 0Z"
                fill="rgba(6,182,212,0.15)"
                stroke="rgba(6,182,212,0.7)"
                strokeWidth="1"
              />
              <path
                d="M14 7L22 10.5V17C22 22 18 26 14 27C10 26 6 22 6 17V10.5L14 7Z"
                fill="rgba(6,182,212,0.08)"
                stroke="rgba(6,182,212,0.4)"
                strokeWidth="0.8"
              />
              <circle cx="14" cy="17" r="3" fill="rgba(6,182,212,0.8)" />
            </svg>
            <div>
              <span className="font-geist-mono text-sm text-cyan-400 tracking-[0.15em]">
                PHANTOM
              </span>
              <span className="font-geist-mono text-sm text-slate-300 tracking-[0.15em]">
                SHIELD
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {["Architecture", "Docs", "Simulation", "Intelligence"].map(
              (item) => (
                <button
                  key={item}
                  className="font-geist-mono text-xs tracking-widest text-slate-500 hover:text-cyan-400 transition-colors uppercase cursor-pointer"
                >
                  {item}
                </button>
              ),
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-geist-mono text-xs text-slate-500 tracking-widest">
              SYSTEM ONLINE
            </span>
          </div>
        </nav>

        {/* ── Main Content ── */}
        <main className="relative z-20 max-w-7xl mx-auto px-8 pt-12 pb-20">
          <div className="grid lg:grid-cols-[1fr_420px] gap-16 items-center min-h-[80vh]">
            {/* LEFT — Primary Content */}
            <div className="flex flex-col gap-8">
              {/* ── Tier Badge (Anchor Tier — Utility) ── */}
              <div
                className={`inline-flex items-center gap-3 w-fit border border-pulse rounded-sm px-4 py-2 transition-all duration-700 ${
                  mounted
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-3"
                }`}
                style={{ borderColor: "rgba(34,211,238,0.25)" }}
              >
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1 bg-cyan-400 rounded-full"
                      style={{
                        height: `${8 + i * 4}px`,
                        opacity: 0.4 + i * 0.3,
                      }}
                    />
                  ))}
                </div>
                <span className="font-rajdhani text-[10px] tracking-[0.25em] text-cyan-500 uppercase">
                  ACTIVE DECEPTION FRAMEWORK · v1.0
                </span>
              </div>

              {/* ── Headline (Anchor — Primary) ── */}
              <div
                className={`transition-all duration-700 delay-100 ${
                  mounted
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
              >
                <h1
                  className="flicker leading-none tracking-tight"
                  style={{
                    fontSize: "clamp(3rem, 6vw, 5.5rem)",
                    fontWeight: 700,
                  }}
                >
                  <span className="text-slate-100 block">
                    <GlitchText text="Let Attackers" />
                  </span>
                  <span
                    className="block"
                    style={{
                      background:
                        "linear-gradient(90deg, #22d3ee 0%, #06b6d4 40%, #0e7490 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Think They Won
                  </span>
                  <span
                    className="text-slate-500 block"
                    style={{ fontSize: "0.7em" }}
                  >
                     While You Watch.
                  </span>
                </h1>
              </div>

              {/* ── Subheadline (Support — Secondary) ── */}
              <div
                className={`transition-all duration-700 delay-200 ${
                  mounted
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
              >
                <p
                  className="text-slate-400 leading-relaxed max-w-lg"
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 300,
                    letterSpacing: "0.01em",
                  }}
                >
                  PhantomShield routes confirmed threats into a{" "}
                  <span className="text-cyan-400 font-medium">
                    cryptographically isolated decoy system
                  </span>{" "}
                  — capturing forensic intelligence while your real
                  infrastructure remains untouched.
                </p>
              </div>

              {/* ── Terminal Block ── */}
              <div
                className={`transition-all duration-700 delay-300 ${
                  mounted
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
              >
                <div
                  className="rounded-sm border p-4 flex flex-col gap-2"
                  style={{
                    borderColor: "rgba(34,211,238,0.12)",
                    background: "rgba(6,182,212,0.03)",
                  }}
                >
                  <TerminalLine
                    text="SESSION_CREATED → risk_score: 0.0 → routing: REAL"
                    delay={800}
                  />
                  <TerminalLine
                    text="ANOMALY_DETECTED → api_enumeration: true → risk_score: 0.74"
                    delay={1800}
                    color="text-yellow-500"
                  />
                  <TerminalLine
                    text="POLICY_ENGINE → ESCALATE: REAL → DECOY [ONE-WAY]"
                    delay={2700}
                    color="text-red-400"
                  />
                  <TerminalLine
                    text="FORENSICS_LOGGER → session captured, canary_trap: ARMED"
                    delay={3600}
                  />
                </div>
              </div>

              {/* ── CTAs ── */}
              <div
                className={`flex flex-wrap items-center gap-4 transition-all duration-700 delay-500 ${
                  mounted
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
              >
                <button
                  className="cta-primary rounded-sm px-8 py-3.5 font-rajdhani font-semibold tracking-widest text-sm text-slate-900 uppercase cursor-pointer"
                  //   onMouseEnter={() => setCtaHover(true)}
                  //   onMouseLeave={() => setCtaHover(false)}
                >
                  <span className="flex items-center gap-2 cursor-pointer">
                    "DEPLOY SYSTEM"
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M1 7H13M13 7L8 2M13 7L8 12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </button>

                <button
                  className="cta-secondary rounded-sm px-8 py-3.5 font-rajdhani font-semibold tracking-widest text-sm text-cyan-400 uppercase cursor-pointer"
                  //   onMouseEnter={() => setDemoHover(true)}
                  //   onMouseLeave={() => setDemoHover(false)}
                >
                  "RUN ATTACK Simulation"
                </button>
              </div>
            </div>

            {/* RIGHT — Status Panel (Utility — Tertiary) */}
            <div
              className={`flex flex-col gap-4 transition-all duration-1000 delay-400 ${
                mounted
                  ? "opacity-100 translate-x-0"
                  : "opacity-100 translate-x-8"
              }`}
            >
              {/* Session Monitor */}
              <div
                className="rounded-sm border p-5 flex flex-col gap-5"
                style={{
                  borderColor: "rgba(34,211,238,0.15)",
                  background:
                    "linear-gradient(135deg, rgba(6,182,212,0.04) 0%, rgba(0,0,0,0) 100%)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-geist-mono text-[10px] tracking-[0.2em] text-slate-600 uppercase">
                    Session Monitor
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-geist-mono text-[9px] text-emerald-500 tracking-widest">
                      LIVE
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                  <RiskNode
                    label="Risk Score"
                    value="0.74"
                    color="text-yellow-400"
                    delay={900}
                  />
                  <RiskNode
                    label="Routing"
                    value="DECOY"
                    color="text-red-400"
                    delay={1000}
                  />
                  <RiskNode
                    label="Sessions"
                    value="1,204"
                    color="text-cyan-400"
                    delay={1100}
                  />
                  <RiskNode
                    label="Canaries Hit"
                    value="38"
                    color="text-orange-400"
                    delay={1200}
                  />
                </div>

                {/* Risk bar */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="font-geist-mono text-[9px] text-slate-600 tracking-widest uppercase">
                      Threat Level
                    </span>
                    <span className="font-geist-mono text-[9px] text-yellow-400">
                      74%
                    </span>
                  </div>
                  <div
                    className="h-px w-full rounded-full overflow-hidden"
                    style={{ background: "rgba(34,211,238,0.08)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: mounted ? "74%" : "0%",
                        background:
                          "linear-gradient(90deg, #22d3ee, #fbbf24, #ef4444)",
                        transitionDelay: "1.2s",
                        boxShadow: "0 0 8px rgba(251,191,36,0.5)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Routing States */}
              <div
                className="rounded-sm border p-4 flex flex-col gap-3"
                style={{ borderColor: "rgba(34,211,238,0.1)" }}
              >
                <span className="font-geist-mono text-[10px] tracking-[0.2em] text-slate-600 uppercase">
                  Routing State Machine
                </span>
                <div className="flex items-center gap-2">
                  {/* REAL node */}
                  <div
                    className="flex-1 rounded-sm border px-3 py-2 text-center"
                    style={{
                      borderColor: "rgba(34,211,238,0.3)",
                      background: "rgba(34,211,238,0.05)",
                    }}
                  >
                    <div className="font-geist-mono text-xs text-cyan-400 tracking-widest">
                      REAL
                    </div>
                  </div>

                  {/* Arrow — one-way */}
                  <div className="flex flex-col items-center gap-0.5">
                    <svg width="32" height="14" viewBox="0 0 32 14" fill="none">
                      <path
                        d="M0 7H28M28 7L22 2M28 7L22 12"
                        stroke="rgba(239,68,68,0.6)"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="font-geist-mono text-[8px] text-red-500/60 tracking-widest">
                      ONE-WAY
                    </span>
                  </div>

                  {/* DECOY node */}
                  <div
                    className="flex-1 rounded-sm border px-3 py-2 text-center"
                    style={{
                      borderColor: "rgba(239,68,68,0.3)",
                      background: "rgba(239,68,68,0.05)",
                    }}
                  >
                    <div className="font-geist-mono text-xs text-red-400 tracking-widest">
                      DECOY
                    </div>
                  </div>
                </div>
                <p className="font-geist-mono text-[9px] text-slate-600 leading-relaxed">
                  Escalation is irreversible. DECOY → REAL is architecturally
                  forbidden.
                </p>
              </div>

              {/* Canary indicator */}
              <div
                className="rounded-sm border p-4 flex items-center gap-4"
                style={{
                  borderColor: "rgba(251,191,36,0.15)",
                  background: "rgba(251,191,36,0.03)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(251,191,36,0.1)",
                    border: "1px solid rgba(251,191,36,0.2)",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 1L10 6H15L11 9.5L12.5 15L8 11.5L3.5 15L5 9.5L1 6H6L8 1Z"
                      fill="rgba(251,191,36,0.6)"
                      stroke="rgba(251,191,36,0.8)"
                      strokeWidth="0.5"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-geist-mono text-xs text-yellow-400 tracking-widest mb-0.5">
                    CANARY TRAPS ARMED
                  </div>
                  <div className="font-geist-mono text-[9px] text-slate-600">
                    12 bait endpoints active · 0 false positives
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom Stats Strip ── */}
          <div
            className={`mt-4 border-t pt-6 grid grid-cols-2 md:grid-cols-4 gap-6 transition-all duration-700 delay-700 ${
              mounted ? "opacity-100" : "opacity-0"
            }`}
            style={{ borderColor: "rgba(34,211,238,0.08)" }}
          >
            {[
              {
                label: "Architecture Rule",
                value: "Auth ≠ Trust",
                sub: "JWT is identity only",
              },
              {
                label: "Policy Engine",
                value: "Advisory",
                sub: "Risk scores never route",
              },
              {
                label: "DB Isolation",
                value: "Postgres / Mongo",
                sub: "Real / Decoy strict split",
              },
              {
                label: "Forensic Log",
                value: "100% Coverage",
                sub: "Every decoy interaction",
              },
            ].map((item, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span className="font-geist-mono text-[9px] tracking-widest text-slate-600 uppercase">
                  {item.label}
                </span>
                <span className="font-rajdhani text-sm font-semibold text-slate-300 tracking-wide">
                  {item.value}
                </span>
                <span className="font-geist-mono text-[9px] text-slate-600">
                  {item.sub}
                </span>
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
