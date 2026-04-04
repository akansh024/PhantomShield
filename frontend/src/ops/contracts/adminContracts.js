/**
 * PhantomShield Ops Dashboard - Phase 1 data contracts.
 *
 * These are JS contracts (via JSDoc + normalizers) so the dashboard can
 * safely consume API responses even when backend endpoints are incrementally
 * implemented.
 */

/**
 * @typedef {Object} DashboardSummary
 * @property {number} total_sessions
 * @property {number} active_sessions
 * @property {number} real_sessions
 * @property {number} decoy_sessions
 * @property {number} suspicious_sessions
 * @property {number} total_events
 * @property {number} total_cart_actions
 * @property {number} total_wishlist_actions
 * @property {number} total_orders
 * @property {number} average_risk_score
 */

/**
 * @typedef {Object} SessionRecord
 * @property {string} session_id
 * @property {string|null} user_id
 * @property {"REAL"|"DECOY"} routing_state
 * @property {number} risk_score
 * @property {string} created_at
 * @property {string} last_activity
 * @property {"active"|"idle"|"expired"} status
 * @property {number} action_count
 */

/**
 * @typedef {Object} ForensicEvent
 * @property {string} session_id
 * @property {string|null} user_id
 * @property {string} action
 * @property {string} route
 * @property {Object} payload
 * @property {string} timestamp
 * @property {"REAL"|"DECOY"} mode
 */

export const SUMMARY_DEFAULTS = Object.freeze({
  total_sessions: 0,
  active_sessions: 0,
  real_sessions: 0,
  decoy_sessions: 0,
  suspicious_sessions: 0,
  total_events: 0,
  total_cart_actions: 0,
  total_wishlist_actions: 0,
  total_orders: 0,
  average_risk_score: 0,
});

export function normalizeSummary(raw = {}) {
  return {
    ...SUMMARY_DEFAULTS,
    ...raw,
    average_risk_score: Number(raw.average_risk_score ?? SUMMARY_DEFAULTS.average_risk_score),
  };
}

export function normalizeSession(raw = {}) {
  const mode = String(raw.routing_state || "REAL").toUpperCase();
  return {
    session_id: String(raw.session_id || ""),
    user_id: raw.user_id ?? null,
    routing_state: mode === "DECOY" ? "DECOY" : "REAL",
    risk_score: Number(raw.risk_score ?? 0),
    created_at: String(raw.created_at || ""),
    last_activity: String(raw.last_activity || ""),
    status: raw.status || "active",
    action_count: Number(raw.action_count ?? 0),
  };
}

export function normalizeEvent(raw = {}) {
  const mode = String(raw.mode || "REAL").toUpperCase();
  return {
    session_id: String(raw.session_id || ""),
    user_id: raw.user_id ?? null,
    action: String(raw.action || ""),
    route: String(raw.route || ""),
    payload: raw.payload || {},
    timestamp: String(raw.timestamp || ""),
    mode: mode === "DECOY" ? "DECOY" : "REAL",
  };
}
