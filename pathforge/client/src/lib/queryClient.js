/**
 * TanStack Query Client Configuration
 * 
 * Centralized config for React Query. Sensible defaults:
 * - staleTime: 5 minutes — data is considered fresh for 5 min
 * - retry: 1 — retry failed requests once before showing error
 * - refetchOnWindowFocus: false — don't spam the API when user tabs back
 * 
 * WHY React Query (TanStack Query)?
 * It handles caching, deduplication, background refetching, and
 * loading/error states. Without it, we'd manually manage all of
 * that in Zustand, which is painful and error-prone for server state.
 * 
 * Rule of thumb:
 * - Zustand = client state (auth, UI preferences, dark mode)
 * - React Query = server state (roadmaps, progress, leaderboard)
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 minutes
      gcTime: 10 * 60 * 1000,          // 10 minutes (was cacheTime in v4)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0, // Don't auto-retry mutations (they have side effects)
    },
  },
});
