import { useCallback, useEffect, useState } from "react";

import { adminApi } from "../api/adminApi";

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
    labels: data.map(p => p.label),
    values: data.map(p => p.count)
  };
}

export function useOpsAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [chartData, setChartData] = useState({
    mode: { labels: ["REAL", "DECOY"], values: [0, 0] },
    risk: { labels: RISK_BUCKETS.map((bucket) => bucket.label), values: [0, 0, 0, 0, 0] },
    trend: { labels: [], values: [] },
    actions: { labels: [], values: [] },
    products: { viewed: [], carted: [], wishlisted: [], ordered: [] },
    flags: { modeHasData: false, riskHasData: false, trendHasData: false, actionHasData: false },
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Consolidate: use summary for distribution data to save requests
      const [
        summary,
        trendData,
        topViewed,
        topCarted,
      ] = await Promise.all([
        adminApi.getSummary(),
        adminApi.getSessionsTrend(),
        adminApi.getProductAnalytics("view"),
        adminApi.getProductAnalytics("cart"),
      ]);

      const modeValues = parseModeDistribution(summary.mode_distribution);
      const risk = parseRiskDistribution(summary.risk_distribution);
      const trend = parseTrend(trendData);
      
      const viewed = parseTopProducts(topViewed);
      const carted = parseTopProducts(topCarted);

      setChartData({
        mode: { labels: ["REAL", "DECOY"], values: modeValues },
        risk,
        trend,
        actions: { labels: [], values: [] }, // Placeholder until events route works
        products: { viewed, carted, wishlisted: [], ordered: [] },
        flags: {
          modeHasData: modeValues.some(v => v > 0),
          riskHasData: risk.values.some(v => v > 0),
          trendHasData: trend.values.some(v => v > 0),
          actionHasData: false,
        },
      });
      setLastUpdated(new Date().toISOString());
      setError("");
    } catch (err) {
      console.error("Ops Analytics Sync Error:", err);
      setError("Fleet telemetry synchronization interrupted.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    loading,
    error,
    lastUpdated,
    chartData,
    refresh,
  };
}
