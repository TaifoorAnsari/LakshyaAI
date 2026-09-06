/**
 * Schedule Store (Zustand)
 * 
 * Manages:
 * - Active study schedule & sessions
 * - Today's sessions & focus milestone
 * - Schedule generation actions
 * - Session completion toggle & notes
 */

import { create } from 'zustand';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

export const useScheduleStore = create((set, get) => ({
  // ─── State ──────────────────────────────────────────────
  schedule: null,
  roadmap: null,
  todayData: {
    sessions: [],
    activeMilestone: null,
    preferences: null,
  },
  isLoading: false,
  isGenerating: false,
  error: null,

  // ─── Actions ────────────────────────────────────────────

  /**
   * Fetch user's full study schedule
   */
  fetchSchedule: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/schedule');
      if (res.data?.success) {
        set({
          schedule: res.data.data?.schedule || null,
          roadmap: res.data.data?.roadmap || null,
          isLoading: false,
        });
      }
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to load study schedule',
        isLoading: false,
      });
    }
  },

  /**
   * Fetch today's scheduled study sessions for the dashboard card
   */
  fetchTodaySessions: async () => {
    try {
      const res = await api.get('/schedule/today');
      if (res.data?.success) {
        set({ todayData: res.data.data });
      }
    } catch {
      // Quiet fail for widget
    }
  },

  /**
   * (Re)generate study schedule with customizable preferences
   */
  generateSchedule: async (preferences) => {
    set({ isGenerating: true, error: null });
    try {
      const res = await api.post('/schedule/generate', preferences);
      if (res.data?.success) {
        set({
          schedule: res.data.data,
          isGenerating: false,
        });
        toast.success('Study schedule generated successfully!');
        get().fetchTodaySessions();
        return res.data.data;
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate study schedule';
      set({ error: msg, isGenerating: false });
      toast.error(msg);
      throw err;
    }
  },

  /**
   * Mark a session complete or update its status
   */
  updateSessionStatus: async (sessionId, status) => {
    try {
      const res = await api.patch(`/schedule/sessions/${sessionId}`, { status });
      if (res.data?.success) {
        const updated = res.data.data;

        // Update in schedule state
        const currentSchedule = get().schedule;
        if (currentSchedule?.sessions) {
          const updatedSessions = currentSchedule.sessions.map((s) =>
            s._id === sessionId ? { ...s, ...updated } : s
          );
          set({ schedule: { ...currentSchedule, sessions: updatedSessions } });
        }

        // Update in todayData state
        const currentToday = get().todayData;
        if (currentToday?.sessions) {
          const updatedTodaySessions = currentToday.sessions.map((s) =>
            s._id === sessionId ? { ...s, ...updated } : s
          );
          set({ todayData: { ...currentToday, sessions: updatedTodaySessions } });
        }

        if (status === 'completed') {
          toast.success('Study session marked as complete! +Discipline Streak');
        }
        return updated;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update study session');
    }
  },

  /**
   * Trigger download of RFC 5545 .ics calendar file
   */
  downloadCalendarICS: async () => {
    try {
      const res = await api.get('/schedule/export.ics', {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'pathforge-study-schedule.ics');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Calendar downloaded! Open it to import to Google/Apple/Outlook Calendar.');
    } catch {
      toast.error('Failed to export calendar. Please make sure you have an active schedule.');
    }
  },
}));
