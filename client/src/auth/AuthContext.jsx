import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setClientToken } from '../api/client';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync token to api client
  useEffect(() => {
    setClientToken(token);
  }, [token]);

  const login = useCallback((newToken, newUser) => {
    setUser(newUser);
    setToken(newToken);
    if (newUser && newUser.isImpersonating) {
      sessionStorage.setItem("impersonationActive", "true");
    } else {
      sessionStorage.setItem("impersonationActive", "false");
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.postJson('/auth/logout', {});
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      setUser(null);
      setToken(null);
      sessionStorage.removeItem("impersonationActive");
    }
  }, []);

  // Check session status on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await api.postJson('/auth/refresh', {});
        login(res.token, res.user);
      } catch (err) {
        console.log('No active session found on load.');
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, [login]);

  // Sync with events from api client
  useEffect(() => {
    const handleRefresh = (e) => {
      const { token: newToken, user: newUser } = e.detail;
      setUser(newUser);
      setToken(newToken);
      if (newUser && newUser.isImpersonating) {
        sessionStorage.setItem("impersonationActive", "true");
      } else {
        sessionStorage.setItem("impersonationActive", "false");
      }
    };

    const handleExpired = () => {
      setUser(null);
      setToken(null);
      sessionStorage.removeItem("impersonationActive");
    };

    window.addEventListener('auth:refresh', handleRefresh);
    window.addEventListener('auth:expired', handleExpired);

    return () => {
      window.removeEventListener('auth:refresh', handleRefresh);
      window.removeEventListener('auth:expired', handleExpired);
    };
  }, []);

  // Periodic token refresh (every 10 minutes)
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.postJson('/auth/refresh', {});
        login(res.token, res.user);
      } catch (err) {
        console.error('Background refresh failed', err);
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token, login]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout
    }),
    [user, token, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

