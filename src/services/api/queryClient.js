import { QueryClient } from '@tanstack/react-query';

/**
 * Enterprise Query Client Configuration
 * Optimized for Guidora directory workload:
 * - staleTime: 5 minutes (prevents constant refetching on window focus, keeping views instant)
 * - gcTime (garbage collection): 15 minutes (preserves memory while caching catalog & detail views)
 * - retry: 1 on standard errors, 0 on 401/403/404 to avoid hammering backend
 * - refetchOnWindowFocus: false for calm UX
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 15,    // 15 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      retry: (failureCount, error) => {
        if (error?.statusCode === 401 || error?.statusCode === 403 || error?.statusCode === 404) {
          return false;
        }
        return failureCount < 1;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
