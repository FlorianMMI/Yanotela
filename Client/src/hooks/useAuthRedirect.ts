"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useAuthRedirect() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkTrigger, setCheckTrigger] = useState(0);

  const checkAuth = async () => {
    try {
      const response = await fetch('https://yanotela.fr/api/auth/check', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
      } else {
        setIsAuthenticated(false);
        router.push('/login');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification d\'authentification:', error);
      setIsAuthenticated(false);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [router, checkTrigger]);

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