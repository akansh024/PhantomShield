import axios from "axios";

const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_RETRIES = 1;
const DEFAULT_RETRY_DELAY_MS = 1200;

function sanitizeApiBase(rawBase) {
  const trimmed = String(rawBase || "").trim();
  if (!trimmed) return "";

  const withoutTrailingSlash = trimmed.replace(/\/+$/, "");
  return withoutTrailingSlash.replace(/\/api$/i, "");
}

const API_BASE = sanitizeApiBase(import.meta.env.VITE_API_BASE_URL);

function normalizePrefix(prefix) {
  const clean = String(prefix || "").replace(/^\/+|\/+$/g, "");
  return `/${clean}/`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetriableError(error) {
  const status = error?.response?.status;
  if ([408, 425, 429, 500, 502, 503, 504].includes(status)) return true;
  if (error?.code === "ECONNABORTED" || error?.code === "ERR_NETWORK") return true;
  return !error?.response;
}

export function createApiClient(prefix, { timeout = DEFAULT_TIMEOUT_MS } = {}) {
  return axios.create({
    baseURL: `${API_BASE}${normalizePrefix(prefix)}`,
    withCredentials: true,
    timeout,
  });
}

export async function requestWithRetry(
  client,
  config,
  { retries = DEFAULT_RETRIES, retryDelayMs = DEFAULT_RETRY_DELAY_MS } = {},
) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await client.request(config);
      return response.data;
    } catch (error) {
      lastError = error;
      if (attempt === retries || !isRetriableError(error)) {
        throw error;
      }
      await sleep(retryDelayMs * (attempt + 1));
    }
  }
  throw lastError;
}

export function toApiError(error, fallback = "Request failed") {
  if (error?.response?.data?.detail) return error.response.data.detail;
  if (error?.code === "ECONNABORTED") return "Backend response timed out. Please retry in a few seconds.";
  if (error?.code === "ERR_NETWORK") return "Network error while reaching the API endpoint.";
  return error?.message || fallback;
}

