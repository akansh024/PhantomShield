import { Radar, Route, User, ArrowUpDown, ExternalLink, Mail } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { dashboardApi, toApiError } from "../api/dashboardApi";
import { adminApi } from "../api/adminApi";
import ChartCard from "../components/ChartCard";
import { LiveSessionGraph } from "../components/charts/OpsCharts";
import SummaryCard from "../components/SummaryCard";
import ModeBadge from "../components/ModeBadge";
import RiskBadge from "../components/RiskBadge";
import LoadingSkeleton from "../components/LoadingSkeleton";
import AttackInsightsPanel from "../components/AttackInsightsPanel";
import SessionDetailPanel from "../components/SessionDetailPanel";
import EmptyState from "../components/EmptyState";

export default function OpsOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // Data states
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [attacks, setAttacks] = useState(null);
  const [sessions, setSessions] = useState([]);

  // Detail panel state
  const [selectedSession, setSelectedSession] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Auto layout refresh hook
  const fetchDashboardData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [overviewData, trendData, attackData, sessionsData] = await Promise.all([
        dashboardApi.getOverview(),
        dashboardApi.getSessionTrends(),
        dashboardApi.getAttacks(),
        adminApi.getSessions({ limit: 10 }), // getting top 10 sessions for rapid view
      ]);
      setOverview(overviewData);
      setTrends(trendData || []);
      setAttacks(attackData);
      setSessions(sessionsData);
      setLastUpdated(new Date().toISOString());
      setError("");
    } catch (err) {
      if (isInitial) setError(toApiError(err, "Dashboard APIs are unreachable."));
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(true);
    // Polling every 10 seconds for real-time requirement
    const timer = setInterval(() => {
      fetchDashboardData(false);
    }, 10000);
    return () => clearInterval(timer);
  }, [fetchDashboardData]);

  const handleRowClick = (session) => {
    localStorage.setItem("ops_focus_session", JSON.stringify(session));
    window.dispatchEvent(new Event("ops:focus-session"));
    setSelectedSession(session);
    setIsPanelOpen(true);
  };

  const trendLabels = trends?.map((t) => t.time) || [];
  const trendValues = trends?.map((t) => t.active_sessions) || [];

  return (
    <div className="space-y-6">
      {/* 1. Navbar / Page Header (TopBar provides actual Navbar, this is Dashboard Header) */}
      <header className="rounded-2xl border border-cyan-500/20 bg-[#0e1426] p-6 shadow-lg shadow-cyan-500/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="mt-1 rounded-xl bg-cyan-500/20 p-3 text-cyan-300 ring-1 ring-cyan-500/30">
              <Radar size={24} className="animate-pulse" />
            </span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                PhantomShield Command Center
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Live behavioral intelligence and automated decoy telemetry.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             {lastUpdated && (
              <span className="text-[10px] font-medium uppercase tracking-widest text-cyan-500/60">
                Last Refresh: {new Date(lastUpdated).toLocaleTimeString()}
              </span>
             )}
             <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" title="System Live"></span>
             </div>
          </div>
        </div>
      </header>

      {error ? (
         <EmptyState title="System Sync issue" description={error} />
      ) : loading || !overview ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
           {Array(5).fill(0).map((_, i) => <LoadingSkeleton key={i} className="h-[100px]" />)}
        </div>
      ) : (
        <>
          {/* 2. Overview Cards */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCard label="Active Sessions" value={overview.active_sessions} hint={`Total: ${overview.total_sessions}`} icon={Route} tone="trusted" />
            <SummaryCard label="Suspicious Sessions" value={overview.suspicious_sessions} hint="Over 60% risk score" tone="suspicious" />
            <SummaryCard label="Total Orders" value={overview.total_orders} hint="Confirmed Checkouts" tone="neutral" />
            <SummaryCard label="Cart Items" value={overview.total_cart_items} hint="Live active carts" tone="neutral" />
            <SummaryCard label="Wishlist Items" value={overview.total_wishlist_items} hint="Live saved interests" tone="neutral" />
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* 3. Graph Section */}
            <div className="xl:col-span-2">
               <ChartCard
                 title="Active Sessions Over Time"
                 subtitle="Live tracking of connected endpoints"
                 loading={loading}
                 hasData={trendValues.length > 0}
                 emptyDescription="Waiting for traffic..."
               >
                 <LiveSessionGraph labels={trendLabels} values={trendValues} />
               </ChartCard>
            </div>

            {/* 6. Attack Insights Panel */}
            <div className="xl:col-span-1 border-t-2 border-red-500/50 rounded-2xl bg-black/20">
               <AttackInsightsPanel attacks={attacks} />
            </div>
          </div>

          {/* 4. Session Table */}
          <div className="rounded-2xl border border-white/5 bg-[#0e1426] overflow-hidden shadow-xl">
             <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white">Live Operations Target Matrix</h3>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                     <tr className="border-b border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
                       <th className="px-6 py-4">Context</th>
                       <th className="px-6 py-4">State</th>
                       <th className="px-6 py-4 text-center">Threat</th>
                       <th className="px-6 py-4 flex items-center gap-1">Last Update <ArrowUpDown size={12} /></th>
                       <th className="px-6 py-4 text-right">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {sessions.length === 0 ? (
                         <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">No live sessions detected.</td></tr>
                      ) : sessions.map(session => (
                         <tr key={session.session_id} onClick={() => handleRowClick(session)} className="group hover:bg-cyan-500/5 transition-all cursor-pointer border-l-2 border-transparent hover:border-cyan-500/50">
                            <td className="px-6 py-3">
                               <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 group-hover:text-cyan-400"><User size={14} /></div>
                                  <div className="min-w-0">
                                     <p className="text-sm font-semibold text-white truncate max-w-[150px]">
                                       {session.user_name || (session.user_email ? session.user_email.split("@")[0] : "Guest")}
                                     </p>
                                     <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                       <Mail size={10} />
                                       {session.user_email || "Not signed in"}
                                     </p>
                                     <p className="text-[9px] font-mono text-cyan-300">{session.session_id}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-3"><ModeBadge mode={session.routing_state} /></td>
                            <td className="px-6 py-3 text-center"><RiskBadge score={session.risk_score} size="sm" /></td>
                            <td className="px-6 py-3 text-xs text-gray-400">
                               <p className="font-medium text-gray-300">{new Date(typeof session.last_activity === 'string' && !session.last_activity.endsWith('Z') ? session.last_activity + 'Z' : session.last_activity).toLocaleTimeString()}</p>
                               <p className="text-[9px] uppercase mt-0.5">{session.status}</p>
                            </td>
                            <td className="px-6 py-3 text-right">
                               <button className="rounded-lg p-2 text-gray-500 hover:text-cyan-400"><ExternalLink size={16} /></button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </>
      )}

      {/* 5. Session Detail Panel */}
      <SessionDetailPanel session={selectedSession} isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </div>
  );
}
