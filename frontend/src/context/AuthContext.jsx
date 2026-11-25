/**
 * context/AuthContext.jsx - Authentication state provider for CONVO
 * Manages JWT token, current user, login/register/logout, and persistence in localStorage.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on app mount
  useEffect(() => {
    const savedToken = localStorage.getItem('convo_token');
    const savedUser = localStorage.getItem('convo_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const data = await api.login(credentials);
    if (data.token) {
      localStorage.setItem('convo_token', data.token);
      localStorage.setItem('convo_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const register = async (userData) => {
    const data = await api.register(userData);
    if (data.token) {
      localStorage.setItem('convo_token', data.token);
      localStorage.setItem('convo_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('convo_token');
    localStorage.removeItem('convo_user');
    setToken(null);
    setUser(null);
  };

  // Clear session when the API reports an expired/invalid token.
  // ProtectedRoute picks up isAuthenticated === false and redirects to /login.
  useEffect(() => {
    const onExpire = () => {
      logout();
    };
    window.addEventListener('convo-session-expired', onExpire);
    return () => window.removeEventListener('convo-session-expired', onExpire);
  }, [logout]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
