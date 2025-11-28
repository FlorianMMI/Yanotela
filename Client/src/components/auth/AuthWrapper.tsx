"use client";

import { useRouter, usePathname } from "next/navigation";
import React, { useEffect, useState, useCallback, createContext, useContext, useMemo } from "react";

type User = { id: number; pseudo: string; email: string } | null;

export type AuthContextType = {
  isAuthenticated: boolean | null;
  loading: boolean;
  user: User;
  refetch: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User>(null);

  const publicRoutes = useMemo<string[]>(
    () => ['/login', '/register', '/forgot-password', '/'],
    []
  );
  const protectedRoutes = useMemo<string[]>(
    () => ['/corbeille', '/dossiers', '/profil'],
    []
  );

  const checkAuth = useCallback(async (): Promise<void> => {
    setLoading(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const doFetch = async (url: string) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const resp = await fetch(url, { method: 'GET', credentials: 'include', signal: controller.signal });
        clearTimeout(timeout);
        return resp;
      } catch (e) {
        return null;
      }
    };

    try {
      const primaryBase = API_URL || (typeof window !== 'undefined' ? window.location.origin : '');
      let response = null;

      if (primaryBase) {
        response = await doFetch(`${primaryBase}/auth/check`);
      }

      // If primary failed and API_URL was set, try a relative fallback
      if (!response && API_URL) {
        response = await doFetch('/auth/check');
        console.warn('[AuthWrapper] primary auth check failed, attempted relative fallback');
      }

      if (!response) {
        throw new Error('No response from auth endpoint');
      }

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(!!data.authenticated);
        setUser(data.user ?? null);

        const isPublic = publicRoutes.some(route => pathname === route) || pathname.startsWith('/validate/');
        if (data.authenticated && isPublic && pathname !== '/') {
          router.replace('/notes');
          return;
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);

        const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
        const isNotesList = pathname === '/notes';
        if (isProtected || isNotesList) {
          router.replace('/login');
          return;
        }
      }
    } catch (err) {
      console.warn('Auth check failed:', err instanceof Error ? err.message : err);
      setIsAuthenticated(false);
      setUser(null);

      const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
      const isNotesList = pathname === '/notes';
      if (isProtected || isNotesList) {
        router.replace('/login');
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [pathname, router, protectedRoutes, publicRoutes]);

  // Check initial au montage
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Vérification à chaque changement de route
  useEffect(() => {
    checkAuth();
  }, [pathname, checkAuth]);

  // Écoute des événements de rafraîchissement d'auth
  useEffect(() => {
    const handleAuthRefresh = () => {
      checkAuth();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'auth-refresh') checkAuth();
    };

    window.addEventListener('auth-refresh', handleAuthRefresh);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('auth-refresh', handleAuthRefresh);
      window.removeEventListener('storage', handleStorage);
    };
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const contextValue: AuthContextType = {
    isAuthenticated,
    loading,
    user,
    refetch: checkAuth,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthWrapper');
  }
  return ctx;
}
