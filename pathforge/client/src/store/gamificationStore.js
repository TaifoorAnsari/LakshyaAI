/**
 * Gamification Store (Zustand)
 * 
 * Manages reactive gamification state:
 * - Student level progress, XP, streak, freeze shields
 * - Badge achievements catalog (earned & locked)
 * - Global student leaderboard
 * - Celebratory badge unlock modal trigger
 */

import { create } from 'zustand';
import api from '@/lib/axios';

export const useGamificationStore = create((set, get) => ({
  stats: null,
  badges: [],
  leaderboard: [],
  currentUserRank: null,
  isLoadingStats: false,
  isLoadingBadges: false,
  isLoadingLeaderboard: false,
  unlockedBadge: null, // Holds newly unlocked badge for celebratory modal
  error: null,

  // ─── Actions ─────────────────────────────────────────────────────────

  fetchStats: async () => {
    set({ isLoadingStats: true, error: null });
    try {
      const res = await api.get('/gamification/stats');
      set({ stats: res.data.data, isLoadingStats: false });
      return res.data.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to load gamification stats',
        isLoadingStats: false,
      });
      return null;
    }
  },

  fetchBadges: async () => {
    set({ isLoadingBadges: true, error: null });
    try {
      const res = await api.get('/gamification/badges');
      set({ badges: res.data.data.badges || [], isLoadingBadges: false });
      return res.data.data.badges;
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to load badges',
        isLoadingBadges: false,
      });
      return [];
    }
  },

  fetchLeaderboard: async () => {
    set({ isLoadingLeaderboard: true, error: null });
    try {
      const res = await api.get('/gamification/leaderboard');
      set({
        leaderboard: res.data.data.leaderboard || [],
        currentUserRank: res.data.data.currentUserRank || null,
        isLoadingLeaderboard: false,
      });
      return res.data.data;
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to load leaderboard',
        isLoadingLeaderboard: false,
      });
      return null;
    }
  },


  showBadgeCelebration: (badge) => {
    set({ unlockedBadge: badge });
  },

  closeBadgeCelebration: () => {
    set({ unlockedBadge: null });
  },
}));
