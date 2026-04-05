import { useCallback, useEffect, useState } from "react";
import { adminApi, toApiError } from "../api/adminApi";

export function useSessions() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    mode: "ALL", // ALL | REAL | DECOY
    risk: "ALL", // ALL | HIGH | LOW
  });

  const refresh = useCallback(async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.mode !== "ALL") params.routing_state = filters.mode;
      if (filters.risk === "HIGH") params.min_risk = 0.6;
      
      // The current backend list_sessions API handles these params.
      const data = await adminApi.getSessions(params);
      
      // Client-side search filtering (since backend search isn't fully implemented in skip/limit yet)
      let filtered = data;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        filtered = data.filter(
          (session) =>
            session.session_id.toLowerCase().includes(s) ||
            (session.user_id && session.user_id.toLowerCase().includes(s))
        );
      }
      
      setSessions(filtered);
    } catch (err) {
      setError(toApiError(err, "Unable to fetch sessions."));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    refresh();
    
    // Polling for the session table (slightly slower than summary)
    const timer = setInterval(() => {
      refresh();
    refresh(true);
    }, 10000);
    
    return () => clearInterval(timer);
  }, [refresh]);

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  return {
    loading,
    error,
    sessions,
    filters,
    updateFilters,
    refresh,
  };
}
