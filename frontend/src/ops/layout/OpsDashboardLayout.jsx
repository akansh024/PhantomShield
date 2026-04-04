import { X } from "lucide-react";
import { useState } from "react";
import { Outlet } from "react-router-dom";

import OpsSidebar from "./OpsSidebar";
import OpsTopBar from "./OpsTopBar";

export default function OpsDashboardLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-[#070b17] text-gray-100">
      <div className="flex h-full overflow-hidden">
        <OpsSidebar className="hidden lg:flex" />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <OpsTopBar onToggleSidebar={() => setMobileNavOpen(true)} />
          <main className="relative flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7 scrollbar-custom">
            <div className="pointer-events-none absolute left-[-10%] top-[-15%] h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-[120px]" />
            <div className="pointer-events-none absolute bottom-[-18%] right-[-8%] h-[380px] w-[380px] rounded-full bg-red-500/10 blur-[150px]" />
            <div className="relative z-10 mx-auto w-full max-w-[1480px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation menu"
          />
          <div className="relative h-full w-[84vw] max-w-80">
            <OpsSidebar className="flex h-full" onNavigate={() => setMobileNavOpen(false)} />
            <button
              type="button"
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/20 bg-black/40 text-white"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation menu"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
