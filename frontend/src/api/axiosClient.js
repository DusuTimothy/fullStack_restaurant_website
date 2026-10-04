import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const API_URL = import.meta.env.VITE_API_URL || `${BACKEND_URL}/api`;

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Automatically inject JWT Bearer token into Authorization header
axiosClient.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('restaurant_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.error('Failed to read auth token from localStorage:', err);
  }
  return config;
});

// Response interceptor to handle expired or invalid token gracefully
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthEndpoint =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/signup');

      if (!isAuthEndpoint) {
        try {
          localStorage.removeItem('restaurant_auth_token');
          localStorage.removeItem('restaurant_auth_user');
          window.dispatchEvent(new CustomEvent('auth:expired'));
        } catch (e) {
          console.error('Failed to clear token on 401:', e);
        }
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Resolves static uploaded images or external URLs.
 * e.g., "/uploads/menu-item.jpg" -> "http://localhost:5000/uploads/menu-item.jpg"
 */
export const resolveImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${BACKEND_URL}${cleanPath}`;
};

export default axiosClient;
