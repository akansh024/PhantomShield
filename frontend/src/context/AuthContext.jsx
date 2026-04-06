import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const authApi = axios.create({
  baseURL: `${API_BASE}/api/auth`,
  withCredentials: true,
});

function toMessage(error, fallback) {
  return error?.response?.data?.detail || fallback;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function bootstrap() {
      try {
        const response = await authApi.get('/me');
        if (response.data?.user) {
          setUser(response.data.user);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  const signup = async (name, email, password) => {
    setError(null);
    try {
      await authApi.post('/signup', { name, email, password });
      return { success: true };
    } catch (err) {
      const message = toMessage(err, 'Signup failed');
      setError(message);
      return { success: false, error: message };
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await authApi.post('/login', { email, password });
      if (response.data?.user) {
        setUser(response.data.user);
        return { success: true };
      }
      const message = 'Login failed';
      setError(message);
      return { success: false, error: message };
    } catch (err) {
      const message = toMessage(err, 'Login failed');
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await authApi.post('/logout', {});
    } catch {
      // Keep UI responsive even when backend logout fails.
    } finally {
      setUser(null);
      setError(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      signup,
      login,
      logout,
      isAuthenticated: Boolean(user),
    }),
    [user, loading, error],
  );

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
