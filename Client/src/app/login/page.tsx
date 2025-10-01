'use client';

import React from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import { useEffect, useState } from "react";

export default function Login() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  const handleLoginSuccess = () => {
    router.push('/notes');
    router.refresh();
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Vérification de l\'authentification...');
        const res = await fetch('http://localhost:3001/auth/check', {
          method: 'GET',
          credentials: 'include',
        });

        console.log('Réponse du serveur:', res.status, res.ok);

        if (res.ok) {
          const data = await res.json();
          console.log('Données reçues:', data);

          // Vérifier les deux formats possibles de la réponse
          if (data.authenticated || data.isAuthenticated) {
            console.log('Utilisateur authentifié, redirection vers /');
            router.push('/');
            return;
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification d\'authentification:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  // Afficher un loader pendant la vérification
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Quel plaisir de vous revoir !
          </h1>
          <p className="text-clrprincipal">
            Connectez-vous à votre compte Yanotela
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-clrsecondaire p-8 rounded-xl shadow-lg">
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
