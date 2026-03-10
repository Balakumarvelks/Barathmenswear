import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authService } from '../services/api';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const fetchCartCount = useCallback(async () => {
    try {
      const response = await api.get('/cart');
      const items = response.data.cart?.items || [];
      const count = items.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authService.getMe();
        setUser(response.data.data);
        setIsAuthenticated(true);
        fetchCartCount();
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const response = await authService.login({ email, password });
    if (response.data.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      setIsAuthenticated(true);
    }
    return response.data;
  };

  const adminLogin = async (email, password) => {
    const response = await authService.adminLogin({ email, password });
    if (response.data.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      setIsAuthenticated(true);
    }
    return response.data;
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    if (response.data.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      setIsAuthenticated(true);
    }
    return response.data;
  };

  const googleLogin = async (credential) => {
    const response = await authService.googleAuth({ credential });
    if (response.data.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      setIsAuthenticated(true);
    }
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setCartCount(0);
  };

  const updateProfile = async (userData) => {
    const response = await authService.updateProfile(userData);
    if (response.data.success) {
      setUser(response.data.data);
      localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    return response.data;
  };

  const updatePassword = async (passwords) => {
    const response = await authService.updatePassword(passwords);
    return response.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        adminLogin,
        register,
        googleLogin,
        logout,
        updateProfile,
        updatePassword,
        checkAuth,
        cartCount,
        fetchCartCount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
