'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import MobileFlashNoteButton from '@/components/flashnote/MobileFlashNoteButton';

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    // Récupérer l'erreur depuis l'URL (si elle existe)
    const error = searchParams.get('error');
    if (error) {
      setUrlError(decodeURIComponent(error));
      
      // Nettoyer l'URL après avoir récupéré l'erreur
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

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
