import { normalizeEvent, normalizeSession, normalizeSummary } from "../contracts/adminContracts";
import { createApiClient, requestWithRetry, toApiError } from "./httpClient";

const adminClient = createApiClient("/api/admin", { timeout: 30000 });

adminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function request(method, path, { params, data } = {}) {
  const isLoginRequest = method === "POST" && path === "login";
  return requestWithRetry(
    adminClient,
    {
      method,
      url: path,
      params,
      data,
    },
    {
      retries: isLoginRequest ? 2 : 1,
      retryDelayMs: isLoginRequest ? 1500 : 1000,
    },
  );
}

export const adminApi = {
  getSummary: async () => normalizeSummary(await request("GET", "summary")),

  getSessions: async (params = {}) => {
    const data = await request("GET", "sessions", { params });
    return Array.isArray(data) ? data.map(normalizeSession) : [];
  },

  getSessionDetail: async (sessionId) =>
    normalizeSession(await request("GET", `sessions/${encodeURIComponent(sessionId)}`)),

  getSessionEvents: async (sessionId, params = {}) => {
    const data = await request("GET", `sessions/${encodeURIComponent(sessionId)}/events`, { params });
    return Array.isArray(data) ? data.map(normalizeEvent) : [];
  },

  getSessionsTrend: async () => {
    return await request("GET", "analytics/sessions-over-time");
  },

  getProductAnalytics: async (metric = "view", limit = 6) => {
    return await request("GET", "analytics/products", { params: { metric, limit } });
  },

  login: async (operatorId, passcode) => {
    const data = await request("POST", "login", {
      data: { operator_id: operatorId, passcode },
    });
    if (data.access_token) {
      localStorage.setItem("admin_token", data.access_token);
      localStorage.setItem("admin_clearance", "verified");
      if (data.operator_name) {
        localStorage.setItem("admin_name", data.operator_name);
      }
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_clearance");
    localStorage.removeItem("admin_name");
    window.location.href = "/";
  },
};

export { toApiError };
