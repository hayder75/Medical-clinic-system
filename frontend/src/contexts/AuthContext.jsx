import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(sessionStorage.getItem('token'));

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // Try to get user data from sessionStorage first (from login)
          const storedUser = sessionStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            // Fallback to JWT decoding if no stored user
            const userData = await authService.getCurrentUser();
            setUser(userData);
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      const { token: newToken, user: userData } = response;
      
      sessionStorage.setItem('token', newToken);
      sessionStorage.setItem('user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const refreshToken = async () => {
    try {
      const response = await authService.refreshToken();
      const { token: newToken } = response;
      
      sessionStorage.setItem('token', newToken);
      setToken(newToken);
      
      return { success: true };
    } catch (error) {
      logout();
      return { success: false };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    refreshToken,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isDoctor: user?.role === 'DOCTOR',
    isNurse: user?.role === 'NURSE',
    isBillingOfficer: user?.role === 'BILLING_OFFICER',
    isPharmacyBillingOfficer: user?.role === 'PHARMACY_BILLING_OFFICER',
    isPharmacist: user?.role === 'PHARMACIST',
    isLabTechnician: user?.role === 'LAB_TECHNICIAN',
    isRadiologist: user?.role === 'RADIOLOGIST',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
