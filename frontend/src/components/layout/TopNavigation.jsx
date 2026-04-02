import React from 'react';
import { Search, Bell, User, CloudLightning } from 'lucide-react';
import { usePolling } from '../../hooks/usePolling';
import { fetchSessionMe } from '../../api/api';

const TopNavigation = () => {
  const { data: user, loading } = usePolling(fetchSessionMe, 60000, { name: 'Loading...', role: '...' });

  return (
    <div className="h-20 border-b border-white/5 glass flex items-center justify-between px-8 z-10 sticky top-0">
      <div className="flex items-center w-1/3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search sessions, alerts, or IOCs... (Cmd+K)"
            className="w-full bg-black/20 border border-white/10 rounded-md py-2 pl-10 pr-4 text-sm text-gray-300 focus:outline-none focus:border-[var(--color-accent-neon)]/50 focus:ring-1 focus:ring-[var(--color-accent-neon)]/50 transition-all placeholder-gray-500"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 text-xs font-medium px-3 py-1 rounded-full bg-[var(--color-accent-neon)]/10 text-[var(--color-accent-neon)] border border-[var(--color-accent-neon)]/20 shadow-[0_0_10px_rgba(0,255,170,0.1)]">
          <CloudLightning size={14} className="fill-[var(--color-accent-neon)]" />
          <span>SYSTEM ACTIVE</span>
        </div>

        <button className="relative text-gray-400 hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse blur-[1px]"></span>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center space-x-3 cursor-pointer pl-4 border-l border-white/10">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-200">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[var(--color-accent-neon)] to-[#0066ff] p-[2px]">
            <div className="w-full h-full bg-[var(--color-primary-base)] rounded-full flex items-center justify-center">
              <User size={16} className="text-gray-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNavigation;
