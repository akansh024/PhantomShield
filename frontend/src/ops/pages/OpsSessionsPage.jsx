import {
  ArrowUpDown,
  Filter,
  Mail,
  RefreshCw,
  Search,
  ShieldUser,
} from "lucide-react";
import { useMemo, useState } from "react";

import LoadingSkeleton from "../components/LoadingSkeleton";
import ModeBadge from "../components/ModeBadge";
import RiskBadge from "../components/RiskBadge";
import SessionDetailPanel from "../components/SessionDetailPanel";
import { useSessions } from "../hooks/useSessions";

function statusBadge(status) {
  if (status === "active") return "bg-emerald-500/10 text-emerald-300";
  if (status === "idle") return "bg-amber-500/10 text-amber-300";
  return "bg-gray-500/10 text-gray-400";
}

function formatDateTime(value) {
  if (!value) return "--";
  const parsed = new Date(typeof value === "string" && !value.endsWith("Z") ? `${value}Z` : value);
  return parsed.toLocaleString();
}

function saveFocusedSession(session) {
  localStorage.setItem("ops_focus_session", JSON.stringify(session));
  window.dispatchEvent(new Event("ops:focus-session"));
}

export default function OpsSessionsPage() {
  const { loading, error, sessions, filters, updateFilters, refresh } = useSessions();
  const [selectedSession, setSelectedSession] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleRowClick = (session) => {
    setSelectedSession(session);
    saveFocusedSession(session);
    setIsPanelOpen(true);
  };

  const activeFocusedSession = selectedSession || sessions[0] || null;

  const summaryIdentity = useMemo(() => {
    if (!activeFocusedSession) {
      return {
        name: "No session selected",
        email: "Choose a live session for identity context",
        sessionId: "--",
        loginAt: "--",
        state: "REAL",
        sessionType: "guest",
      };
    }
    return {
      name:
        activeFocusedSession.user_name ||
        (activeFocusedSession.user_email
          ? activeFocusedSession.user_email.split("@")[0]
          : "Guest"),
      email:
        activeFocusedSession.user_email ||
        (activeFocusedSession.session_type === "authenticated"
          ? "Authenticated (email unavailable)"
          : "Not signed in"),
      sessionId: activeFocusedSession.session_id,
      loginAt: activeFocusedSession.authenticated_at
        ? formatDateTime(activeFocusedSession.authenticated_at)
        : "Guest / no login",
      state: activeFocusedSession.routing_state,
      sessionType: activeFocusedSession.session_type || "guest",
    };
  }, [activeFocusedSession]);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-white/5 bg-[#0b1021]/80 p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 shadow-inner shadow-cyan-500/20">
                <ShieldUser size={22} />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                Live Session Console
              </h1>
            </div>
            <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
              Default view is <span className="text-cyan-400/80 font-medium whitespace-nowrap">production live traffic only</span>. Historical and test sessions require explicit filters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            <div className="flex flex-1 min-w-[280px] items-center gap-3 sm:flex-initial">
              <div className="relative flex-1 sm:w-64 sm:flex-initial">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search name, email, ID..."
                  value={filters.search}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
              </div>

              <select
                value={filters.mode}
                onChange={(e) => updateFilters({ mode: e.target.value })}
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-semibold text-gray-300 focus:border-cyan-500/50 focus:outline-none hover:bg-white/10 transition-all cursor-pointer"
              >
                <option value="live" className="bg-[#0e1426] text-white">Live only</option>
                <option value="logged_in" className="bg-[#0e1426] text-white">Logged-in</option>
                <option value="guest" className="bg-[#0e1426] text-white">Guest</option>
                <option value="suspicious" className="bg-[#0e1426] text-white">Suspicious</option>
                <option value="historical" className="bg-[#0e1426] text-white">Historical</option>
                <option value="test" className="bg-[#0e1426] text-white">Test / Archived</option>
                <option value="ALL" className="bg-[#0e1426] text-white">All Sessions</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-11 items-center rounded-xl border border-white/10 bg-white/5 p-1">
                {["ALL", "REAL", "DECOY"].map((rt) => (
                  <button
                    key={rt}
                    onClick={() => updateFilters({ routing: rt })}
                    className={`h-full rounded-lg px-4 text-[10px] font-black uppercase tracking-[0.1em] transition-all ${
                      filters.routing === rt
                        ? "bg-cyan-500/20 text-cyan-400 shadow-sm"
                        : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    {rt}
                  </button>
                ))}
              </div>

              <button
                onClick={() => updateFilters({ risk: filters.risk === "HIGH" ? "ALL" : "HIGH" })}
                className={`flex h-11 items-center gap-2 rounded-xl border px-4 text-[10px] font-black uppercase tracking-[0.1em] transition-all ${
                  filters.risk === "HIGH"
                    ? "border-red-500/40 bg-red-500/10 text-red-400 shadow-lg shadow-red-500/10"
                    : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                }`}
              >
                <Filter size={14} />
                {filters.risk === "HIGH" ? "High Risk" : "All Risk"}
              </button>

              <button
                onClick={refresh}
                disabled={loading}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition-all hover:bg-white/10 hover:border-cyan-500/30 hover:text-white disabled:opacity-50 active:scale-95"
                title="Refresh sessions"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-[#0f1322] p-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Identity</p>
          <p className="mt-1 truncate text-sm font-semibold text-white">{summaryIdentity.name}</p>
          <p className="truncate text-xs text-gray-400">{summaryIdentity.email}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Session ID</p>
          <p className="mt-1 truncate font-mono text-xs text-cyan-300">{summaryIdentity.sessionId}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Login Time</p>
          <p className="mt-1 text-xs text-gray-200">{summaryIdentity.loginAt}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Current State</p>
          <div className="mt-1 flex items-center gap-2">
            <ModeBadge mode={summaryIdentity.state} />
            <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-cyan-300">
              {summaryIdentity.sessionType}
            </span>
          </div>
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0e1426] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Session ID</th>
                <th className="px-5 py-4">State</th>
                <th className="px-5 py-4 text-center">Risk</th>
                <th className="px-5 py-4">
                  <span className="inline-flex items-center gap-1">
                    Last Update <ArrowUpDown size={12} className="opacity-60" />
                  </span>
                </th>
                <th className="px-5 py-4">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && sessions.length === 0 ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-5 py-8">
                        <LoadingSkeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ))
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <p className="text-sm text-gray-500">
                      {error || "No sessions found for the selected filter set."}
                    </p>
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr
                    key={session.session_id}
                    onClick={() => handleRowClick(session)}
                    className="group cursor-pointer border-l-2 border-transparent transition-all hover:border-cyan-500/50 hover:bg-cyan-500/5"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 group-hover:border-cyan-500/30 group-hover:text-cyan-400">
                          <ShieldUser size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {session.user_name || (session.user_email ? session.user_email.split("@")[0] : "Guest")}
                          </p>
                          <p className="text-[10px] uppercase tracking-widest text-gray-500">{session.session_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-2 text-xs text-gray-300">
                        <Mail size={13} className="text-gray-500" />
                        <span>{session.user_email || "Not signed in"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-[210px] truncate font-mono text-[11px] text-cyan-300">{session.session_id}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <ModeBadge mode={session.routing_state} />
                        <p className="max-w-[190px] truncate text-[10px] text-gray-500">{session.state_label}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <RiskBadge score={session.risk_score} />
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-300">
                      <p>{formatDateTime(session.last_activity)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${statusBadge(session.status)}`}>
                        {session.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SessionDetailPanel
        session={selectedSession}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </div>
  );
}
