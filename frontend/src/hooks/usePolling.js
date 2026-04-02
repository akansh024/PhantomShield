import { useState, useEffect, useCallback } from 'react';

export const usePolling = (fetchFn, interval = 5000, initialData = null) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetchFn();
      setData(response);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    fetchData(); // Initial fetch
    const pollInterval = setInterval(fetchData, interval);
    return () => clearInterval(pollInterval); // Cleanup on unmount
  }, [fetchData, interval]);

  return { data, loading, error, refetch: fetchData };
};
