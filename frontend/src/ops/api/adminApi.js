import axios from "axios";

import {
  normalizeEvent,
  normalizeSession,
  normalizeSummary,
} from "../contracts/adminContracts";

const adminClient = axios.create({
  baseURL: "/api/admin",
  withCredentials: true,
  timeout: 12000,
});

adminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function request(method, path, { params, data } = {}) {
  const response = await adminClient.request({
    method,
    url: path,
    params,
    data,
  });
  return response.data;
}

export const adminApi = {
  getSummary: async () => normalizeSummary(await request("GET", "/summary")),
  
  getSessions: async (params = {}) => {
    const data = await request("GET", "/sessions", { params });
    return Array.isArray(data) ? data.map(normalizeSession) : [];
  },
  
  getSessionDetail: async (sessionId) =>
    normalizeSession(await request("GET", `/sessions/${encodeURIComponent(sessionId)}`)),
  
  getSessionEvents: async (sessionId, params = {}) => {
    const data = await request("GET", `/sessions/${encodeURIComponent(sessionId)}/events`, { params });
    return Array.isArray(data) ? data.map(normalizeEvent) : [];
  },
  
  getSessionsTrend: async () => {
    return await request("GET", "/analytics/sessions-over-time");
  },
  
  getProductAnalytics: async (metric = "view", limit = 6) => {
    return await request("GET", "/analytics/products", { params: { metric, limit } });
  },
  
  login: async (operatorId, passcode) => {
    const data = await request("POST", "/login", {
      data: { operator_id: operatorId, passcode },
    });
    if (data.access_token) {
      localStorage.setItem("admin_token", data.access_token);
      localStorage.setItem("admin_name", data.operator_name);
    }
    return data;
  }
};

export function toApiError(error, fallback = "Request failed") {
  return error?.response?.data?.detail || error?.message || fallback;
}
