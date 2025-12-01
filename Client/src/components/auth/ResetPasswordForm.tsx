'use client';

import React, { useState, useEffect } from 'react';
// import Turnstile from './Turnstile';
import { useRouter } from 'next/navigation';
import ConfirmPassword from '@/ui/confirm-password';
import { ResetPassword, ValidateResetToken } from '@/loader/loader';

interface ResetPasswordFormProps {
  token: string;
  onSuccess?: () => void;
  showTitle?: boolean;
  className?: string;
}

export default function ResetPasswordForm({
  token,
  onSuccess,
  showTitle = true,
  className = ""
}: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'validating'>('validating');
  const [message, setMessage] = useState('');

  // Validation des critères de mot de passe
  const passwordCriteria = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_\-\.]).+$/;

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token manquant');
        return;
      }

      try {
        const result = await ValidateResetToken(token);
        if (result.success) {
          setStatus('idle');
        } else {
          setStatus('error');
          setMessage("Token invalide ou expiré");
        }
      } catch (err) {
        setStatus('error');
        setMessage("Erreur de connexion au serveur :" + (err as Error).message);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setStatus('error');
      setMessage('Veuillez remplir tous les champs');
      return;
    }

    if (!passwordCriteria.test(password)) {
      setStatus('error');
      setMessage('Le mot de passe doit contenir au moins une majuscule, un chiffre et un caractère spécial (!@#$%^&*_-.)');
      return;
    }

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Les mots de passe ne correspondent pas');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const result = await ResetPassword(token, password);
      if (result.success) {
        setStatus('success');
        setMessage('Mot de passe réinitialisé avec succès. Redirection vers la connexion...');

        if (onSuccess) {
          setTimeout(onSuccess, 2000);
        } else {
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        }
      } else {
        setStatus('error');
        setMessage(result.error || 'Erreur lors de la réinitialisation du mot de passe');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setStatus('error');
      setMessage('Erreur de connexion au serveur');
    }
  };

  // Affichage de validation du token
  if (status === 'validating') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-600">Vérification du lien...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-md w-full space-y-8 ${className}`}>
      {showTitle && (
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Nouveau mot de passe
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Veuillez saisir votre nouveau mot de passe
          </p>
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <ConfirmPassword
          password={password}
          confirmPassword={confirmPassword}
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
          disabled={status === 'loading'}
        />

        {/* Messages de statut */}
        {status === 'success' && (
          <div className="rounded-md bg-success-50 p-4">
            <div className="flex">
              <div className="shrink-0">
                <svg className="h-5 w-5 text-green" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-success-800">
                  {message}
                </p>
              </div>
            </div>
          </div>
        )}

        {status === 'error' && !message.includes('Token') && !message.includes('connexion') && (
          <div className="rounded-md bg-dangerous-50 p-4">
            <div className="flex">
              <div className="shrink-0">
                <svg className="h-5 w-5 text-dangerous-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-dangerous-800">
                  {message}
                </p>
              </div>
            </div>
          </div>
        )}

        <div>
          {/* Turnstile widget (no-op in non-prod) */}
            {/* <Turnstile /> */}
          <button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Réinitialisation en cours...
              </div>
            ) : (
              'Réinitialiser le mot de passe'
            )}
          </button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="text-sm text-primary hover:text-primary-hover hover:underline cursor-pointer"
          >
            Retour à la connexion
          </button>
        </div>
      </form>
    </div>
  );
}
