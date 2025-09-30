'use client';

import React from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import { useEffect } from "react";
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  const handleLoginSuccess = () => {
    router.push('/notes');
    router.refresh();
  };

  useEffect(() => {
    // Si l'utilisateur est déjà authentifié, rediriger vers /notes
    if (isAuthenticated === true) {
      console.log('Utilisateur déjà authentifié, redirection vers /notes');
      router.replace('/notes');
    }
  }, [isAuthenticated, router]);

  // Afficher un loader pendant la vérification d'authentification
  if (loading || isAuthenticated === true) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Ne afficher le formulaire que si l'utilisateur n'est PAS authentifié
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary mb-2">
              Quel plaisir de vous revoir !
            </h1>
            <p className="text-gray-600">
              Connectez-vous à votre compte Yanotela
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <LoginForm
              onSuccess={handleLoginSuccess}
              showTitle={false}
              onSwitchToRegister={() => router.push('/register')}
              onSwitchToForgot={() => router.push('/forgot-password')}
            />
          </div>
        </div>
      </div>
    );
  }

  // Par défaut, afficher le loader si l'état d'authentification n'est pas encore déterminé
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}