
// import axios from 'axios';


// export const publicAxios = axios.create({
//   baseURL: import.meta.env.VITE_BACKEND_URL,
//   headers: { 'Content-Type': 'application/json' },
// });

// export const privateAxios = axios.create({
//   baseURL: import.meta.env.VITE_BACKEND_URL,
//   headers: { 'Content-Type': 'application/json' },
// });


// privateAxios.interceptors.request.use(
//   config => {
//     const token = localStorage.getItem('accessToken');
//     if (token && !config.url.includes('/auth/login') && !config.url.includes('/auth/signup')) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   error => Promise.reject(error)
// );


// privateAxios.interceptors.response.use(
//   response => response,
//   error => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem('accessToken');
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );



// src/Api/axios.js
import axios from 'axios';
import { authService } from './auth.api';

export const publicAxios = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const privateAxios = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Track if we're currently refreshing to avoid multiple refresh calls
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - add token to requests
privateAxios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken');
    if (token && !config.url.includes('/auth/login') && !config.url.includes('/auth/signup')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor - handle token refresh on 401
privateAxios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return privateAxios(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token
        const newToken = await authService.refresh();
        
        // Update the failed queue with new token
        processQueue(null, newToken);
        
        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return privateAxios(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);