"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from './useAuth';

export function useAuthRedirect(options?: { skipRedirect?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();

  // Pages publiques qui ne nécessitent pas d'authentification
  const publicPages = ['/cgu', '/mentions-legales', '/login', '/register', '/forgot-password'];
  const isPublicPage = publicPages.some(page => pathname?.startsWith(page));

  // Redirection basée sur l'état centralisé d'authentification.
  useEffect(() => {
    if (loading) return; // Attendre la fin du chargement

    if (isAuthenticated) {
      if (isPublicPage && pathname && pathname !== '/') router.push('/notes');
      return;
    }

    if (!isPublicPage && !options?.skipRedirect) {
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, loading, pathname, options?.skipRedirect]);

  return { isAuthenticated, loading };
}
