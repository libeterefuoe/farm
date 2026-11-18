import axios from 'axios';

// Central Axios instance.
// baseURL comes from Vite env variable VITE_API_URL (loaded from .env).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  // Render may need time to wake a sleeping service on the first request.
  timeout: 60000
});

// Response interceptor: convert every API error into a plain string
// so pages can just do `setError(err.message)` without parsing.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Retry safe reads once when the connection drops or times out.
    // Do not retry writes because their outcome may be unknown to the client.
    const config = error.config;
    const isGetRequest = config?.method?.toLowerCase() === 'get';
    const retryCount = config?._retryCount || 0;

    if (!error.response && isGetRequest && retryCount < 1) {
      config._retryCount = retryCount + 1;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return api.request(config);
    }

    let message = 'Unexpected error. Please try again.';

    if (error.response) {
      const data = error.response.data;
      if (data && typeof data === 'object' && data.message) {
        message = data.message;
      } else if (typeof data === 'string' && data.length > 0) {
        message = data;
      } else {
        message = `Request failed (${error.response.status})`;
      }
    } else if (error.request) {
      message = 'Cannot reach the API. Is the backend running?';
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject(new Error(message));
  }
);

export default api;