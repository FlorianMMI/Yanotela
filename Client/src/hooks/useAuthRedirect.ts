"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useAuthRedirect(options?: { skipRedirect?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkTrigger, setCheckTrigger] = useState(0);

  // Pages publiques qui ne nécessitent pas d'authentification
  const publicPages = ['/cgu', '/mentions-legales', '/login', '/register', '/forgot-password'];
  const isPublicPage = publicPages.some(page => pathname?.startsWith(page));

  const checkAuth = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://yanotela.fr';
      const response = await fetch(`${API_URL}/auth/check`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
      } else {
        setIsAuthenticated(false);
        // Ne pas rediriger si on est sur une page publique ou si skipRedirect est activé
        if (!isPublicPage && !options?.skipRedirect) {
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification d\'authentification:', error);
      setIsAuthenticated(false);
      // Ne pas rediriger si on est sur une page publique ou si skipRedirect est activé
      if (!isPublicPage && !options?.skipRedirect) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkTrigger, pathname]);

  // Écouter les changements d'authentification via storage events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-refresh') {
        setCheckTrigger(prev => prev + 1);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Écouter les événements custom pour le même onglet
    const handleCustomEvent = () => {
      setCheckTrigger(prev => prev + 1);
    };
    
    window.addEventListener('auth-refresh', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-refresh', handleCustomEvent);
    };
  }, []);

  return { isAuthenticated, loading };
}
