import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export const DEMO_USERS = {
  admin: { email: 'admin@brightloop.com', password: 'Admin@12345!', role: 'Admin (Full Access)' },
  staff: { email: 'staff@brightloop.com', password: 'Staff@12345!', role: 'Staff (Operations)' },
  customer: { email: 'apex@shop.com', password: 'Customer@12345!', role: 'Customer (Portal)' },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (err) {
          console.error('Failed to restore session:', err);
          logout();
        }
      } else {
        // Auto-login as admin by default for smooth initial hackathon demo if no session
        try {
          const res = await api.post('/auth/login', {
            email: DEMO_USERS.admin.email,
            password: DEMO_USERS.admin.password
          });
          localStorage.setItem('token', res.data.token);
          setToken(res.data.token);
          setUser(res.data.user);
        } catch (e) {
          // ignore
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const quickSwitchRole = async (targetRole) => {
    const creds = DEMO_USERS[targetRole];
    if (creds) {
      setLoading(true);
      try {
        const res = await api.post('/auth/login', { email: creds.email, password: creds.password });
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
      } catch (err) {
        console.error('Quick switch failed', err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, quickSwitchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
