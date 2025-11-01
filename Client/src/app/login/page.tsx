'use client';

import React from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import { useEffect, useState } from "react";

export default function Login() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAutoLogin, setIsAutoLogin] = useState(false);

  const handleLoginSuccess = () => {
    router.push('/notes');
    router.refresh();
  };

  const handleAutoLogin = async () => {
    setIsAutoLogin(true);
    try {
      const response = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: 'test@yanotela.com',
          password: 'test123'
        }),
      });

      if (response.ok) {
        handleLoginSuccess();
      } else {
        const errorData = await response.json();
        console.error('Erreur de connexion automatique:', errorData);
        alert('Erreur de connexion automatique. Vérifiez que le compte test existe.');
      }
    } catch (error) {
      console.error('Erreur lors de la connexion automatique:', error);
      alert('Erreur de connexion automatique');
    } finally {
      setIsAutoLogin(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('http://localhost:3001/auth/check', {
          method: 'GET',
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();

          // Vérifier les deux formats possibles de la réponse
          if (data.authenticated || data.isAuthenticated) {
            router.push('/notes');
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

        {/* Bouton de connexion automatique pour les tests */}
        <div className="text-center">
          <button
            onClick={handleAutoLogin}
            disabled={isAutoLogin}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {isAutoLogin ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Connexion en cours...
              </span>
            ) : (
              "🚀 Connexion Test Rapide"
            )}
          </button>
          <p className="text-sm text-gray-500 mb-6">
            Compte test : test@yanotela.com / test123
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
