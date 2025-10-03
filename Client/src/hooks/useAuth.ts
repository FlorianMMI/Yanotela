"use client";

import { useEffect, useState } from 'react';

export interface AuthState {
  isAuthenticated: boolean | null;
  loading: boolean;
  user?: {
    id: number;
    pseudo: string;
    email: string;
  };
  refetch: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<Omit<AuthState, 'refetch'>>({
    isAuthenticated: null,
    loading: true,
  });

  const checkAuth = async () => {
    try {
      const response = await fetch('http://localhost:3001/auth/check', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAuthState({
          isAuthenticated: data.authenticated,
          loading: false,
          user: data.user,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification d\'authentification:', error);
      setAuthState({
        isAuthenticated: false,
        loading: false,
      });
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    ...authState,
    refetch: checkAuth,
  };
}