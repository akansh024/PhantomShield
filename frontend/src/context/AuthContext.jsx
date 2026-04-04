import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create context
const AuthContext = createContext(null);

// API Base
const API_BASE = 'http://localhost:8000/api/auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize: check if user is already logged in (via /me)
  useEffect(() => {
    async function initAuth() {
      try {
        const res = await axios.get(`${API_BASE}/me`, { withCredentials: true });
        if (res.data.user) {
          setUser(res.data.user);
        }
      } catch (err) {
        console.error("Auth initialization failed:", err);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  // Signup
  const signup = async (name, email, password) => {
    setError(null);
    try {
      await axios.post(`${API_BASE}/signup`, { name, email, password }, { withCredentials: true });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.detail || "Signup failed";
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // Login
  const login = async (email, password) => {
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/login`, { email, password }, { withCredentials: true });
      if (res.data.user) {
        setUser(res.data.user);
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Login failed";
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await axios.post(`${API_BASE}/logout`, {}, { withCredentials: true });
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const value = {
    user,
    loading,
    error,
    signup,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
