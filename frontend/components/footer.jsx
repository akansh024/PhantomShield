import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────────────
   PHANTOMSHIELD — FOOTER
   Brand: #030a10 · #22d3ee · #ef4444 · #f59e0b · #a78bfa
   Fonts: Space Grotesk · JetBrains Mono
   Style: Brand-consistent · Editorial · Professional breathing
───────────────────────────────────────────────────────────── */

const noise = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

function useInView(t = 0.05) {
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

/* ── NAV LINK ── */
function FootLink({ label, tag, delay, live }) {
  const [hov, setHov] = useState(false);
  return (
    <a
      href="#"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        textDecoration: "none",
        opacity: live ? 1 : 0,
        transform: live ? "none" : "translateX(-10px)",
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
        cursor: "pointer",
        gap: 16,
      }}
    >
      <span style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: hov ? 600 : 400,
        fontSize: "0.875rem",
        letterSpacing: "-0.01em",
        color: hov ? "#f1f5f9" : "rgba(255,255,255,0.42)",
        transition: "color 0.2s ease, font-weight 0.2s ease",
      }}>
        {label}
      </span>
      {tag && (
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 7, letterSpacing: "0.16em",
          color: hov ? "rgba(34,211,238,0.6)" : "rgba(255,255,255,0.15)",
          transition: "color 0.2s ease",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}>
          {tag}
        </span>
      )}
      <svg
        width="10" height="10" viewBox="0 0 10 10" fill="none"
        style={{
          opacity: hov ? 1 : 0,
          transform: hov ? "translate(0,0)" : "translate(-4px,4px)",
          transition: "all 0.2s ease",
          flexShrink: 0,
        }}
      >
        <path d="M1 9L9 1M9 1H3M9 1v6" stroke="#22d3ee" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    </a>
  );
}

/* ── STATUS CHIP ── */
function StatusChip({ label, status, color }) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 16px",
      border: "1px solid rgba(255,255,255,0.05)",
      background: "rgba(255,255,255,0.02)",
      backdropFilter: "blur(8px)",
    }}>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 8, letterSpacing: "0.14em",
        color: "rgba(255,255,255,0.3)",
        textTransform: "uppercase",
      }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{
          width: 5, height: 5, borderRadius: "50%",
          background: color,
          boxShadow: `0 0 6px ${color}`,
          animation: "statusPulse 2.5s ease-in-out infinite",
        }} />
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 8, letterSpacing: "0.14em",
          color,
          textTransform: "uppercase",
        }}>
          {status}
        </span>
      </div>
    </div>
  );
}

/* ── SOCIAL ICON ── */
function Social({ href, label, live, delay }) {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 38, height: 38,
        border: hov ? "1px solid rgba(34,211,238,0.4)" : "1px solid rgba(255,255,255,0.08)",
        background: hov ? "rgba(34,211,238,0.07)" : "rgba(255,255,255,0.025)",
        backdropFilter: "blur(8px)",
        textDecoration: "none",
        transition: "all 0.25s ease",
        opacity: live ? 1 : 0,
        transform: live ? "none" : "translateY(10px)",
        transitionProperty: "border, background, opacity, transform",
        transitionDuration: "0.25s, 0.25s, 0.5s, 0.5s",
        transitionDelay: `0ms, 0ms, ${delay}ms, ${delay}ms`,
      }}
      aria-label={label}
    >
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, letterSpacing: "0.08em",
        color: hov ? "#22d3ee" : "rgba(255,255,255,0.4)",
        transition: "color 0.25s ease",
      }}>
        {label}
      </span>
    </a>
  );
}

/* ── MAIN ── */
export default function Footer() {
  const [fRef, fV] = useInView(0.05);
  const [bRef, bV] = useInView(0.1);
  const year = new Date().getFullYear();

  const nav = [
    {
      heading: "System",
      links: [
        { label: "Architecture",        tag: "docs/architecture.md" },
        { label: "Threat Model",         tag: "docs/threat_model.md" },
        { label: "Risk & Policy",        tag: "docs/risk_policy.md" },
        { label: "Canary Design",        tag: "docs/canary_design.md" },
        { label: "Attack Analysis",      tag: "docs/attack_analysis.md" },
      ],
    },
    {
      heading: "Layers",
      links: [
        { label: "Auth & Session",       tag: "app/api/auth/" },
        { label: "Behaviour Engine",     tag: "app/behavior/" },
        { label: "Policy Engine",        tag: "app/policy/" },
        { label: "Decoy APIs",           tag: "app/api/decoy/" },
        { label: "Forensics",            tag: "app/forensics/" },
      ],
    },
    {
      heading: "Develop",
      links: [
        { label: "API Reference",        tag: "v1.0" },
        { label: "Attack Simulation",    tag: "attacks/" },
        { label: "ML Module",            tag: "ml/ · optional" },
        { label: "Frontend Source",      tag: "frontend/" },
        { label: "Docker Compose",       tag: "docker-compose.yml" },
      ],
    },
  ];

  const statuses = [
    { label: "Deception Layer",   status: "Active",    color: "#22d3ee" },
    { label: "Forensic Capture",  status: "Armed",     color: "#22d3ee" },
    { label: "Canary Traps",      status: "Live",      color: "#f59e0b" },
    { label: "Real DB",           status: "Isolated",  color: "#10b981" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;700&display=swap');

        @keyframes breatheGlow {
          0%,100%{ opacity:.045; transform:scale(1); }
          50%    { opacity:.1;   transform:scale(1.04); }
        }
        @keyframes statusPulse {
          0%,100%{ opacity:.7; }
          50%    { opacity:1; }
        }
        @keyframes tickerScroll {
          0%  { transform:translateX(0); }
          100%{ transform:translateX(-50%); }
        }
        @keyframes riseIn {
          from{ opacity:0; transform:translateY(18px); }
          to  { opacity:1; transform:translateY(0); }
        }
        @keyframes ripple {
          0%  { transform:scale(1);   opacity:.4; }
          100%{ transform:scale(3);   opacity:0; }
        }
      `}</style>

      <footer
        ref={fRef}
        style={{
          background: "#030a10",
          position: "relative",
          overflow: "hidden",
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        {/* 40px grid */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `
            linear-gradient(rgba(34,211,238,0.018) 1px,transparent 1px),
            linear-gradient(90deg,rgba(34,211,238,0.018) 1px,transparent 1px)`,
          backgroundSize: "40px 40px",
        }} />

        {/* Grain */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: noise, backgroundSize: "200px",
          opacity: 0.028, mixBlendMode: "overlay",
        }} />

        {/* Ambient glow — top */}
        <div style={{
          position: "absolute", top: "-20%", left: "50%",
          transform: "translateX(-50%)",
          width: 900, height: 400,
          background: "radial-gradient(ellipse,rgba(34,211,238,0.04) 0%,transparent 65%)",
          animation: "breatheGlow 11s ease-in-out infinite",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "5%",
          width: 400, height: 400,
          background: "radial-gradient(ellipse,rgba(167,139,250,0.03) 0%,transparent 65%)",
          animation: "breatheGlow 16s ease-in-out infinite 6s",
          pointerEvents: "none",
        }} />

        {/* ══ TOP DIVIDER TAPE ══════════════════════════════ */}
        <div style={{
          borderBottom: "1px solid rgba(34,211,238,0.07)",
          overflow: "hidden",
          padding: "7px 0",
        }}>
          <div style={{
            display: "flex", whiteSpace: "nowrap",
            animation: "tickerScroll 28s linear infinite",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8, letterSpacing: "0.24em",
            color: "rgba(34,211,238,0.22)", gap: "5rem",
          }}>
            {Array(6).fill(
              "AUTH ≠ TRUST · SESSION IS SOURCE OF TRUTH · RISK ENGINE IS ADVISORY · POLICY ENGINE OWNS ROUTING · ESCALATION IS ONE-WAY · DECOY NEVER TOUCHES POSTGRES · 100% FORENSIC COVERAGE · "
            ).map((t, i) => <span key={i}>{t}</span>)}
          </div>
        </div>

        {/* ══ BIG CTA BLOCK ════════════════════════════════ */}
        <div
          ref={bRef}
          style={{
            maxWidth: "86rem", margin: "0 auto",
            padding: "80px 2.5rem 72px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 60,
            alignItems: "center",
          }}
        >
          {/* Left */}
          <div style={{
            opacity: bV ? 1 : 0,
            animation: bV ? "riseIn 0.9s cubic-bezier(0.16,1,0.3,1) both" : "none",
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 8, letterSpacing: "0.26em",
              color: "rgba(34,211,238,0.4)",
              textTransform: "uppercase",
              marginBottom: 20,
            }}>
              // Ready to deploy
            </div>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(2.4rem, 5.5vw, 5.5rem)",
              lineHeight: 0.92,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
              margin: "0 0 0",
              color: "#f1f5f9",
            }}>
              Stop alerting.
            </h2>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(2.4rem, 5.5vw, 5.5rem)",
              lineHeight: 0.92,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
              margin: "0 0 28px",
              color: "#22d3ee",
            }}>
              Start collecting.
            </h2>
            <p style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 400, fontSize: "0.95rem",
              lineHeight: 1.75, letterSpacing: "-0.005em",
              color: "rgba(255,255,255,0.38)",
              margin: "0 0 36px",
              maxWidth: 480,
            }}>
              PhantomShield turns every intrusion attempt into a forensic intelligence asset.
              Deploy in minutes. Collect indefinitely.
            </p>

            {/* Command line */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 12,
              padding: "14px 20px",
              background: "rgba(255,255,255,0.025)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9, letterSpacing: "0.08em",
                color: "rgba(34,211,238,0.5)",
              }}>$</span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9, letterSpacing: "0.06em",
                color: "rgba(255,255,255,0.55)",
              }}>
                uvicorn app.main:app --reload
              </span>
              <div style={{
                width: 6, height: 13,
                background: "#22d3ee", opacity: 0.6,
                animation: "statusPulse 1s step-end infinite",
              }} />
            </div>
          </div>

          {/* Right — CTA buttons + status */}
          <div style={{
            display: "flex", flexDirection: "column",
            gap: 12, flexShrink: 0, minWidth: 240,
            opacity: bV ? 1 : 0,
            transform: bV ? "none" : "translateY(20px)",
            transition: "all 0.8s ease 0.2s",
          }}>
            <button
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700, fontSize: "0.85rem",
                letterSpacing: "-0.01em",
                padding: "15px 32px",
                background: "#22d3ee",
                color: "#030a10",
                border: "none", cursor: "pointer",
                transition: "all 0.22s ease",
                textTransform: "uppercase",
              }}
              onMouseEnter={e => { e.target.style.boxShadow = "0 0 30px rgba(34,211,238,0.35)"; e.target.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.target.style.boxShadow = "none"; e.target.style.transform = "none"; }}
            >
              Deploy PhantomShield
            </button>
            <button
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600, fontSize: "0.85rem",
                letterSpacing: "-0.01em",
                padding: "15px 32px",
                background: "transparent",
                color: "rgba(34,211,238,0.55)",
                border: "1px solid rgba(34,211,238,0.2)",
                cursor: "pointer", transition: "all 0.22s ease",
                textTransform: "uppercase",
              }}
              onMouseEnter={e => { e.target.style.borderColor = "rgba(34,211,238,0.5)"; e.target.style.color = "#22d3ee"; e.target.style.background = "rgba(34,211,238,0.05)"; }}
              onMouseLeave={e => { e.target.style.borderColor = "rgba(34,211,238,0.2)"; e.target.style.color = "rgba(34,211,238,0.55)"; e.target.style.background = "transparent"; }}
            >
              View Architecture
            </button>

            {/* Status grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {statuses.map((s, i) => <StatusChip key={i} {...s} />)}
            </div>
          </div>
        </div>

        {/* ══ NAV + BRAND BLOCK ════════════════════════════ */}
        <div style={{
          maxWidth: "86rem", margin: "0 auto",
          padding: "64px 2.5rem 0",
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr 1fr 1fr",
          gap: 0,
        }}>

          {/* Brand column */}
          <div style={{
            paddingRight: 64, paddingBottom: 64,
            borderRight: "1px solid rgba(255,255,255,0.04)",
            opacity: fV ? 1 : 0,
            transform: fV ? "none" : "translateY(16px)",
            transition: "all 0.7s ease",
          }}>
            {/* Logo mark */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
              <svg width="32" height="36" viewBox="0 0 32 36" fill="none">
                <path
                  d="M16 1L31 6.5V18C31 27 23 33.5 16 35C9 33.5 1 27 1 18V6.5L16 1z"
                  fill="rgba(34,211,238,0.1)"
                  stroke="rgba(34,211,238,0.6)"
                  strokeWidth="1"
                />
                <path
                  d="M16 8L24 11.5V18C24 23 20 27 16 28C12 27 8 23 8 18V11.5L16 8z"
                  fill="rgba(34,211,238,0.06)"
                  stroke="rgba(34,211,238,0.35)"
                  strokeWidth="0.8"
                />
                <circle cx="16" cy="18" r="3.5" fill="rgba(34,211,238,0.85)" />
              </svg>
              <div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10, letterSpacing: "0.2em",
                  color: "#22d3ee",
                }}>
                  PHANTOM
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10, letterSpacing: "0.2em",
                  color: "rgba(255,255,255,0.55)",
                  marginTop: -2,
                }}>
                  SHIELD
                </div>
              </div>
            </div>

            <p style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 400, fontSize: "0.875rem",
              lineHeight: 1.75, letterSpacing: "-0.005em",
              color: "rgba(255,255,255,0.32)",
              margin: "0 0 32px",
              maxWidth: 280,
            }}>
              Active deception framework for post-authentication threat isolation.
              Built to sustain a parallel phantom reality indefinitely.
            </p>

            {/* Build info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 36 }}>
              {[
                ["Version",   "v1.0 · Production"],
                ["Stack",     "FastAPI · Redis · PostgreSQL · MongoDB"],
                ["Frontend",  "React · Vite"],
                ["License",   "MIT · Open Source"],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 8, letterSpacing: "0.14em",
                    color: "rgba(255,255,255,0.22)",
                    textTransform: "uppercase",
                    minWidth: 64, flexShrink: 0,
                  }}>
                    {k}
                  </span>
                  <span style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 500, fontSize: "0.78rem",
                    color: "rgba(255,255,255,0.42)",
                    letterSpacing: "-0.005em",
                  }}>
                    {v}
                  </span>
                </div>
              ))}
            </div>

            {/* Socials */}
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "GH",  href: "#" },
                { label: "TW",  href: "#" },
                { label: "DC",  href: "#" },
                { label: "LI",  href: "#" },
              ].map((s, i) => (
                <Social key={i} {...s} live={fV} delay={i * 60} />
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {nav.map((col, ci) => (
            <div
              key={ci}
              style={{
                padding: "0 0 64px 48px",
                borderRight: ci < nav.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                opacity: fV ? 1 : 0,
                transform: fV ? "none" : "translateY(16px)",
                transition: `all 0.7s ease ${ci * 80 + 100}ms`,
              }}
            >
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 8, letterSpacing: "0.22em",
                color: "rgba(34,211,238,0.4)",
                textTransform: "uppercase",
                marginBottom: 20,
                paddingBottom: 14,
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}>
                {col.heading}
              </div>
              {col.links.map((link, li) => (
                <FootLink
                  key={li}
                  label={link.label}
                  tag={link.tag}
                  live={fV}
                  delay={ci * 80 + li * 55 + 200}
                />
              ))}
            </div>
          ))}
        </div>

        {/* ══ BOTTOM BAR ═══════════════════════════════════ */}
        <div style={{
          maxWidth: "86rem", margin: "0 auto",
          padding: "24px 2.5rem",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap", gap: 16,
          opacity: fV ? 1 : 0,
          transition: "opacity 0.7s ease 0.5s",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 8, letterSpacing: "0.14em",
              color: "rgba(255,255,255,0.2)",
            }}>
              © {year} PhantomShield · REF: PS-v1
            </span>
            <span style={{ color: "rgba(255,255,255,0.08)", fontSize: 10 }}>·</span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 8, letterSpacing: "0.14em",
              color: "rgba(255,255,255,0.15)",
            }}>
              MIT License
            </span>
          </div>

          {/* Architecture principles */}
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              "Auth ≠ Trust",
              "Risk Advisory Only",
              "One-Way Escalation",
              "Zero DB Crossover",
            ].map((p, i) => (
              <span key={i} style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 7, letterSpacing: "0.15em",
                color: "rgba(255,255,255,0.18)",
                textTransform: "uppercase",
              }}>
                {p}
              </span>
            ))}
          </div>

          {/* Live indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative", width: 6, height: 6 }}>
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "#22d3ee", opacity: 0.25,
                animation: "ripple 2.5s ease-out infinite",
              }} />
              <div style={{ position: "absolute", inset: "1.5px", borderRadius: "50%", background: "#22d3ee" }} />
            </div>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 7, letterSpacing: "0.18em",
              color: "rgba(34,211,238,0.4)",
              textTransform: "uppercase",
            }}>
              System Online
            </span>
          </div>
        </div>

      </footer>
    </>
  );
}