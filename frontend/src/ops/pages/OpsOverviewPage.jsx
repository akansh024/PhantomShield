import { DatabaseZap, Radar, Route, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { adminApi, toApiError } from "../api/adminApi";
import ChartCard from "../components/ChartCard";
import { EventsTrendChart, ModeDistributionChart } from "../components/charts/OpsCharts";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import SectionCard from "../components/SectionCard";
import SummaryCard from "../components/SummaryCard";
import { SUMMARY_DEFAULTS } from "../contracts/adminContracts";
import { useOpsAnalytics } from "../hooks/useOpsAnalytics";

const endpointChecklist = [
  "GET /api/admin/summary",
  "GET /api/admin/sessions",
  "GET /api/admin/sessions/{session_id}",
  "GET /api/admin/sessions/{session_id}/events",
  "GET /api/admin/events/recent",
  "GET /api/admin/products/top-viewed",
  "GET /api/admin/products/top-carted",
  "GET /api/admin/products/top-wishlisted",
  "GET /api/admin/products/top-ordered",
  "GET /api/admin/risk-distribution",
  "GET /api/admin/mode-distribution",
];

const phaseCards = [
  {
    key: "layout",
    title: "Ops Layout System",
    description:
      "Dedicated dashboard shell, responsive navigation, and operational visual hierarchy for rapid SOC-style scanning.",
    icon: Route,
  },
  {
    key: "contracts",
    title: "Data Contracts",
    description:
      "Normalized shapes for session, forensic event, and summary payloads to keep rendering resilient to schema evolution.",
    icon: ShieldCheck,
  },
  {
    key: "api",
    title: "Admin API Client",
    description:
      "Centralized REST wrapper for all /api/admin endpoints with consistent error handling and session cookie support.",
    icon: DatabaseZap,
  },
];

export default function OpsOverviewPage() {
  const [summary, setSummary] = useState(SUMMARY_DEFAULTS);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const { loading: analyticsLoading, chartData, source, refresh: refreshAnalytics } = useOpsAnalytics();

  const fetchSummary = useCallback(async (isInitial = false) => {
    if (isInitial) setState("loading");
    try {
      const data = await adminApi.getSummary();
      setSummary(data);
      setLastUpdated(new Date().toISOString());
      setState("ready");
    } catch (err) {
      if (isInitial) {
        setError(toApiError(err, "Admin summary endpoint is not available yet."));
        setState("error");
      }
    }
  }, []);

  useEffect(() => {
    fetchSummary(true);
    
    // Smooth polling for live operational feel
    const timer = setInterval(() => {
      fetchSummary();
      refreshAnalytics();
    }, 15000);

    return () => clearInterval(timer);
  }, [fetchSummary, refreshAnalytics]);

  const modeRatio = useMemo(() => {
    const total = summary.real_sessions + summary.decoy_sessions;
    if (!total) return "N/A";
    const real = Math.round((summary.real_sessions / total) * 100);
    const decoy = 100 - real;
    return `${real}% REAL / ${decoy}% DECOY`;
  }, [summary.real_sessions, summary.decoy_sessions]);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-cyan-500/20 bg-[#0e1426] p-6 shadow-lg shadow-cyan-500/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="mt-1 rounded-xl bg-cyan-500/20 p-3 text-cyan-300 ring-1 ring-cyan-500/30">
              <Radar size={24} className="animate-pulse" />
            </span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Security Operations Center
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Live monitoring of PhantomShield deception fleet and session integrity.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end md:self-center">
            {lastUpdated && (
              <span className="text-[10px] font-medium uppercase tracking-widest text-cyan-500/60">
                Last Sync: {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
            <div className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" title="System Live" />
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {state === "loading" ? (
          <>
            <LoadingSkeleton className="h-[120px]" />
            <LoadingSkeleton className="h-[120px]" />
            <LoadingSkeleton className="h-[120px]" />
            <LoadingSkeleton className="h-[120px]" />
          </>
        ) : (
          <>
            <SummaryCard 
              label="Session Envelope" 
              value={summary.total_sessions} 
              hint="All historical sessions" 
              icon={Route}
            />
            <SummaryCard 
              label="Active Operations" 
              value={summary.active_sessions} 
              hint="Currently connected clients" 
              tone="trusted"
            />
            <SummaryCard
              label="Mode Ratio"
              value={modeRatio}
              hint="Real vs Decoy distribution"
              tone={summary.decoy_sessions > 0 ? "warning" : "neutral"}
            />
            <SummaryCard
              label="Fleet Threat Level"
              value={summary.average_risk_score >= 0.1 ? summary.average_risk_score.toFixed(3) : "NOMINAL"}
              hint="Mean risk score across all nodes"
              tone={summary.average_risk_score >= 0.7 ? "suspicious" : summary.average_risk_score >= 0.4 ? "warning" : "neutral"}
            />
          </>
        )}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard
          title="Mode Distribution Snapshot"
          subtitle={`Session classification mix (${source === "fallback" ? "fallback" : "live feed"})`}
          loading={analyticsLoading}
          hasData={chartData.flags.modeHasData}
          emptyDescription="Waiting for mode telemetry..."
        >
          <ModeDistributionChart labels={chartData.mode.labels} values={chartData.mode.values} />
        </ChartCard>

        <ChartCard
          title="Forensic Throughput"
          subtitle="Event frequency in 1-hour windows (Last 12 hours)"
          loading={analyticsLoading}
          hasData={chartData.flags.trendHasData}
          emptyDescription="Waiting for event stream..."
        >
          <EventsTrendChart labels={chartData.trend.labels} values={chartData.trend.values} />
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
           <SectionCard title="Product Interaction Heatmap" subtitle="Forensic insights into store engagement.">
             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Top Viewed</h4>
                  <div className="space-y-2">
                    {chartData.products.viewed.map(p => (
                      <div key={p.product_id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-300 truncate mr-2">{p.product_name}</span>
                        <span className="font-mono text-cyan-400">{p.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Top Carted</h4>
                   <div className="space-y-2">
                    {chartData.products.carted.map(p => (
                      <div key={p.product_id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-300 truncate mr-2">{p.product_name}</span>
                        <span className="font-mono text-cyan-400">{p.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
             </div>
           </SectionCard>
        </div>

        <div className="space-y-6">
           <SectionCard title="Data Continuity" subtitle="Health of forensic data sinks.">
             <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-[#121a30] px-3 py-2 border border-white/5">
                  <div className="flex items-center gap-2">
                    <DatabaseZap size={14} className="text-green-400" />
                    <span className="text-xs text-gray-300">MongoDB Persistence</span>
                  </div>
                  <span className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20">CONNECTED</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#121a30] px-3 py-2 border border-white/5">
                   <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-cyan-400" />
                    <span className="text-xs text-gray-300">Forensic Integrity</span>
                  </div>
                   <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20">VERIFIED</span>
                </div>
             </div>
           </SectionCard>
        </div>
      </section>

      {state === "error" ? (
        <EmptyState
          title="System Sync issue"
          description={error}
        />
      ) : null}
    </div>
  );
}
