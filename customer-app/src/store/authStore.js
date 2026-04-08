import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

const extractErrorMessage = (error, defaultMsg) => {
  if (!error?.response?.data) return defaultMsg;
  const { data } = error.response;
  if (data.errors && Array.isArray(data.errors)) {
    // Clean up Joi quotes: "\"email\" is required" -> "email is required"
    return data.errors.map(err => err.replace(/"/g, '')).join('\n');
  }
  return (data.error || data.message || defaultMsg).replace(/"/g, '');
};

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false, 
  isRestoring: true, // For app initialization
  isSignout: false,
  error: null,
  clearError: () => set({ error: null }),

  restoreToken: async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (userToken) {
        apiClient.defaults.headers.Authorization = `Bearer ${userToken}`;
        const response = await apiClient.get('/users/profile');
        set({ user: response.data.user, token: userToken, isRestoring: false });
      } else {
        set({ isRestoring: false });
      }
    } catch (e) {
      console.warn('Failed to restore token', e);
      set({ isRestoring: false, token: null, user: null });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { token } = response.data;
      await AsyncStorage.setItem('userToken', token);
      
      apiClient.defaults.headers.Authorization = `Bearer ${token}`;
      const profileRes = await apiClient.get('/users/profile');
      
      set({ user: profileRes.data.user, token, isSignout: false, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: extractErrorMessage(error, 'Login failed')
      });
      throw error;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const payload = {
        fullName: userData.name,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
      };

      await apiClient.post('/auth/register', payload);
      const loginRes = await apiClient.post('/auth/login', { email: payload.email, password: payload.password });
      const { token } = loginRes.data;
      await AsyncStorage.setItem('userToken', token);

      apiClient.defaults.headers.Authorization = `Bearer ${token}`;
      const profileRes = await apiClient.get('/users/profile');

      set({ user: profileRes.data.user, token, isSignout: false, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: extractErrorMessage(error, 'Registration failed')
      });
      throw error;
    }
  },

  signOut: async () => {
    await AsyncStorage.removeItem('userToken');
    set({ isSignout: true, user: null, token: null });
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      set({ isLoading: false });
      return response.data.otp; // Return the dev OTP out
    } catch (error) {
      set({ isLoading: false, error: extractErrorMessage(error, 'Failed to request reset') });
      throw error;
    }
  },

  resetPassword: async (email, otp, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post('/auth/reset-password', { email, otp, newPassword });
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: extractErrorMessage(error, 'Password reset failed') });
      throw error;
    }
  },
}));
