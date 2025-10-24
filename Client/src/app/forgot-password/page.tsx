'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import MobileFlashNoteButton from '@/components/flashnote/MobileFlashNoteButton';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const handleSuccess = () => {
    // Rediriger vers login après succès
    setTimeout(() => {
      router.push('/login');
    }, 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <MobileFlashNoteButton />
      
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Mot de passe oublié ?
          </h1>
          <p className="text-gray-600">
            Saisissez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {/* Forgot Password Form */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <ForgotPasswordForm
            onSuccess={handleSuccess}
            showTitle={false}
            onSwitchToLogin={() => router.push('/login')}
          />
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-gray-600 text-sm">
            Vous vous souvenez de votre mot de passe ?{' '}
            <Link 
              href="/login" 
              className="text-primary hover:text-rouge-hover font-medium"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
