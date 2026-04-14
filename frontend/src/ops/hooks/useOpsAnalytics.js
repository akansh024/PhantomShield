import { useCallback, useEffect, useState } from "react";

import { adminApi } from "../api/adminApi";
import { dashboardApi } from "../api/dashboardApi";

const RISK_BUCKETS = [
  { label: "0.0-0.2", min: 0.0, max: 0.2 },
  { label: "0.2-0.4", min: 0.2, max: 0.4 },
  { label: "0.4-0.6", min: 0.4, max: 0.6 },
  { label: "0.6-0.8", min: 0.6, max: 0.8 },
  { label: "0.8-1.0", min: 0.8, max: 1.0000001 },
];

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function unwrapArray(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.items)) return raw.items;
  return [];
}

function parseModeDistribution(distribution = {}) {
  const real = toNumber(distribution.REAL || distribution.real || 0);
  const decoy = toNumber(distribution.DECOY || distribution.decoy || 0);
  return [real, decoy];
}

function parseRiskDistribution(distribution = {}) {
  const labels = RISK_BUCKETS.map((bucket) => bucket.label);
  const values = labels.map((label) => toNumber(distribution[label] || 0));
  return { labels, values };
}

function parseTopProducts(raw) {
  return unwrapArray(raw)
    .map((item) => ({
      product_id: String(item.product_id || ""),
      product_name: String(item.product_name || "Unknown"),
      count: toNumber(item.count || 0),
    }))
    .slice(0, 6);
}

function parseTrend(data = []) {
  return {
    labels: data.map(p => {
      if (p.time) return p.time;
      if (p.bucket) {
        const d = new Date(p.bucket);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return p.label || "";
    }),
    values: data.map(p => p.active_sessions ?? p.count ?? 0)
  };
}

function parseActions(actions = []) {
  return actions
    .map((item) => ({
      action: String(item.action || ""),
      label: String(item.label || String(item.action || "unknown").replace(/_/g, " ")),
      category: String(item.category || "Browsing"),
      description: String(item.description || "Operational event captured by telemetry."),
      count: toNumber(item.count || 0),
      suspicious: Boolean(item.suspicious),
    }))
    .filter((item) => item.count > 0);
}

// Safe wrapper: resolve to fallback value on error instead of rejecting
async function safe(promise, fallback) {
  try {
    return await promise;
  } catch (err) {
    console.warn("Analytics fetch failed:", err?.message || err);
    return fallback;
  }
}

export function useOpsAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [source, setSource] = useState("loading");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [chartData, setChartData] = useState({
    mode: { labels: ["REAL", "DECOY"], values: [0, 0] },
    risk: { labels: RISK_BUCKETS.map((bucket) => bucket.label), values: [0, 0, 0, 0, 0] },
    trend: { labels: [], values: [] },
    actions: [],
    actionCategories: [],
    forensicWindowMinutes: 0,
    forensicTotalEvents: 0,
    products: { viewed: [], carted: [], wishlisted: [], ordered: [] },
    flags: { modeHasData: false, riskHasData: false, trendHasData: false, actionHasData: false },
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    // Use safe() to make each call independent — one failure won't crash everything
    const [summary, trendData, forensicSummary, topViewed, topCarted] = await Promise.all([
      safe(adminApi.getSummary(), {}),
      safe(dashboardApi.getSessionTrends(), []),
      safe(dashboardApi.getForensicSummary(), { common_actions: [] }),
      safe(adminApi.getProductAnalytics("view"), []),
      safe(adminApi.getProductAnalytics("cart"), []),
    ]);

    const modeValues = parseModeDistribution(summary.mode_distribution);
    const risk = parseRiskDistribution(summary.risk_distribution);
    const trend = parseTrend(trendData);
    
    const viewed = parseTopProducts(topViewed);
    const carted = parseTopProducts(topCarted);

    const actions = parseActions(forensicSummary?.common_actions || []);
    const actionCategories = Array.isArray(forensicSummary?.category_breakdown)
      ? forensicSummary.category_breakdown.map((c) => ({
          category: String(c.category || "Browsing"),
          description: String(c.description || ""),
          count: toNumber(c.count || 0),
        }))
      : [];

    setChartData({
      mode: { labels: ["REAL", "DECOY"], values: modeValues },
      risk,
      trend,
      actions,
      actionCategories,
      forensicWindowMinutes: toNumber(forensicSummary?.window_minutes || 0),
      forensicTotalEvents: toNumber(forensicSummary?.total_events || 0),
      products: { viewed, carted, wishlisted: [], ordered: [] },
      flags: {
        modeHasData: modeValues.some(v => v > 0),
        riskHasData: risk.values.some(v => v > 0),
        trendHasData: trend.values.length > 0 && trend.values.some(v => v > 0),
        actionHasData: actions.length > 0,
      },
    });
    
    setSource("live");
    setLastUpdated(new Date().toISOString());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    loading,
    error,
    source,
    lastUpdated,
    chartData,
    refresh,
  };
}
