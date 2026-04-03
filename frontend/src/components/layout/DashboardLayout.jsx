import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavigation from './TopNavigation';

const DashboardLayout = () => {
  return (
    <div className="flex h-screen bg-[var(--color-primary-base)] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopNavigation />
        <main className="flex-1 overflow-y-auto scrollbar-custom p-6 relative">
          {/* Subtle background glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--color-accent-neon)]/5 blur-[120px] rounded-full pointer-events-none z-0"></div>
          <div className="relative z-10 w-full max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
