import { create } from 'zustand';
import * as authApi from '../api/auth';

type AuthState = {
  username: string | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  authNotice: string | null;
  restore: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  expireSession: (message?: string) => Promise<void>;
  clearNotice: () => void;
  setUsername: (username: string) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  username: null,
  isAuthenticated: false,
  isRestoring: true,
  authNotice: null,

  // Runs once at launch, behind the splash, so a returning phone never sees
  // the login screen flash past.
  restore: async () => {
    try {
      const username = await authApi.restoreSession();
      set({ username, isAuthenticated: Boolean(username) });
    } finally {
      set({ isRestoring: false });
    }
  },

  login: async (username, password) => {
    await authApi.login(username, password);
    set({ username, isAuthenticated: true, authNotice: null });
  },

  logout: async () => {
    await authApi.logout();
    set({ username: null, isAuthenticated: false, authNotice: null });
  },

  expireSession: async (message = 'Your session expired. Please sign in again.') => {
    await authApi.expireSession();
    set({ username: null, isAuthenticated: false, authNotice: message });
  },

  clearNotice: () => set({ authNotice: null }),
  setUsername: (username) => set({ username }),
}));
