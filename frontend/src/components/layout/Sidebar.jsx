import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, LayoutDashboard, List, Activity, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, end: true },
    { name: 'Sessions', path: '/dashboard/sessions', icon: <List size={20} /> },
    { name: 'Forensics', path: '/dashboard/forensics', icon: <Activity size={20} /> },
    { name: 'Settings', path: '/dashboard/settings', icon: <Settings size={20} /> }
  ];

  return (
    <motion.div
      initial={{ width: 240 }}
      animate={{ width: isCollapsed ? 80 : 240 }}
      className="h-screen glass flex flex-col border-r border-white/5 relative z-20 transition-all duration-300"
    >
      <div className="flex items-center justify-center h-20 border-b border-white/5">
        <Shield className="text-[var(--color-accent-neon)] drop-shadow-[0_0_8px_rgba(0,255,170,0.5)] mr-2" size={32} />
        {!isCollapsed && <span className="font-bold text-xl tracking-wider text-white">PHANTOM</span>}
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-[var(--color-accent-neon)]/10 text-[var(--color-accent-neon)] border border-[var(--color-accent-neon)]/20 shadow-[inset_0_0_10px_rgba(0,255,170,0.1)]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              } ${isCollapsed ? 'justify-center' : ''}`
            }
          >
            {item.icon}
            {!isCollapsed && <span className="ml-4 font-medium">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-24 bg-[var(--color-primary-base)] border border-white/10 rounded-full p-1 text-gray-400 hover:text-white hover:bg-white/5 transition-colors z-30"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className="p-4 border-t border-white/5 text-xs text-center text-gray-500">
        {!isCollapsed ? 'v1.0.0-beta' : 'v1'}
      </div>
    </motion.div>
  );
};

export default Sidebar;
