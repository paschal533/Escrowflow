import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/toastStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('escrowflow_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    } else if (!err.response) {
      // ponytail: no response reached the browser — network/CORS/DNS failure,
      // not a server-side rejection. Surface that distinction instead of a silent generic message.
      toast.error('Network error — could not reach the server. Check your connection and try again.');
    } else if (err.response.status >= 500) {
      toast.error(err.response.data?.error || 'Something went wrong on our end. Please try again.');
    }
    return Promise.reject(err);
  }
);

export default api;
