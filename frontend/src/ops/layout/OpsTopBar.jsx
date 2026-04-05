import { Bell, Clock3, Menu, RefreshCw, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { fetchSessionMe } from "../../api/api";

const ROUTE_LABELS = {
  "/dashboard": "Operations Overview",
  "/dashboard/sessions": "Session Monitoring",
  "/dashboard/forensics": "Forensic Event Stream",
  "/dashboard/analytics": "Behavior Analytics",
  "/dashboard/alerts": "Suspicious Activity Alerts",
};

function resolvePageTitle(pathname) {
  return ROUTE_LABELS[pathname] || "Operations Console";
}

export default function OpsTopBar({
  onToggleSidebar,
  onRefresh,
  refreshing = false,
  autoRefreshEnabled = false,
  onToggleAutoRefresh,
  lastUpdated,
}) {
  const location = useLocation();
  const [operator, setOperator] = useState({ name: "Loading...", role: "Analyst" });
  
  const title = useMemo(() => resolvePageTitle(location.pathname), [location.pathname]);
  const updatedLabel = lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "Awaiting first sync";

  useEffect(() => {
    async function loadIdentity() {
      try {
        const me = await fetchSessionMe();
        // Cosmetic override for Master Admin
        const displayName = me.name === "Master Admin" ? "Phantom Commander" : me.name;
        setOperator({ ...me, name: displayName });
      } catch (err) {
        setOperator({ name: "Unknown Op", role: "Offline" });
      }
    }
    loadIdentity();
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070b17]/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1480px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 lg:hidden"
            onClick={onToggleSidebar}
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{title}</p>
            <p className="truncate text-xs text-gray-400">PhantomShield live telemetry control surface</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="hidden items-center gap-3 border-r border-white/10 pr-4 lg:flex">
             <div className="text-right">
                <p className="text-[11px] font-bold text-white uppercase tracking-wider">{operator.name}</p>
                <p className="text-[9px] text-cyan-500 font-medium uppercase tracking-[0.1em]">{operator.role}</p>
             </div>
             <div className="h-8 w-8 rounded-lg border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <User size={14} />
             </div>
          </div>

          <span className="hidden items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-gray-400 sm:inline-flex">
            <Clock3 size={13} />
            {updatedLabel}
          </span>

          {/* Manual refresh hidden as per requirements */}

          <button
            type="button"
            className={`inline-flex h-9 items-center rounded-lg border px-3 transition-colors ${
              autoRefreshEnabled
                ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
                : "border-white/10 text-gray-300 hover:bg-white/5"
            }`}
            onClick={onToggleAutoRefresh}
          >
            Auto
          </button>

          <button
            type="button"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-300 hover:bg-white/5"
          >
            <Bell size={15} />
            <span className="absolute top-2 right-2 flex h-1.5 w-1.5">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
               <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500" />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
