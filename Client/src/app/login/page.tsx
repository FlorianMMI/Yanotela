'use client';

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import MobileFlashNoteButton from '@/components/flashnote/MobileFlashNoteButton';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setUrlError(decodeURIComponent(errorParam));
    }

    const checkAuth = async () => {
      try {
        const res = await fetch('https://yanotela.fr/api/auth/check', {
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
      }
    };

    checkAuth();
  }, [router, searchParams]);

  const handleLoginSuccess = () => {
    // Utiliser replace pour forcer la navigation sans garder l'historique
    router.replace('/notes');
  };

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <MobileFlashNoteButton />
      
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

        {/* Erreur depuis l'URL (redirection serveur) */}
        {urlError && (
          <div className="p-4 bg-dangerous-100 border border-dangerous-600 text-dangerous-600 rounded-lg text-sm">
            {urlError}
          </div>
        )}

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

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary mb-2">
              Quel plaisir de vous revoir !
            </h1>
            <p className="text-clrprincipal">
              Connectez-vous à votre compte Yanotela
            </p>
          </div>
          <div className="bg-clrsecondaire p-8 rounded-xl shadow-lg">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
