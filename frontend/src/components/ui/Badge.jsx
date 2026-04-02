import React from 'react';

const colors = {
  green: 'bg-[var(--color-accent-neon)]/10 text-[var(--color-accent-neon)] border-[var(--color-accent-neon)]/20 shadow-[0_0_10px_rgba(0,255,170,0.1)]',
  red: 'bg-[var(--color-accent-red)]/10 text-[var(--color-accent-red)] border-[var(--color-accent-red)]/20 shadow-[0_0_10px_rgba(255,51,102,0.1)]',
  cyan: 'bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)] border-[var(--color-accent-cyan)]/20 shadow-[0_0_10px_rgba(0,212,255,0.1)]',
  gray: 'bg-white/5 text-gray-400 border-white/10'
};

const Badge = ({ children, variant = 'gray', className = '' }) => {
  const baseStyle = "px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center justify-center w-max";
  const colorStyle = colors[variant] || colors.gray;

  return (
    <span className={`${baseStyle} ${colorStyle} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
