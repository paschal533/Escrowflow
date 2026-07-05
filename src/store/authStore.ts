import { create } from 'zustand';
import api from '../api/client';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { name: string; email: string; phone: string; password: string; roles: string[] }) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('escrowflow_token'),
  loading: false,

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { token, user } = data.data;
    localStorage.setItem('escrowflow_token', token);
    set({ token, user });
  },

  signup: async (formData) => {
    const { data } = await api.post('/auth/signup', formData);
    const { token, user } = data.data;
    localStorage.setItem('escrowflow_token', token);
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem('escrowflow_token');
    set({ token: null, user: null });
    window.location.href = '/login';
  },

  loadUser: async () => {
    const token = localStorage.getItem('escrowflow_token');
    if (!token) return;
    set({ loading: true });
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.data.user });
    } catch {
      localStorage.removeItem('escrowflow_token');
      set({ token: null });
    } finally {
      set({ loading: false });
    }
  },
}));
