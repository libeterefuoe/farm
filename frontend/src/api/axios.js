import axios from 'axios';

const TOKEN_KEY = 'batloung_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000
});

// Attach Bearer token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: retry safe GETs once, then convert errors.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    const isGetRequest = config.method?.toLowerCase() === 'get';
    const retryCount = config._retryCount || 0;

    // Retry safe reads once on network failure (Render cold starts)
    if (!error.response && isGetRequest && retryCount < 1) {
      config._retryCount = retryCount + 1;
      await new Promise((r) => setTimeout(r, 1000));
      return api.request(config);
    }

    // Auto-logout on 401 (except on the login endpoint itself)
    if (error.response?.status === 401 && !config.url?.includes('/auth/login')) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('batloung_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }

    let message = 'Unexpected error. Please try again.';
    if (error.response) {
      const data = error.response.data;
      if (data && typeof data === 'object' && data.message) message = data.message;
      else if (typeof data === 'string' && data.length > 0) message = data;
      else message = `Request failed (${error.response.status})`;
    } else if (error.request) {
      message = 'Cannot reach the API. Is the backend running?';
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject(new Error(message));
  }
);

export default api;