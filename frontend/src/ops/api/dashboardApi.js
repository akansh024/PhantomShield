import { createApiClient, requestWithRetry, toApiError } from "./httpClient";

const dashboardClient = createApiClient("/api/dashboard", { timeout: 30000 });

dashboardClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function request(method, path, { params, data } = {}) {
  return requestWithRetry(
    dashboardClient,
    {
      method,
      url: path,
      params,
      data,
    },
    {
      retries: 1,
      retryDelayMs: 1000,
    },
  );
}

export const dashboardApi = {
  getOverview: async () => await request("GET", "overview"),
  getSessionTrends: async () => await request("GET", "session-trends"),
  getForensicSummary: async () => await request("GET", "forensic-summary"),
  getAttacks: async () => await request("GET", "attacks"),
  getSessionDetails: async (sessionId) => await request("GET", `session/${encodeURIComponent(sessionId)}`),
};

export { toApiError };
