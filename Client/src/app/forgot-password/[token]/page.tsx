'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ResetPasswordForm from '../../../components/auth/ResetPasswordForm';

export default function ResetPasswordTokenPage() {
  const params = useParams();
  const router = useRouter();
  
  // Gestion sécurisée du token - peut être string ou string[]
  const tokenParam = params.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  // Protection contre les tokens undefined/null/invalides qui peuvent causer des erreurs React
  if (!token || typeof token !== 'string' || token.length < 10) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text- mb-4">Token manquant</h1>
          <p className="text-gray-100">Le lien de réinitialisation semble invalide.</p>
        </div>
      </div>
    );
  }

  const handleSuccess = () => {
    // Rediriger vers login après succès
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Nouveau mot de passe
          </h1>
          <p className="text-element">
            Veuillez saisir votre nouveau mot de passe
          </p>
        </div>

        {/* Reset Password Form */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <ResetPasswordForm
            token={token}
            onSuccess={handleSuccess}
            showTitle={false}
          />
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-element text-sm">
            Vous vous souvenez de votre mot de passe ?{' '}
            <Link 
              href="/login" 
              className="text-primary hover:text-primary-hover font-medium"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
