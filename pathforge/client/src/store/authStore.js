/**
 * Auth Store (Zustand)
 * 
 * Global state for authentication:
 * - user: the logged-in user's profile data
 * - accessToken: JWT access token (kept in memory, NOT localStorage)
 * - isAuthenticated: derived boolean
 * - isLoading: boolean tracking initial session check
 */

import { create } from 'zustand';
import axios from 'axios';

export const useAuthStore = create((set, get) => ({
  // ─── State ──────────────────────────────────────────────
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  // ─── Actions ────────────────────────────────────────────

  /**
   * Called after successful login or token refresh.
   */
  login: (user, accessToken) => {
    set({
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    });

    try {
      sessionStorage.setItem('pf_user', JSON.stringify(user));
    } catch {
      // Ignore
    }
  },

  /**
   * Clear all auth state.
   */
  logout: () => {
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });

    try {
      sessionStorage.removeItem('pf_user');
    } catch {
      // Ignore
    }
  },

  setAccessToken: (accessToken) => {
    set({ accessToken, isAuthenticated: !!accessToken });
  },

  setUser: (user) => {
    set({ user });
    try {
      sessionStorage.setItem('pf_user', JSON.stringify(user));
    } catch {
      // Ignore
    }
  },

  /**
   * Attempt silent authentication restore on app launch
   */
  initializeAuth: async () => {
    try {
      // Try silent refresh using the httpOnly cookie
      const res = await axios.post(
        '/api/v1/auth/refresh',
        {},
        { withCredentials: true }
      );

      if (res.data?.success && res.data.data?.accessToken) {
        const { user, accessToken } = res.data.data;
        set({
          user,
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
        sessionStorage.setItem('pf_user', JSON.stringify(user));
        return;
      }
    } catch {
      // No active refresh session or expired
    }

    // Fallback: Check if user data exists in sessionStorage
    try {
      const stored = sessionStorage.getItem('pf_user');
      if (stored) {
        set({ user: JSON.parse(stored), isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },
}));
