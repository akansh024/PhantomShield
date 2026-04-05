import { 
  ArrowUpDown, 
  ExternalLink, 
  Filter, 
  RefreshCw, 
  Search, 
  User 
} from "lucide-react";
import { useState } from "react";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ModeBadge from "../components/ModeBadge";
import RiskBadge from "../components/RiskBadge";
import SessionDetailPanel from "../components/SessionDetailPanel";
import { useSessions } from "../hooks/useSessions";

export default function OpsSessionsPage() {
  const { loading, error, sessions, filters, updateFilters, refresh } = useSessions();
  const [selectedSession, setSelectedSession] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleRowClick = (session) => {
    setSelectedSession(session);
    setIsPanelOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <header className="rounded-2xl border border-cyan-500/20 bg-[#0e1426] p-6 shadow-lg shadow-cyan-500/5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Active Sessions</h1>
            <p className="mt-1 text-sm text-gray-400">
              Correlated session intelligence and real-time behavioral tracing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             {/* Search */}
             <div className="relative group min-w-[240px]">
               <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
               <input 
                 type="text"
                 placeholder="Search Session or User ID..."
                 value={filters.search}
                 onChange={(e) => updateFilters({ search: e.target.value })}
                 className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white focus:border-cyan-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
               />
             </div>

             {/* Mode Filter */}
             <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-1">
               {['ALL', 'REAL', 'DECOY'].map((mode) => (
                 <button
                   key={mode}
                   onClick={() => updateFilters({ mode })}
                   className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                     filters.mode === mode 
                       ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" 
                       : "text-gray-500 hover:text-gray-300"
                   }`}
                 >
                   {mode}
                 </button>
               ))}
             </div>

             {/* Risk Filter */}
             <button
               onClick={() => updateFilters({ risk: filters.risk === 'HIGH' ? 'ALL' : 'HIGH' })}
               className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${
                 filters.risk === 'HIGH'
                   ? "border-red-500/30 bg-red-500/10 text-red-400"
                   : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"
               }`}
             >
               <Filter size={14} />
               {filters.risk === 'HIGH' ? 'HIGH RISK ONLY' : 'ALL RISK'}
             </button>

             <button
               onClick={refresh}
               disabled={loading}
               className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-gray-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
               title="Manual Sync"
             >
               <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
             </button>
          </div>
        </div>
      </header>

      {/* Table Container */}
      <div className="rounded-2xl border border-white/5 bg-[#0e1426] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
                <th className="px-6 py-4">Session Context</th>
                <th className="px-6 py-4">Routing</th>
                <th className="px-6 py-4 text-center">Threat Level</th>
                <th className="px-6 py-4">Discovery</th>
                <th className="px-6 py-4 flex items-center gap-1">
                  Last Activity <ArrowUpDown size={12} className="opacity-50" />
                </th>
                <th className="px-6 py-4 text-right">Tracing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && sessions.length === 0 ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-8"><LoadingSkeleton className="h-6 w-full" /></td>
                  </tr>
                ))
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <p className="text-sm text-gray-500">
                      {error || "No sessions found matching current intelligence filters."}
                    </p>
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr 
                    key={session.session_id}
                    onClick={() => handleRowClick(session)}
                    className="group hover:bg-cyan-500/5 transition-all cursor-pointer border-l-2 border-transparent hover:border-cyan-500/50"
                  >
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                         <div className={`flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-all`}>
                            <User size={14} />
                         </div>
                         <div className="min-w-0">
                           <p className="text-sm font-semibold text-white truncate max-w-[150px]">{session.session_id}</p>
                           <p className="text-[10px] text-gray-500 font-mono italic">{session.user_id || "ANON_SUBJECT"}</p>
                         </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <ModeBadge mode={session.routing_state} />
                    </td>
                    <td className="px-6 py-4 text-center">
                       <RiskBadge score={session.risk_score} size="md" />
                    </td>
                    <td className="px-6 py-4">
                       <p className="text-xs text-gray-300 font-medium">
                         {new Date(typeof session.created_at === 'string' && !session.created_at.endsWith('Z') ? session.created_at + 'Z' : session.created_at).toLocaleDateString()}
                       </p>
                       <p className="text-[10px] text-gray-500 tabular-nums">
                         {new Date(typeof session.created_at === 'string' && !session.created_at.endsWith('Z') ? session.created_at + 'Z' : session.created_at).toLocaleTimeString()}
                       </p>
                    </td>
                    <td className="px-6 py-4">
                       <p className="text-xs text-gray-300 font-medium mb-1">
                         {new Date(typeof session.last_activity === 'string' && !session.last_activity.endsWith('Z') ? session.last_activity + 'Z' : session.last_activity).toLocaleTimeString()}
                       </p>
                       <span className={`inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                         session.status === 'active' ? "bg-green-500/10 text-green-400" : "bg-gray-500/10 text-gray-500"
                       }`}>
                          {session.status}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="rounded-lg p-2 text-gray-500 hover:bg-cyan-500/20 hover:text-cyan-400 transition-all">
                          <ExternalLink size={16} />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Slideover */}
      <SessionDetailPanel 
        session={selectedSession} 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
      />
    </div>
  );
}
