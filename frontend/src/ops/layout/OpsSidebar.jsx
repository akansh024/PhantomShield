import { NavLink } from "react-router-dom";
import { AlertTriangle, BarChart3, LayoutDashboard, ListTree, Radar, Shield } from "lucide-react";

export const OPS_NAV_ITEMS = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/sessions", label: "Sessions", icon: ListTree },
  { to: "/dashboard/forensics", label: "Forensics", icon: Radar },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/alerts", label: "Alerts", icon: AlertTriangle },
];

export default function OpsSidebar({ className = "", onNavigate }) {
  return (
    <aside className={`w-72 flex-col border-r border-white/10 bg-[#0b1020] ${className}`}>
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <span className="rounded-lg bg-cyan-500/15 p-2 text-cyan-300">
          <Shield size={18} />
        </span>
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400">PhantomShield</p>
          <p className="text-sm font-semibold text-white">Operations Console</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {OPS_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            end={item.end}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                isActive
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4 text-xs text-gray-500">
        Phase 1 foundation active
      </div>
    </aside>
  );
}
