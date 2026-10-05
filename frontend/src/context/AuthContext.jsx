import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('restaurant_auth_token') || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('restaurant_auth_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Clear authentication state and storage
  const logout = useCallback(() => {
    try {
      localStorage.removeItem('restaurant_auth_token');
      localStorage.removeItem('restaurant_auth_user');
    } catch (err) {
      console.error('Failed to clear auth from localStorage:', err);
    }
    setToken(null);
    setUser(null);
  }, []);

  // Sync token validation with backend on initial load
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const savedToken = localStorage.getItem('restaurant_auth_token');
      if (!savedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const response = await axiosClient.get('/auth/me');
        if (isMounted && response.data?.data) {
          const freshUser = response.data.data;
          setUser(freshUser);
          localStorage.setItem('restaurant_auth_user', JSON.stringify(freshUser));
        }
      } catch (err) {
        console.warn('Saved session is invalid or expired:', err.message);
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    verifySession();

    // Listen for unauthorized/expired token events from axiosClient
    const handleAuthExpired = () => {
      logout();
    };
    window.addEventListener('auth:expired', handleAuthExpired);

    return () => {
      isMounted = false;
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, [logout]);

  // Login handler
  const login = async (email, password) => {
    const response = await axiosClient.post('/auth/login', {
      email: email.trim(),
      password,
    });

    if (response.data?.success) {
      const { token: receivedToken, user: receivedUser } = response.data.data;
      setToken(receivedToken);
      setUser(receivedUser);
      localStorage.setItem('restaurant_auth_token', receivedToken);
      localStorage.setItem('restaurant_auth_user', JSON.stringify(receivedUser));
      return { success: true, user: receivedUser };
    }

    throw new Error(response.data?.error || 'Failed to log in');
  };

  // Signup handler
  const signup = async ({ name, email, password, phone, role = 'customer' }) => {
    const response = await axiosClient.post('/auth/signup', {
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone?.trim() || undefined,
      role,
    });

    if (response.data?.success) {
      const { token: receivedToken, user: receivedUser } = response.data.data;
      setToken(receivedToken);
      setUser(receivedUser);
      localStorage.setItem('restaurant_auth_token', receivedToken);
      localStorage.setItem('restaurant_auth_user', JSON.stringify(receivedUser));
      return { success: true, user: receivedUser };
    }

    throw new Error(response.data?.error || 'Failed to sign up');
  };

  // Update current user profile in state and localStorage
  const updateUserProfile = useCallback((updatedUserData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUserData };
      try {
        localStorage.setItem('restaurant_auth_user', JSON.stringify(merged));
      } catch (err) {
        console.error('Failed to update user in localStorage:', err);
      }
      return merged;
    });
  }, []);

  // Delete own account handler
  const deleteAccount = useCallback(async () => {
    if (!user?.id) throw new Error('No user is currently signed in');
    await axiosClient.delete(`/users/${user.id}`);
    logout();
  }, [user, logout]);

  const isAuthenticated = useMemo(() => Boolean(user && token), [user, token]);
  const isAdmin = useMemo(() => user?.role === 'admin', [user]);
  const isStaff = useMemo(() => user?.role === 'staff' || user?.role === 'admin', [user]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    isStaff,
    login,
    signup,
    logout,
    updateUserProfile,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
