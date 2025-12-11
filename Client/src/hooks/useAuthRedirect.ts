"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export function useAuthRedirect(options?: { skipRedirect?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();

  // Pages publiques qui ne nécessitent pas d'authentification
  const publicPages = ['/cgu', '/mentions-legales', '/login', '/register', '/forgot-password', '/validate'];
  const isPublicPage = publicPages.some(page => pathname?.startsWith(page));

  // Local fallback state when useAuth returns the conservative defaults
  const [localLoading, setLocalLoading] = useState(() => (isAuthenticated === null ? true : false));
  const [localAuth, setLocalAuth] = useState<boolean | null>(null);

  const getAuthUrl = useCallback(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? '';
    return base ? `${base.replace(/\/$/, '')}/auth/check` : '/auth/check';
  }, []);

  const runAuthCheck = useCallback(async () => {
    setLocalLoading(true);
    try {
      const url = getAuthUrl();
      const res = await fetch(url, { method: 'GET', credentials: 'include' });
      if (res.ok) {
        try {
          const data = await res.json();
          setLocalAuth(Boolean(data?.authenticated));
        } catch {
          // If no JSON, consider authenticated by virtue of ok
          setLocalAuth(true);
        }
      } else {
        setLocalAuth(false);
        if (!isPublicPage && !options?.skipRedirect) router.push('/login');
      }
    } catch (e) {
      // Network or other errors

      console.error(e);
      setLocalAuth(false);
      if (!isPublicPage && !options?.skipRedirect) router.push('/login');
    } finally {
      setLocalLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAuthUrl, isPublicPage, options?.skipRedirect]);

  // If the central auth hook isn't mounted (it returns null for isAuthenticated),
  // perform our own auth check so hooks used outside the provider still behave.
  useEffect(() => {
    if (isAuthenticated === null && loading) {
      void runAuthCheck();
    }
  }, [isAuthenticated, loading, runAuthCheck]);

  // Listen to storage and custom auth-refresh events to re-run the check
  useEffect(() => {
    const onStorage = () => {
      // Re-run auth check when storage changes
      if (isAuthenticated === null) void runAuthCheck();
    };
    const onAuthRefresh = () => {
      if (isAuthenticated === null) void runAuthCheck();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('auth-refresh', onAuthRefresh);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('auth-refresh', onAuthRefresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runAuthCheck]);

  // Determine the effective state: prefer central auth, fallback to local
  const effectiveLoading = isAuthenticated === null ? localLoading : loading;
  const effectiveAuth = isAuthenticated === null ? localAuth : isAuthenticated;

  // Redirection based on effective state
  useEffect(() => {
    if (effectiveLoading) return;

    if (effectiveAuth) {
      if (isPublicPage && pathname && pathname !== '/') router.push('/notes');
      return;
    }

    if (!isPublicPage && !options?.skipRedirect) {
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveAuth, effectiveLoading, pathname, options?.skipRedirect]);

  return { isAuthenticated: effectiveAuth, loading: effectiveLoading };
}
