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

  // Séparé : vérification auth pure (sans redirection)
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
        
      }

      if (!response) {
        throw new Error('No response from auth endpoint');
      }

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(!!data.authenticated);
        setUser(data.user ?? null);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (err) {
      
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []); // Plus de dépendance sur pathname/router

  // Check auth uniquement au montage (une seule fois)
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Redirection basée sur l'état d'authentification et le pathname
  useEffect(() => {
    if (loading || isAuthenticated === null) return;

    const isPublic = publicRoutes.some(route => pathname === route) || pathname.startsWith('/validate/');
    const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
    const isNotesList = pathname === '/notes';

    if (isAuthenticated && isPublic && pathname !== '/') {
      router.replace('/notes');
    } else if (!isAuthenticated && (isProtected || isNotesList)) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, pathname, router, publicRoutes, protectedRoutes]);

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
