
import axios from 'axios';
import { APP_CONFIG } from '../config';

const api = axios.create({
  baseURL: APP_CONFIG.apiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('zini_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
       // Optional: specific logic for 401
    }
    // Clean error logging
    if (error.code === "ERR_NETWORK") {
        console.error("Network Error: Backend not reachable");
    } else {
        console.error("API Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
