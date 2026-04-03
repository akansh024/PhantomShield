import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Lock, Mail, User, Eye, Activity } from 'lucide-react';

const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDeploy = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Authentication sequence failed");
      }

      // Secure persistence in localStorage
      localStorage.setItem("phantom_token", data.access_token);
      localStorage.setItem("user_name", form.name);
      
      // Navigate back to Landing Page
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;700&display=swap');

        @keyframes breathe {
          0%, 100% { opacity: 0.04; transform: scale(1); }
          50% { opacity: 0.08; transform: scale(1.05); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
      `}</style>
      
      <div className="min-h-screen bg-[var(--color-primary-base)] text-white flex selection:bg-[var(--color-accent-neon)]/30 overflow-hidden font-['Space_Grotesk']">
        
        {/* ── LEFT PANEL: BRAND & VIZ ── */}
        <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 border-r border-white/[0.05]">
          {/* Background Assets */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 255, 170, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 255, 170, 0.03) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
          <div className="absolute inset-0 pointer-events-none opacity-[0.035]"
            style={{ backgroundImage: GRAIN, backgroundSize: "220px", mixBlendMode: "overlay" }}
          />
          {/* Radial Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              width: "120%", height: "120%",
              background: "radial-gradient(circle at center, rgba(0,255,170,0.06) 0%, transparent 60%)",
              animation: "breathe 8s ease-in-out infinite",
            }}
          />
          {/* Scanline */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
             <div className="w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-accent-neon)]/20 to-transparent"
                  style={{ animation: 'scanline 12s linear infinite' }} />
          </div>

          {/* Top: Logo */}
          <Link to="/" className="relative z-10 flex items-center gap-3 w-fit">
            <svg width="30" height="34" viewBox="0 0 30 34" fill="none">
              <path d="M15 1L29 6V17C29 25.5 22 31.5 15 33C8 31.5 1 25.5 1 17V6L15 1z"
                fill="rgba(0, 255, 170, 0.1)" stroke="rgba(0, 255, 170, 0.6)" strokeWidth="1"/>
              <path d="M15 7.5L22 10.5V17C22 21.5 18.5 25 15 26C11.5 25 8 21.5 8 17V10.5L15 7.5z"
                fill="rgba(0, 255, 170, 0.06)" stroke="rgba(0, 255, 170, 0.3)" strokeWidth="0.8"/>
              <circle cx="15" cy="17" r="3.5" fill="rgba(0, 255, 170, 0.9)"/>
            </svg>
            <div>
              <div className="font-['JetBrains_Mono'] text-[10px] tracking-[0.2em] text-[var(--color-accent-neon)]">PHANTOM</div>
              <div className="font-['JetBrains_Mono'] text-[10px] tracking-[0.2em] text-white/45 -mt-0.5">SHIELD</div>
            </div>
          </Link>

          {/* Middle: Architectural Typography */}
          <div className="relative z-10 my-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <div className="font-['JetBrains_Mono'] text-[10px] tracking-[0.2em] text-[var(--color-accent-neon)]/50 uppercase mb-6 flex items-center gap-2">
                <Activity size={12} /> Post-Auth Defensive Subsystem
              </div>
              <h1 className="font-['Space_Grotesk'] text-[clamp(2.5rem,4vw,4.5rem)] font-bold uppercase tracking-tighter leading-[0.88] text-white mb-6">
                Active<br />
                <span className="text-[var(--color-accent-neon)]">Deception</span><br />
                Routing.
              </h1>
              <p className="text-white/40 text-[clamp(0.9rem,1.5vw,1rem)] leading-relaxed max-w-md font-['Space_Grotesk']">
                Provision a cryptographically sealed decoy environment. Route hostile behavioral anomalies automatically. Never compromise production payloads.
              </p>
            </motion.div>
          </div>

          {/* Bottom: Logs */}
          <div className="relative z-10 w-full max-w-sm font-['JetBrains_Mono'] text-[9px] text-white/20 uppercase tracking-widest flex flex-col gap-1">
             <div>// INITIALIZING DECOY CLUSTER... [SUCCESS]</div>
             <div>// MOUNTING RISK ENGINE... [SUCCESS]</div>
             <div>// AWAITING SECURE TERMINAL CONNECTION</div>
          </div>
        </div>

        {/* ── RIGHT PANEL: FORM ── */}
        <div className="w-full lg:w-1/2 relative flex items-center justify-center p-6 sm:p-12">
          {/* Subtle Mobile Grain */}
          <div className="absolute lg:hidden inset-0 pointer-events-none opacity-[0.02]"
            style={{ backgroundImage: GRAIN, backgroundSize: "220px" }} />
            
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="w-full max-w-md relative z-10"
          >
            {/* Mobile Logo Fallback */}
            <Link to="/" className="lg:hidden flex items-center gap-3 w-fit mb-12">
               <Shield size={24} className="text-[var(--color-accent-neon)]" />
               <div className="font-['JetBrains_Mono'] text-[12px] tracking-[0.2em] text-white uppercase">PhantomShield</div>
            </Link>

            <div className="mb-8">
              <h2 className="font-['Space_Grotesk'] text-[clamp(2rem,3vw,3rem)] font-bold uppercase tracking-tighter leading-[0.9] text-white mb-2">Deploy Account</h2>
              <div className="font-['JetBrains_Mono'] text-[10px] tracking-[0.1em] text-white/40">
                INITIATE ZERO-TRUST WORKSPACE
              </div>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-['JetBrains_Mono'] uppercase tracking-widest text-center">
                // SYSTEM ERROR: {error}
              </div>
            )}

            <form onSubmit={handleDeploy} className="flex flex-col gap-6">
              
              {/* Name Input */}
              <div className="group relative">
                <User size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[var(--color-accent-neon)] transition-colors duration-300" />
                <input 
                  type="text" 
                  required
                  placeholder="Operator Identity"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full bg-transparent border-0 border-b border-white/10 py-3 pl-8 text-sm text-white placeholder-white/20 focus:ring-0 focus:border-[var(--color-accent-neon)] focus:outline-none transition-colors duration-300 font-['JetBrains_Mono']"
                />
              </div>

              {/* Email Input */}
              <div className="group relative">
                <Mail size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[var(--color-accent-neon)] transition-colors duration-300" />
                <input 
                  type="email" 
                  required
                  placeholder="Secure Email Address"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  className="w-full bg-transparent border-0 border-b border-white/10 py-3 pl-8 text-sm text-white placeholder-white/20 focus:ring-0 focus:border-[var(--color-accent-neon)] focus:outline-none transition-colors duration-300 font-['JetBrains_Mono']"
                />
              </div>

              {/* Password Input */}
              <div className="group relative">
                <Lock size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[var(--color-accent-neon)] transition-colors duration-300" />
                <input 
                  type="password" 
                  required
                  placeholder="Encryption Key (Password)"
                  value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                  className="w-full bg-transparent border-0 border-b border-white/10 py-3 pl-8 text-sm text-white placeholder-white/20 focus:ring-0 focus:border-[var(--color-accent-neon)] focus:outline-none transition-colors duration-300 font-['JetBrains_Mono']"
                />
                <Eye size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-white/20 cursor-pointer hover:text-white transition-colors duration-200" />
              </div>

              <motion.button
                whileHover={{ y: -2, boxShadow: "0 0 32px rgba(0,255,170,0.25)" }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="mt-4 w-full flex items-center justify-center gap-3 font-['Space_Grotesk'] font-bold text-[14px] tracking-tight uppercase py-4 rounded-md bg-[var(--color-accent-neon)] text-[var(--color-primary-base)] transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                {loading ? "Allocating Node..." : "Provision Instance"} <ArrowRight size={18} strokeWidth={2.5}/>
              </motion.button>
            </form>

            <div className="mt-8 text-center">
              <span className="font-['Space_Grotesk'] text-sm text-white/40">
                Already hold clearances? 
              </span>
              {' '}
              <a href="#" className="font-['Space_Grotesk'] font-medium text-sm text-white hover:text-[var(--color-accent-neon)] transition-colors duration-200">
                Authenticate here.
              </a>
            </div>

          </motion.div>
        </div>

      </div>
    </>
  );
}
