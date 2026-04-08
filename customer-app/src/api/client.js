import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In a real app, use environment variables.
// Use your machine's local IP for physical devices on Expo
const API_URL = 'http://192.168.78.71:5000/api';  

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
