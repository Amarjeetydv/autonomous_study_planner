import axios from 'axios';
import { toast } from '../toast';

const rawBaseUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000/api/v1';

export const API_BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 35000, // Accommodate Render free tier cold starts
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Attach access token to headers
apiClient.interceptors.request.use(
  (config) => {
    if (!navigator.onLine) {
      toast.warning('You are currently offline. Check your internet connection.', 'Offline Mode');
    }
    const token = localStorage.getItem('asp_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses to handle 401 Unauthorized via Refresh Token & Retry Logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    // Auto retry logic for GET requests on network failure or 503 Render cold start
    const isGetMethod = originalRequest.method?.toLowerCase() === 'get';
    const isNetworkOr503 = !error.response || error.response.status === 503 || error.code === 'ECONNABORTED';

    if (isGetMethod && isNetworkOr503) {
      originalRequest._retryCount = originalRequest._retryCount || 0;
      if (originalRequest._retryCount < 3) {
        originalRequest._retryCount += 1;
        const delay = Math.pow(2, originalRequest._retryCount) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return apiClient(originalRequest);
      }
    }

    const isPublicRoute = originalRequest.url && (
      originalRequest.url.includes('/auth/login') ||
      originalRequest.url.includes('/auth/register') ||
      originalRequest.url.includes('/auth/forgot-password') ||
      originalRequest.url.includes('/auth/reset-password')
    );

    if (error.response?.status === 401 && !originalRequest._retry && !isPublicRoute) {
      originalRequest._retry = true;
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, { withCredentials: true });
        const { accessToken } = response.data.data;
        
        localStorage.setItem('asp_access_token', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('asp_access_token');
        window.dispatchEvent(new Event('asp_logout'));
        toast.error('Your session has expired. Please log in again.', 'Session Expired');
        return Promise.reject(refreshError);
      }
    }

    // Friendly error notifications for general failures (excluding expected 401 auth checks)
    if (!error.response && error.code === 'ECONNABORTED') {
      toast.error('The server took too long to respond (Render Cold Start). Please try again in a moment.', 'Request Timeout');
    } else if (!error.response) {
      toast.error('Unable to connect to backend server. Please check your connection.', 'Network Error');
    } else if (error.response.status >= 500) {
      toast.error('A server error occurred. Our team has been notified.', 'Server Error (500)');
    } else if (error.response.status === 403 && !isPublicRoute) {
      toast.error('You do not have permission to perform this action.', 'Forbidden (403)');
    }

    return Promise.reject(error);
  }
);

export default apiClient;


