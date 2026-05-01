import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';
import { registerForPushNotificationsAsync, sendTokenToBackend } from '../utils/pushNotifications';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const handlePushTokenRegistration = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await sendTokenToBackend(token);
      }
    } catch (err) {
      console.log('Push registration failed:', err);
    }
  };

  useEffect(() => {
    const isReady = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          try {
            const profileRes = await apiClient.get('/api/users/profile');
            setUser(profileRes.data.user);
            setUserToken(token);
            handlePushTokenRegistration();
          } catch (profileErr) {
            console.log('Failed to fetch profile, invalidating token', profileErr);
            await AsyncStorage.removeItem('userToken');
            setUserToken(null);
          }
        }
      } catch (e) {
        console.log('Failed to fetch token:', e);
      } finally {
        setIsLoading(false);
      }
    };
    isReady();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await apiClient.post('/api/auth/login', { email, password });
      const { token, role } = res.data;
      if (role !== 'mechanic' && role !== 'Mechanic') {
        throw new Error('Access Denied. Only mechanics can use this app.');
      }
      await AsyncStorage.setItem('userToken', token);
      setUserToken(token);

      try {
        
        const profileRes = await apiClient.get('/api/users/profile');
        setUser(profileRes.data.user);
      } catch (profileErr) {
        
        setUser({ role });
      }

      handlePushTokenRegistration();
      return { success: true };
    } catch (error) {
      console.log('Login error:', error.response?.data || error.message);
      const apiError = error.response?.data?.error || error.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, error: apiError };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('userToken');
    setUserToken(null);
    setUser(null);
  };

  const requestPasswordReset = async (email) => {
    try {
      const res = await apiClient.post('/api/auth/forgot-password', { email });
      return { success: true, message: res.data.message, otp: res.data.otp };
    } catch (error) {
      const apiError = error.response?.data?.error || error.response?.data?.message || 'Failed to request password reset.';
      return { success: false, error: apiError };
    }
  };

  const confirmPasswordReset = async (email, otp, newPassword) => {
    try {
      await apiClient.post('/api/auth/reset-password', { email, otp, newPassword });
      return { success: true };
    } catch (error) {
      const apiError = error.response?.data?.error || error.response?.data?.message || 'Failed to reset password.';
      return { success: false, error: apiError };
    }
  };

  return (
    <AuthContext.Provider value={{ login, logout, isLoading, userToken, user, requestPasswordReset, confirmPasswordReset }}>
      {children}
    </AuthContext.Provider>
  );
};
