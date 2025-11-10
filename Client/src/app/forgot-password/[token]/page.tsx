import React from 'react';
import Link from 'next/link';
import ResetPasswordForm from '../../../components/auth/ResetPasswordForm';

interface ResetPasswordTokenPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function ResetPasswordTokenPage({ params }: ResetPasswordTokenPageProps) {
  const { token } = await params;
  
  // Server-side token validation
  if (!token || typeof token !== 'string' || token.length < 10) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-clrprincipal mb-4">Token manquant</h1>
          <p className="text-gray-100">Le lien de réinitialisation semble invalide.</p>
          <Link 
            href="/login" 
            className="mt-4 inline-block text-primary hover:text-primary-hover font-medium"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex items-center justify-center p-4">
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

        {/* Reset Password Form - Client Component */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <ResetPasswordForm
            token={token}
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
