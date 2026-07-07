import axios from 'axios';

export const createIdempotencyKey = (prefix = 'request') => {
  if (window.crypto?.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  withCredentials: true,
});

// Request Interceptor: keep cookies attached for JWT sessions
API.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle auth errors and transparent token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      const url = originalRequest.url || '';
      if (url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/signup')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:expired'));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        const res = await axios.post(`${refreshBaseUrl}/auth/refresh`, {}, { withCredentials: true });
        const { token } = res.data;

        localStorage.setItem('token', token);
        if (res.data.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
        window.dispatchEvent(new CustomEvent('auth:refreshed', { detail: { token, user: res.data.user } }));

        API.defaults.headers.common.Authorization = `Bearer ${token}`;
        originalRequest.headers.Authorization = `Bearer ${token}`;

        processQueue(null, token);
        isRefreshing = false;

        return API(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:expired'));

        const path = window.location.pathname;
        const isAuthPage = path.includes('/login') || path.includes('/signup');
        const isSeatSelectionPage = path.startsWith('/events/') && path.endsWith('/seats');

        if (!isAuthPage && !isSeatSelectionPage) {
          window.location.href = window.location.pathname.startsWith('/admin') ? '/admin/login' : '/login';
        }

        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default API;
