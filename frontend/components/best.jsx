import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────────────
   PHANTOMSHIELD — BEST IN THE BUSINESS
   Brand: #030a10 · #22d3ee · #ef4444 · #f59e0b · #a78bfa
   Fonts: Space Grotesk · JetBrains Mono
   Layout: Editorial rows · No bento · Quiet confidence
   Attitude: We don't announce it. The architecture does.
───────────────────────────────────────────────────────────── */

const noise = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

function useInView(t = 0.08) {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setV(true); }, { threshold: t }
    );
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  return [ref, v];
}

function useCount(to, live, ms = 1900) {
  const [val, set] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (!live || done.current) return;
    done.current = true;
    const s = performance.now();
    const run = (t) => {
      const p = Math.min((t - s) / ms, 1);
      set(Math.round((1 - Math.pow(1 - p, 4)) * to));
      if (p < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }, [live]);
  return val;
}

/* ─── PROOF ROW ───────────────────────────────────────────── */
function ProofRow({ idx, tag, color, claim, body, metric, live, delay }) {
  const [hov, setHov] = useState(false);
  const n = useCount(typeof metric.n === "number" ? metric.n : 0, live, 2000);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "56px 1fr 180px",
        gap: 0,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: hov ? "rgba(255,255,255,0.018)" : "transparent",
        transition: "background 0.3s ease",
        opacity: live ? 1 : 0,
        transform: live ? "none" : "translateY(24px)",
        transitionProperty: "opacity, transform, background",
        transitionDuration: "0.7s, 0.7s, 0.3s",
        transitionDelay: `${delay}ms, ${delay}ms, 0ms`,
        position: "relative",
        cursor: "default",
      }}
    >
      {/* Left accent bar on hover */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0,
        width: hov ? 2 : 0,
        background: color,
        transition: "width 0.3s ease",
        borderRadius: 1,
      }} />

      {/* Index */}
      <div style={{
        padding: "44px 0 44px 32px",
        display: "flex", alignItems: "flex-start",
        paddingTop: 46,
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9, letterSpacing: "0.18em",
          color: `${color}45`,
        }}>
          {idx}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "44px 60px 44px 28px" }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 8, letterSpacing: "0.24em",
          color: `${color}55`,
          textTransform: "uppercase",
          marginBottom: 18,
        }}>
          {tag}
        </div>
        <h3 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: "clamp(1.1rem, 1.9vw, 1.6rem)",
          letterSpacing: "-0.03em",
          lineHeight: 1.2,
          color: hov ? "#ffffff" : "#dde1e7",
          margin: "0 0 16px",
          transition: "color 0.25s ease",
          maxWidth: 560,
        }}>
          {claim}
        </h3>
        <p style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 400,
          fontSize: "0.875rem",
          lineHeight: 1.75,
          color: "rgba(255,255,255,0.36)",
          margin: 0,
          maxWidth: 520,
          letterSpacing: "-0.005em",
        }}>
          {body}
        </p>
      </div>

      {/* Metric */}
      <div style={{
        padding: "44px 40px 44px 0",
        display: "flex", flexDirection: "column",
        alignItems: "flex-end", justifyContent: "center",
        gap: 6,
      }}>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: "clamp(2.2rem, 3.2vw, 3.2rem)",
          letterSpacing: "-0.045em",
          color,
          lineHeight: 1,
        }}>
          {typeof metric.n === "number" ? n : metric.n}
          {metric.suffix}
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 8, letterSpacing: "0.14em",
          color: "rgba(255,255,255,0.25)",
          textAlign: "right",
          textTransform: "uppercase",
          lineHeight: 1.55,
          maxWidth: 130,
        }}>
          {metric.label}
        </div>
      </div>
    </div>
  );
}

const PROOFS = [
  {
    idx: "01",
    tag: "Architectural Doctrine",
    color: "#22d3ee",
    claim: "The only framework where getting attacked improves your security posture.",
    body: "Every hour an adversary spends inside the decoy system is an hour of intelligence — tools, TTPs, behavioural patterns — that directly strengthens your real defences. Most systems react to attacks. Ours profits from them.",
    metric: { n: 100, suffix: "%", label: "Decoy interaction captured as threat intel" },
  },
  {
    idx: "02",
    tag: "Structural Integrity",
    color: "#22d3ee",
    claim: "Architecture that cannot be misconfigured into failure.",
    body: "The isolation between real and decoy isn't policy, a toggle, or a config flag. It's the module import graph — a structural invariant present at every layer simultaneously, enforced before the first request is ever received.",
    metric: { n: 0, suffix: "", label: "Configuration paths to DB crossover" },
  },
  {
    idx: "03",
    tag: "Separation of Concerns",
    color: "#f59e0b",
    claim: "Risk scores advice. Policy decides. Nothing else touches routing.",
    body: "Single responsibility enforced architecturally. The risk engine is deliberately blind to routing state. The policy engine is deliberately blind to everything except the score it receives. No component oversteps.",
    metric: { n: 1, suffix: "", label: "Component with routing authority" },
  },
  {
    idx: "04",
    tag: "One-Way Invariant",
    color: "#ef4444",
    claim: "An escalation law with no exceptions and no appeal.",
    body: "Once a session crosses into DECOY state, it remains there for the lifetime of the session. Not because the rules say so — because no code path in the entire codebase returns it to REAL. It's not forbidden. It's absent.",
    metric: { n: 0, suffix: "", label: "Reversal pathways in the codebase" },
  },
];

/* ─── DISTINCTION BAR ─────────────────────────────────────── */
function DistBar({ live }) {
  const items = [
    { n: 0,   s: "ms",  label: "Routing Overhead",   color: "#22d3ee" },
    { n: 7,   s: "",    label: "Isolated Layers",     color: "#22d3ee" },
    { n: 100, s: "%",   label: "Forensic Coverage",   color: "#22d3ee" },
    { n: 0,   s: "",    label: "False Reversions",    color: "#ef4444" },
    { n: 38,  s: "+",   label: "Canary Endpoints",    color: "#f59e0b" },
    { n: 12,  s: "",    label: "Behavioural Signals", color: "#a78bfa" },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(6,1fr)",
      borderTop: "1px solid rgba(255,255,255,0.05)",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    }}>
      {items.map((item, i) => {
        const val = useCount(item.n, live, 1700 + i * 100);
        return (
          <div
            key={i}
            style={{
              padding: "36px 28px",
              borderRight: i < 5 ? "1px solid rgba(255,255,255,0.05)" : "none",
              opacity: live ? 1 : 0,
              transform: live ? "none" : "translateY(16px)",
              transition: `all 0.65s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms`,
            }}
          >
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(1.8rem, 2.8vw, 2.8rem)",
              letterSpacing: "-0.04em",
              color: item.color,
              lineHeight: 1,
              marginBottom: 8,
            }}>
              {val}{item.s}
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 8, letterSpacing: "0.16em",
              color: "rgba(255,255,255,0.28)",
              textTransform: "uppercase",
              lineHeight: 1.55,
            }}>
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── GLASS STATEMENT ─────────────────────────────────────── */
function Statement({ live }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "56px 60px",
        background: hov ? "rgba(255,255,255,0.032)" : "rgba(255,255,255,0.022)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: hov
          ? "1px solid rgba(34,211,238,0.22)"
          : "1px solid rgba(255,255,255,0.06)",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.35s ease",
        opacity: live ? 1 : 0,
        transform: live ? "none" : "translateY(24px)",
        transitionProperty: "opacity, transform, background, border",
        transitionDuration: "0.75s, 0.75s, 0.35s, 0.35s",
        transitionDelay: "200ms, 200ms, 0ms, 0ms",
      }}
    >
      {/* Noise */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: noise, backgroundSize: "180px",
        opacity: 0.025, mixBlendMode: "overlay",
      }} />

      {/* Cyan corner glow */}
      <div style={{
        position: "absolute", top: -80, right: -80,
        width: 280, height: 280, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(34,211,238,0.07) 0%,transparent 65%)",
        opacity: hov ? 1 : 0.4,
        transition: "opacity 0.4s ease",
        pointerEvents: "none",
      }} />

      <div style={{
        position: "relative", zIndex: 2,
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 60, alignItems: "center",
      }}>
        {/* Quote */}
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8, letterSpacing: "0.24em",
            color: "rgba(34,211,238,0.45)",
            textTransform: "uppercase",
            marginBottom: 22,
          }}>
            Design Standard
          </div>
          <blockquote style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            fontSize: "clamp(1.15rem, 2vw, 1.8rem)",
            lineHeight: 1.4,
            letterSpacing: "-0.025em",
            color: "#e8edf3",
            margin: 0,
            maxWidth: 640,
          }}>
            "We didn't build a security product and add deception to it.
            We built a deception system and{" "}
            <span style={{ color: "#22d3ee" }}>
              let that constrain every other decision.
            </span>
            "
          </blockquote>
          <div style={{
            marginTop: 24,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9, letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.22)",
          }}>
            — PhantomShield Architecture Brief · REF: PS-v1
          </div>
        </div>

        {/* Tier stamp */}
        <div style={{ flexShrink: 0, textAlign: "center" }}>
          <svg width="96" height="108" viewBox="0 0 96 108">
            <polygon
              points="48,4 92,26 92,82 48,104 4,82 4,26"
              fill="rgba(34,211,238,0.04)"
              stroke="rgba(34,211,238,0.22)"
              strokeWidth="1"
            />
            <polygon
              points="48,18 78,34 78,74 48,90 18,74 18,34"
              fill="none"
              stroke="rgba(34,211,238,0.08)"
              strokeWidth="0.8"
              strokeDasharray="4 4"
            />
            <text x="48" y="52" textAnchor="middle"
              fontFamily="'JetBrains Mono', monospace"
              fontSize="9" letterSpacing="2" fill="rgba(34,211,238,0.55)">
              TIER
            </text>
            <text x="48" y="70" textAnchor="middle"
              fontFamily="'Space Grotesk', sans-serif"
              fontWeight="700" fontSize="22"
              letterSpacing="-1" fill="#22d3ee">
              01
            </text>
          </svg>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 7, letterSpacing: "0.2em",
            color: "rgba(34,211,238,0.3)",
            textTransform: "uppercase",
            marginTop: 8, lineHeight: 1.6,
          }}>
            Classification<br />PhantomShield
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── COMPARISON STRIP ────────────────────────────────────── */
const CMP = [
  { label: "Server-side session trust",         us: true,  them: false },
  { label: "One-way escalation guarantee",       us: true,  them: false },
  { label: "Risk scorer ≠ routing authority",    us: true,  them: false },
  { label: "Full decoy DB isolation",            us: true,  them: false },
  { label: "100% decoy interaction logging",     us: true,  them: false },
  { label: "Canary trap intelligence capture",   us: true,  them: false },
  { label: "Frontend deception transparency",    us: true,  them: false },
  { label: "Attack simulation suite included",   us: true,  them: false },
];

function CmpTable({ live }) {
  return (
    <div>
      {/* Header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 120px 120px",
        padding: "0 0 12px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        marginBottom: 4,
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 8, letterSpacing: "0.2em",
          color: "rgba(255,255,255,0.22)", textTransform: "uppercase",
        }}>
          Capability
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 8, letterSpacing: "0.2em",
          color: "#22d3ee", textAlign: "center", textTransform: "uppercase",
        }}>
          PhantomShield
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 8, letterSpacing: "0.2em",
          color: "rgba(255,255,255,0.2)", textAlign: "center", textTransform: "uppercase",
        }}>
          Typical SIEM
        </span>
      </div>

      {CMP.map((row, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 120px 120px",
            padding: "12px 0",
            borderBottom: "1px solid rgba(255,255,255,0.03)",
            opacity: live ? 1 : 0,
            transform: live ? "none" : "translateX(-12px)",
            transition: `all 0.45s ease ${i * 70}ms`,
          }}
        >
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 400, fontSize: "0.82rem",
            color: "rgba(255,255,255,0.42)",
            letterSpacing: "-0.005em",
          }}>
            {row.label}
          </span>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" fill="rgba(34,211,238,0.1)" stroke="#22d3ee" strokeWidth="0.8"/>
              <path d="M5 8l2 2.5 4-5" stroke="#22d3ee" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" fill="rgba(100,116,139,0.05)" stroke="rgba(100,116,139,0.2)" strokeWidth="0.8"/>
              <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="rgba(100,116,139,0.35)" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── SIGNATURE TICKER ────────────────────────────────────── */
const SIGS = [
  ["Architecture Pattern",  "Deception-First"],
  ["Session Trust Model",   "Server-Side Only"],
  ["DB Strategy",           "Hard Isolation"],
  ["Risk Engine Role",      "Advisory · Never Routes"],
  ["Escalation Type",       "One-Way · Irreversible"],
  ["Forensic Coverage",     "100% Decoy Interactions"],
];

/* ─── MAIN ─────────────────────────────────────────────────── */
export default function BestInBusiness() {
  const [hRef, hV]   = useInView(0.1);
  const [pRef, pV]   = useInView(0.05);
  const [dRef, dV]   = useInView(0.1);
  const [stRef, stV] = useInView(0.1);
  const [cRef, cV]   = useInView(0.08);
  const [sigRef, sigV] = useInView(0.1);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;700&display=swap');

        @keyframes breatheGlow {
          0%,100%{ opacity:.05; transform:scale(1); }
          50%    { opacity:.11; transform:scale(1.04); }
        }
        @keyframes sigTicker {
          0%  { transform:translateX(0); }
          100%{ transform:translateX(-50%); }
        }
        @keyframes riseIn {
          from{ opacity:0; transform:translateY(20px); }
          to  { opacity:1; transform:translateY(0); }
        }
        @keyframes ripple {
          0%  { transform:scale(1);   opacity:.4; }
          100%{ transform:scale(3.2); opacity:0; }
        }
      `}</style>

      <section style={{
        background: "linear-gradient(180deg,#030a10 0%,#020810 100%)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Space Grotesk', sans-serif",
      }}>

        {/* 40px grid */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `
            linear-gradient(rgba(34,211,238,0.02) 1px,transparent 1px),
            linear-gradient(90deg,rgba(34,211,238,0.02) 1px,transparent 1px)`,
          backgroundSize: "40px 40px",
        }} />

        {/* Grain */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: noise, backgroundSize: "200px",
          opacity: 0.032, mixBlendMode: "overlay",
        }} />

        {/* Glow blobs */}
        <div style={{
          position: "absolute", top: "5%", left: "50%", transform: "translateX(-50%)",
          width: 800, height: 400,
          background: "radial-gradient(ellipse,rgba(34,211,238,0.048) 0%,transparent 65%)",
          animation: "breatheGlow 10s ease-in-out infinite",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "5%",
          width: 500, height: 500,
          background: "radial-gradient(ellipse,rgba(167,139,250,0.035) 0%,transparent 65%)",
          animation: "breatheGlow 14s ease-in-out infinite 5s",
          pointerEvents: "none",
        }} />

        {/* ══ HEADER ══════════════════════════════════════════ */}
        <div
          ref={hRef}
          style={{ maxWidth: "86rem", margin: "0 auto", padding: "100px 2.5rem 80px" }}
        >
          {/* Overline */}
          <div style={{
            display: "flex", alignItems: "center", gap: 14, marginBottom: 56,
            opacity: hV ? 1 : 0,
            transform: hV ? "none" : "translateY(10px)",
            transition: "all 0.6s ease",
          }}>
            <div style={{ position: "relative", width: 8, height: 8 }}>
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "#22d3ee", opacity: 0.3,
                animation: "ripple 2.2s ease-out infinite",
              }} />
              <div style={{ position: "absolute", inset: "2px", borderRadius: "50%", background: "#22d3ee" }} />
            </div>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9, letterSpacing: "0.26em",
              color: "rgba(34,211,238,0.55)", textTransform: "uppercase",
            }}>
              PhantomShield · Why We're Different
            </span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,rgba(34,211,238,0.16),transparent)" }} />
          </div>

          {/* Headline */}
          <div style={{
            opacity: hV ? 1 : 0,
            animation: hV ? "riseIn 0.95s cubic-bezier(0.16,1,0.3,1) both" : "none",
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "clamp(0.7rem,1.1vw,0.9rem)",
              letterSpacing: "0.1em",
              color: "rgba(34,211,238,0.32)",
              marginBottom: 16,
            }}>
              // We don't ask you to take our word for it.
            </div>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(3.2rem,8vw,8.5rem)",
              lineHeight: 0.9,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
              margin: 0,
              color: "#f1f5f9",
            }}>
              The architecture
            </h2>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(3.2rem,8vw,8.5rem)",
              lineHeight: 0.9,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
              margin: "0 0 0",
              display: "flex", flexWrap: "wrap",
              alignItems: "baseline", gap: "0.15em",
            }}>
              <span style={{ color: "#22d3ee" }}>proves</span>
              <span style={{ color: "rgba(241,245,249,0.28)", fontWeight: 300 }}>itself.</span>
            </h2>
          </div>

          {/* Sub row */}
          <div style={{
            marginTop: 48,
            display: "grid", gridTemplateColumns: "1.3fr 1fr",
            gap: 56, alignItems: "end",
            borderTop: "1px solid rgba(34,211,238,0.07)",
            paddingTop: 32,
            opacity: hV ? 1 : 0,
            transform: hV ? "none" : "translateY(12px)",
            transition: "all 0.8s ease 0.3s",
          }}>
            <p style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 400, fontSize: "1rem",
              lineHeight: 1.78, letterSpacing: "-0.005em",
              color: "rgba(255,255,255,0.4)", margin: 0,
            }}>
              Four architectural decisions that no competing system has made — not because they're impossible, but because they require{" "}
              <span style={{ color: "rgba(255,255,255,0.72)", fontWeight: 500 }}>
                designing around the attacker from line one,
              </span>{" "}
              not retrofitting deception as a feature.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 48 }}>
              {[["4","Architectural Proofs"],["0","Exceptions to Any Rule"]].map(([v, l], i) => (
                <div key={i} style={{ textAlign: "right" }}>
                  <div style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700, fontSize: "3rem",
                    color: "#22d3ee", lineHeight: 1,
                    letterSpacing: "-0.04em",
                  }}>{v}</div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 8, letterSpacing: "0.14em",
                    color: "rgba(255,255,255,0.24)", marginTop: 6,
                    textTransform: "uppercase",
                  }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ PROOF ROWS ═══════════════════════════════════════ */}
        <div
          ref={pRef}
          style={{
            maxWidth: "86rem", margin: "0 auto",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {PROOFS.map((p, i) => (
            <ProofRow key={i} {...p} live={pV} delay={i * 110} />
          ))}
        </div>

        {/* ══ NUMBERS BAR ══════════════════════════════════════ */}
        <div ref={dRef} style={{ maxWidth: "86rem", margin: "0 auto" }}>
          <div style={{
            padding: "52px 2.5rem 0",
            display: "flex", alignItems: "center", gap: 14,
            opacity: dV ? 1 : 0, transition: "opacity 0.6s ease",
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 8, letterSpacing: "0.22em",
              color: "rgba(255,255,255,0.22)", textTransform: "uppercase",
            }}>
              By the numbers
            </span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,rgba(34,211,238,0.12),transparent)" }} />
          </div>
          <div style={{ padding: "0 2.5rem" }}>
            <DistBar live={dV} />
          </div>
        </div>

        {/* ══ GLASS STATEMENT ══════════════════════════════════ */}
        <div ref={stRef} style={{ maxWidth: "86rem", margin: "0 auto", padding: "72px 2.5rem" }}>
          <Statement live={stV} />
        </div>

        {/* ══ COMPARISON ═══════════════════════════════════════ */}
        <div
          ref={cRef}
          style={{
            maxWidth: "86rem", margin: "0 auto",
            padding: "0 2.5rem 80px",
            display: "grid",
            gridTemplateColumns: "1fr 1px 1.1fr",
            gap: 0,
            alignItems: "start",
          }}
        >
          {/* Left — label + rhetoric */}
          <div style={{ paddingRight: 72, paddingTop: 8 }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 8, letterSpacing: "0.22em",
              color: "rgba(255,255,255,0.22)", textTransform: "uppercase",
              marginBottom: 28,
            }}>
              Competitive Analysis
            </div>
            <h3 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(1.5rem,2.8vw,2.4rem)",
              letterSpacing: "-0.035em",
              lineHeight: 1.15,
              color: "#e8edf3",
              margin: "0 0 20px",
            }}>
              Everything typical security tools{" "}
              <span style={{ color: "#ef4444" }}>can't do.</span>
            </h3>
            <p style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 400, fontSize: "0.875rem",
              lineHeight: 1.75, letterSpacing: "-0.005em",
              color: "rgba(255,255,255,0.36)", margin: 0,
              maxWidth: 380,
            }}>
              Conventional SIEMs detect, alert, and respond. PhantomShield deceives, captures, and compounds. These aren't competing philosophies — they're different categories entirely.
            </p>

            {/* Decorative vertical line + label */}
            <div style={{
              marginTop: 40, display: "flex",
              alignItems: "center", gap: 14,
            }}>
              {[0.4, 1, 0.4].map((op, i) => (
                <div key={i} style={{
                  height: 24, width: 1.5,
                  background: `rgba(34,211,238,${op})`,
                  borderRadius: 1,
                }} />
              ))}
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 8, letterSpacing: "0.18em",
                color: "rgba(34,211,238,0.45)",
                textTransform: "uppercase",
              }}>
                8 / 8 · PhantomShield Exclusive
              </span>
            </div>
          </div>

          {/* Spine */}
          <div style={{
            alignSelf: "stretch",
            background: "linear-gradient(to bottom,transparent,rgba(34,211,238,0.15) 30%,rgba(34,211,238,0.15) 70%,transparent)",
          }} />

          {/* Right — table */}
          <div style={{ paddingLeft: 72 }}>
            <CmpTable live={cV} />
          </div>
        </div>

        {/* ══ SIGNATURE TICKER ═════════════════════════════════ */}
        <div
          ref={sigRef}
          style={{
            borderTop: "1px solid rgba(34,211,238,0.07)",
            borderBottom: "1px solid rgba(34,211,238,0.07)",
            background: "rgba(34,211,238,0.02)",
            overflow: "hidden",
            opacity: sigV ? 1 : 0,
            transition: "opacity 0.6s ease",
          }}
        >
          <div style={{
            display: "flex", whiteSpace: "nowrap",
            animation: "sigTicker 30s linear infinite",
          }}>
            {Array(4).fill(SIGS).flat().map((s, i) => (
              <div key={i} style={{
                display: "inline-flex", flexDirection: "column",
                padding: "20px 40px",
                borderRight: "1px solid rgba(255,255,255,0.04)",
                flexShrink: 0, gap: 4,
              }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 7, letterSpacing: "0.2em",
                  color: "rgba(255,255,255,0.2)", textTransform: "uppercase",
                }}>
                  {s[0]}
                </span>
                <span style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600, fontSize: "0.8rem",
                  letterSpacing: "-0.01em",
                  color: "rgba(34,211,238,0.5)",
                }}>
                  {s[1]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ══ CTA ══════════════════════════════════════════════ */}
        <div style={{
          maxWidth: "86rem", margin: "0 auto",
          padding: "64px 2.5rem 100px",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap", gap: 32,
        }}>
          <div>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(1.2rem,2.2vw,1.8rem)",
              letterSpacing: "-0.03em",
              color: "#f1f5f9", marginBottom: 7,
            }}>
              Read the architecture docs.
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9, letterSpacing: "0.13em",
              color: "rgba(34,211,238,0.35)",
            }}>
              docs/architecture.md · docs/threat_model.md · docs/risk_policy.md
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700, fontSize: "0.82rem",
                letterSpacing: "-0.01em",
                padding: "13px 32px",
                background: "#22d3ee",
                color: "#030a10",
                border: "none", cursor: "pointer",
                transition: "all 0.22s ease",
                textTransform: "uppercase",
              }}
              onMouseEnter={e => { e.target.style.boxShadow = "0 0 28px rgba(34,211,238,0.32)"; e.target.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.target.style.boxShadow = "none"; e.target.style.transform = "none"; }}
            >
              View Architecture
            </button>
            <button
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600, fontSize: "0.82rem",
                letterSpacing: "-0.01em",
                padding: "13px 28px",
                background: "transparent",
                color: "rgba(34,211,238,0.55)",
                border: "1px solid rgba(34,211,238,0.2)",
                cursor: "pointer", transition: "all 0.22s ease",
                textTransform: "uppercase",
              }}
              onMouseEnter={e => { e.target.style.borderColor = "rgba(34,211,238,0.5)"; e.target.style.color = "#22d3ee"; e.target.style.background = "rgba(34,211,238,0.05)"; }}
              onMouseLeave={e => { e.target.style.borderColor = "rgba(34,211,238,0.2)"; e.target.style.color = "rgba(34,211,238,0.55)"; e.target.style.background = "transparent"; }}
            >
              Deploy Now
            </button>
          </div>
        </div>

      </section>
    </>
  );
}