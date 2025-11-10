"use client";

import { useRouter, usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Pages qui ne nécessitent pas d'authentification (pages publiques)
  const publicRoutes = [
    '/login',
    '/register', 
    '/forgot-password',
    '/'
  ];
  
  // Pages qui nécessitent l'authentification (pages protégées)
  const protectedRoutes = [
    '/notes',
    '/corbeille',
    '/dossiers',
    '/profil'
  ];
  
  // Vérifier si la route actuelle est publique
  const isPublicRoute = publicRoutes.some(route => pathname === route) || 
                       pathname.startsWith('/validate/'); // Pour les routes de validation avec token
  
  // Vérifier si la route actuelle est protégée
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  const checkAuth = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/auth/check`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
        
        // Si utilisateur connecté et sur une page publique (login/register), rediriger vers /notes
        if (data.authenticated && isPublicRoute && pathname !== '/') {
          router.replace('/notes');
          return;
        }
      } else {
        setIsAuthenticated(false);
        
        // Si utilisateur non connecté et sur une page protégée, rediriger vers /login
        if (isProtectedRoute) {
          router.replace('/login');
          return;
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification d\'authentification:', error);
      setIsAuthenticated(false);
      
      // En cas d'erreur sur page protégée, rediriger vers login
      if (isProtectedRoute) {
        router.replace('/login');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  // Écouter les événements de changement d'authentification
  useEffect(() => {
    const handleAuthRefresh = () => {
      checkAuth();
    };
    
    window.addEventListener('auth-refresh', handleAuthRefresh);
    window.addEventListener('storage', (e) => {
      if (e.key === 'auth-refresh') {
        checkAuth();
      }
    });

    return () => {
      window.removeEventListener('auth-refresh', handleAuthRefresh);
      window.removeEventListener('storage', handleAuthRefresh);
    };
  }, []);

  // Afficher un loader pendant la vérification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}