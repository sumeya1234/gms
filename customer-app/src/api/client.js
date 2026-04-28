import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API URL sourced from .env (EXPO_PUBLIC_ prefix required for Expo)
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.78.71:5000';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000, // Important: prevent infinite 60-second freezes when backend is down
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error fetching token for request:', error);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient;
