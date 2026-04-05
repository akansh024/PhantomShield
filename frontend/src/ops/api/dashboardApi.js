import axios from "axios";

// Assume it shares the same base URL structure and token as adminApi
const dashboardClient = axios.create({
  baseURL: "/api/dashboard/",
  withCredentials: true,
  timeout: 12000,
});

dashboardClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function request(method, path, { params, data } = {}) {
  const response = await dashboardClient.request({
    method,
    url: path,
    params,
    data,
  });
  return response.data;
}

export const dashboardApi = {
  getOverview: async () => await request("GET", "overview"),
  getSessionTrends: async () => await request("GET", "session-trends"),
  getForensicSummary: async () => await request("GET", "forensic-summary"),
  getAttacks: async () => await request("GET", "attacks"),
  getSessionDetails: async (sessionId) => await request("GET", `session/${encodeURIComponent(sessionId)}`),
};

export function toApiError(error, fallback = "Request failed") {
  return error?.response?.data?.detail || error?.message || fallback;
}
