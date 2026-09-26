import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import type { User } from '../types';

interface AuthValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem('routeflow_token'));
  const [user, setUser] = useState<User | null>(() => {
    const value = localStorage.getItem('routeflow_user');
    return value ? JSON.parse(value) as User : null;
  });
  const [loading, setLoading] = useState(Boolean(token));

  const saveSession = (nextToken: string, nextUser: User) => {
    localStorage.setItem('routeflow_token', nextToken);
    localStorage.setItem('routeflow_user', JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem('routeflow_token');
    localStorage.removeItem('routeflow_user');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const unauthorized = () => logout();
    window.addEventListener('routeflow:unauthorized', unauthorized);
    return () => window.removeEventListener('routeflow:unauthorized', unauthorized);
  }, []);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.get<{ user: User }>('/auth/me')
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem('routeflow_user', JSON.stringify(data.user));
      })
      .catch(logout)
      .finally(() => setLoading(false));
  }, [token]);

  const value = useMemo<AuthValue>(() => ({
    user,
    token,
    loading,
    login: async (email, password) => {
      const { data } = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
      saveSession(data.token, data.user);
    },
    register: async (details) => {
      const { data } = await api.post<{ token: string; user: User }>('/auth/register', details);
      saveSession(data.token, data.user);
    },
    logout,
  }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
