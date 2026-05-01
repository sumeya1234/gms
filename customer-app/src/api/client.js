import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://gms-1-v6wu.onrender.com';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
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
