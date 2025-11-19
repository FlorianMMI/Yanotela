"use client";

import { useContext } from 'react';
import { useAuthContext } from '@/components/auth/AuthWrapper';

export interface AuthState {
  isAuthenticated: boolean | null;
  loading: boolean;
  user?: { id: number; pseudo: string; email: string } | null;
  refetch: () => Promise<void>;
}

export function useAuth(): AuthState {
  // Delegates to the central AuthWrapper context. If the hook is used
  // outside of the provider (e.g. during server render or before the
  // provider is mounted), return safe defaults instead of throwing.
  try {
    const ctx = useAuthContext();
    return {
      isAuthenticated: ctx.isAuthenticated,
      loading: ctx.loading,
      user: ctx.user,
      refetch: ctx.refetch,
    };
  } catch (e) {
    // Not mounted: return conservative defaults (loading=true so callers
    // don't immediately redirect) and a no-op refetch.
    // eslint-disable-next-line no-console
    console.warn('useAuth used outside AuthWrapper, returning fallback auth state.');
    return {
      isAuthenticated: null,
      loading: true,
      user: null,
      refetch: async () => {},
    };
  }
}
