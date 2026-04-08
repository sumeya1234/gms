import axios from 'axios';

// The backend seems to be configured to run on port 5000 based on the swagger docs and running environment
export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Configure interceptor to pass auth tokens
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept 401s globally to force re-login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      // Simple reload mechanism if 401 triggers, real app would use context
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);
