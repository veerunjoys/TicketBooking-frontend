import React, { createContext, useState, useEffect } from 'react';
import API from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleExpiredSession = () => {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
    };

    const handleRefreshed = (e) => {
      setToken(e.detail.token);
      if (e.detail.user) {
        setUser(e.detail.user);
      }
    };

    window.addEventListener('auth:expired', handleExpiredSession);
    window.addEventListener('auth:refreshed', handleRefreshed);
    return () => {
      window.removeEventListener('auth:expired', handleExpiredSession);
      window.removeEventListener('auth:refreshed', handleRefreshed);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await API.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      
      setUser(user);
      setToken(token);
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check credentials.',
      };
    }
  };

  const signup = async (name, email, password, role = 'user') => {
    try {
      await API.post('/auth/signup', { name, email, password, role });
      return { success: true, message: 'Account created successfully. Please sign in.' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Signup failed. Please try again.',
      };
    }
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (error) {
      // Ignore logout API errors and clear client state
    }

    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
