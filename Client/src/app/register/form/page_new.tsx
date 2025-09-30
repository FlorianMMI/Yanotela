"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterFormPage() {
  const router = useRouter();

  const handleRegisterSuccess = () => {
    // Afficher un message de succès et rediriger vers login
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Bienvenue à bord 👋
          </h1>
          <p className="text-gray-600">
            Créez votre compte Yanotela
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <RegisterForm
            onSuccess={handleRegisterSuccess}
            showTitle={false}
            onSwitchToLogin={() => router.push('/login')}
            isInline={true} // Version complète
          />
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-gray-600 text-sm">
            Déjà un compte ?{' '}
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
