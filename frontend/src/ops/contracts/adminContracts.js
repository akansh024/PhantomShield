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
 * @property {string|null} user_name
 * @property {string|null} user_email
 * @property {"guest"|"authenticated"|"test"} session_type
 * @property {"production"|"test"|"local"} environment
 * @property {boolean} archived
 * @property {boolean} is_test_session
 * @property {"REAL"|"DECOY"} routing_state
 * @property {number} risk_score
 * @property {string} created_at
 * @property {string} last_activity
 * @property {string|null} authenticated_at
 * @property {string|null} signup_at
 * @property {"active"|"idle"|"expired"} status
 * @property {number} action_count
 * @property {string} identity_label
 * @property {string} state_label
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
  const sessionType = String(raw.session_type || (raw.user_id ? "authenticated" : "guest")).toLowerCase();
  const environment = String(raw.environment || "production").toLowerCase();

  return {
    session_id: String(raw.session_id || ""),
    user_id: raw.user_id ?? null,
    user_name: raw.user_name ?? null,
    user_email: raw.user_email ?? null,
    session_type: sessionType === "test" || sessionType === "authenticated" ? sessionType : "guest",
    environment: environment === "test" || environment === "local" ? environment : "production",
    archived: Boolean(raw.archived),
    is_test_session: Boolean(raw.is_test_session),
    routing_state: mode === "DECOY" ? "DECOY" : "REAL",
    risk_score: Number(raw.risk_score ?? 0),
    created_at: String(raw.created_at || ""),
    last_activity: String(raw.last_activity || ""),
    authenticated_at: raw.authenticated_at ? String(raw.authenticated_at) : null,
    signup_at: raw.signup_at ? String(raw.signup_at) : null,
    status: raw.status || "active",
    action_count: Number(raw.action_count ?? 0),
    identity_label: String(raw.identity_label || "Guest / Anonymous session"),
    state_label: String(raw.state_label || "Live"),
  };
}

export function normalizeEvent(raw = {}) {
  const mode = String(raw.mode || "REAL").toUpperCase();
  return {
    session_id: String(raw.session_id || ""),
    user_id: raw.user_id ?? null,
    action: String(raw.action || ""),
    route: raw.route == null ? "" : String(raw.route),
    payload: raw.payload || {},
    timestamp: String(raw.timestamp || ""),
    mode: mode === "DECOY" ? "DECOY" : "REAL",
  };
}
