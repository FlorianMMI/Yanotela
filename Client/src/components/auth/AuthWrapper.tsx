"use client";

import { useRouter, usePathname } from "next/navigation";
import React, { useEffect, useState, createContext, useContext } from "react";

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

  const publicRoutes = ['/login', '/register', '/forgot-password', '/'];
  const protectedRoutes = ['/corbeille', '/dossiers', '/profil'];
  // Les notes individuelles peuvent être publiques, donc on ne les bloque pas systématiquement

  const isPublicRoute = publicRoutes.some(route => pathname === route) || pathname.startsWith('/validate/');
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  // Notes listing nécessite l'authentification, mais pas les notes individuelles
  const isNotesListing = pathname === '/notes';

  const checkAuth = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/auth/check`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(!!data.authenticated);
        setUser(data.user ?? null);

        if (data.authenticated && isPublicRoute && pathname !== '/') {
          router.replace('/notes');
          return;
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);

        // Rediriger uniquement pour les routes vraiment protégées (pas les notes individuelles)
        if (isProtectedRoute || isNotesListing) {
          router.replace('/login');
          return;
        }
      }
    } catch (err) {
      console.error('Erreur lors de la vérification d\'authentification:', err);
      setIsAuthenticated(false);
      setUser(null);

      if (isProtectedRoute || isNotesListing) {
        router.replace('/login');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
  }, []);

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