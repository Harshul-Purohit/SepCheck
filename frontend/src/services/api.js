import axios from 'axios';

const api = axios.create({
  baseURL: 'https://sepcheck.onrender.com', // Render Backend API
  // baseURL: 'http://localhost:8000', // Local Backend API 
});

// Interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
