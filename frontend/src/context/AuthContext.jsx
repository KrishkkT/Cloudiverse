import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState(null);

  useEffect(() => {
    const setFp = async () => {
      const fp = await FingerprintJS.load();
      const { visitorId } = await fp.get();
      setDeviceId(visitorId);
    };
    setFp();
  }, []);

  // Set default axios header
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      console.log("[AUTH] Checking for existing session...");
      const token = localStorage.getItem('token');
      if (token) {
        try {
          console.log("[AUTH] Token found, verifying with server...");
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/profile`);
          console.log("[AUTH] Session verified:", res.data.email);
          setUser(res.data);
        } catch (error) {
          console.error("[AUTH] Verification failed:", error.response?.data?.message || error.message);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
        }
      } else {
        console.log("[AUTH] No token found in localStorage.");
        setUser(null);
      }
      setLoading(false);
      console.log("[AUTH] Initial loading finished.");
    };

    checkAuth();
  }, []);

  // Idle Timeout Logic (24 hours)
  useEffect(() => {
    let idleTimer;
    const IDLE_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

    const resetTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (user) {
        idleTimer = setTimeout(() => {
          console.log('User idle for 24 hours. Logging out...');
          logout();
        }, IDLE_TIMEOUT);
      }
    };

    // Events to track activity
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchmove', 'click'];

    // Attach listeners
    if (user) {
      resetTimer(); // Start timer on mount/login
      events.forEach(event => window.addEventListener(event, resetTimer));
    }

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user]);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
        email,
        password,
        device_id: deviceId
      });
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      setUser(res.data.user);
      return { success: true };
    } catch (error) {
      console.error("Login failed:", error);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (name, email, password, company) => {
    try {
      const payload = { name, email, password, company, device_id: deviceId };
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/register`, payload);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      return { success: true, user };
    } catch (error) {
      console.error("Registration failed:", error);
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const updateProfile = async (userData) => {
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/auth/profile`, userData);
      setUser(prev => ({ ...prev, ...res.data }));
      return { success: true, user: res.data };
    } catch (error) {
      console.error("Profile update failed:", error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update profile'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    window.location.href = '/login';
  };

  const loginWithGoogle = async (credential) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/google`, {
        token: credential,
        device_id: deviceId
      });
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      setUser(res.data.user);
      return { success: true };
    } catch (error) {
      console.error("Google Login failed:", error);
      return {
        success: false,
        error: error.response?.data?.message || 'Google Login failed'
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    signup: register, // Renamed for consistency with UI usage
    logout,
    updateProfile,
    loginWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;