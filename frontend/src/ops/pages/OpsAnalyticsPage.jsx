import { RefreshCw, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

import ChartCard from "../components/ChartCard";
import {
  ActionDistributionChart,
  LiveSessionGraph,
  ModeDistributionChart,
  RiskDistributionChart,
} from "../components/charts/OpsCharts";

import SectionCard from "../components/SectionCard";
import { useOpsAnalytics } from "../hooks/useOpsAnalytics";

export default function OpsAnalyticsPage() {
  const { loading, error, source, lastUpdated, chartData, refresh } = useOpsAnalytics();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = setInterval(() => {
      refresh();
    }, 15000); // 15s polling for analytics
    return () => clearInterval(timer);
  }, [autoRefresh, refresh]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-cyan-500/20 bg-[#0e1426] p-6 shadow-lg shadow-cyan-500/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Behavior Analytics</h1>
            <p className="mt-1 text-sm text-gray-400">
              Session routing telemetry, risk distribution, and forensic activity heatmaps.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                source === "fallback"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}
            >
              {source === "fallback" ? "Dev Fallback" : "Live Feed"}
            </span>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10 disabled:opacity-50"
              disabled={loading || refreshing}
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              Sync
            </button>
            <button
              type="button"
              onClick={() => setAutoRefresh((prev) => !prev)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                autoRefresh
                  ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                  : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              Auto: {autoRefresh ? "ON" : "OFF"}
            </button>
          </div>
        </div>
        {lastUpdated && (
           <p className="mt-4 text-[10px] font-medium uppercase tracking-widest text-gray-500">
             Operational Sync: {new Date(lastUpdated).toLocaleString()}
           </p>
        )}
      </header>

      {error && source === "live" ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
           <p className="text-sm text-red-400 font-medium">Telemetry Interrupted: {error}</p>
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-6">
        <ChartCard
          title="Live Session Graph"
          subtitle="Real-time trend showing concurrent active sessions (v4 Fleet Monitoring)"
          loading={loading}
          hasData={chartData.trend.values.length > 0}
          emptyDescription="Waiting for enough data points to plot session trend..."
        >
          <LiveSessionGraph labels={chartData.trend.labels} values={chartData.trend.values} />
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard
          title="Real vs Decoy Distribution"
          subtitle="Mix of routing states across the fleet"
          loading={loading}
          hasData={chartData.flags.modeHasData}
          emptyDescription="No mode telemetry found."
        >
          <ModeDistributionChart labels={chartData.mode.labels} values={chartData.mode.values} />
        </ChartCard>

        <ChartCard
          title="Risk Level Profile"
          subtitle="Session counts distributed by calculated risk scores"
          loading={loading}
          hasData={chartData.flags.riskHasData}
          emptyDescription="Risk data pending session observation."
        >
          <RiskDistributionChart labels={chartData.risk.labels} values={chartData.risk.values} />
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard
          title="Forensic Action Streams"
          subtitle="What happened: recent live visitor actions. Why it matters: each action is grouped by business/security category and marked as normal or suspicious."
          loading={loading}
          hasData={chartData.flags.actionHasData}
          emptyDescription="No action logs recorded in this window."
        >
          <ActionDistributionChart actions={chartData.actions} />
        </ChartCard>

        <SectionCard title="Product Affinity Insights" subtitle="Highly engaged product entities.">
           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
             <div className="space-y-3">
               <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Top Viewed</h4>
               {chartData.products.viewed.slice(0, 3).map(p => (
                 <div key={p.product_id} className="flex items-center justify-between rounded-lg bg-[#121a30] p-3 border border-white/5">
                    <span className="text-xs text-gray-300 truncate mr-2">{p.product_name}</span>
                    <span className="font-mono text-xs text-cyan-400 font-bold">{p.count}</span>
                 </div>
               ))}
             </div>
             <div className="space-y-3">
               <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Top Carted</h4>
               {chartData.products.carted.slice(0, 3).map(p => (
                 <div key={p.product_id} className="flex items-center justify-between rounded-lg bg-[#121a30] p-3 border border-white/5">
                    <span className="text-xs text-gray-300 truncate mr-2">{p.product_name}</span>
                    <span className="font-mono text-xs text-cyan-400 font-bold">{p.count}</span>
                 </div>
               ))}
             </div>
           </div>
        </SectionCard>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-4">
        {/* Placeholder for more granular insight components if needed */}
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0f1322] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Forensic Action Legend</h3>
            <p className="mt-1 text-xs text-gray-400">
              Window: {chartData.forensicWindowMinutes || 0} minutes | Total events: {chartData.forensicTotalEvents || 0}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1 text-[10px] uppercase tracking-widest text-red-300">
            <ShieldAlert size={12} />
            Suspicious categories should be reviewed first
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {chartData.actionCategories.map((category) => (
            <div key={category.category} className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-xs font-semibold text-white">{category.category}</p>
              <p className="mt-1 text-[11px] text-cyan-300">{category.count} events</p>
              <p className="mt-1 text-[11px] text-gray-400">{category.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
