import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Validate token and load user profile on startup
  useEffect(() => {
    const bootstrapAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // Try loading admin profile first
          const profile = await authService.getCurrentUser();
          setUser(profile);
          setToken(storedToken);
        } catch (error) {
          // If admin fails, try loading patient profile
          try {
            const profile = await authService.getCurrentPatient();
            setUser(profile);
            setToken(storedToken);
          } catch (patientError) {
            console.error("Failed to bootstrap user profile:", patientError);
            authService.logout();
            setUser(null);
            setToken(null);
          }
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    };

    bootstrapAuth();
  }, []);

  const login = async (username, password, role = 'admin') => {
    setLoading(true);
    try {
      let profile;
      if (role === 'admin') {
        const response = await authService.login(username, password);
        setToken(response.access_token);
        profile = await authService.getCurrentUser();
      } else {
        const response = await authService.patientLogin(username, password);
        setToken(response.access_token);
        profile = await authService.getCurrentPatient();
      }
      setUser(profile);
      setLoading(false);
      return profile;
    } catch (error) {
      setLoading(false);
      authService.logout();
      setUser(null);
      setToken(null);
      throw error;
    }
  };

  const signup = async (payload) => {
    setLoading(true);
    try {
      const profile = await authService.patientSignup(payload);
      setLoading(false);
      return profile;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const updateProfile = async (payload) => {
    try {
      const updatedProfile = await authService.updatePatientProfile(payload);
      setUser(updatedProfile);
      return updatedProfile;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    isAdmin: user ? !!user.is_admin : false,
    login,
    signup,
    updateProfile,
    logout,
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
