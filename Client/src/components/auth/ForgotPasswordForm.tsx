"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ForgotPassword } from '@/loader/loader';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  showTitle?: boolean;
  showLoginLink?: boolean;
  onSwitchToLogin?: () => void;
  className?: string;
}

export default function ForgotPasswordForm({
  onSuccess,
  showTitle = true,
  showLoginLink = true,
  onSwitchToLogin,
  className = ""
}: ForgotPasswordFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Veuillez saisir votre adresse email');
      return;
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez saisir une adresse email valide');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Envoi demande de réinitialisation pour:', email);
      const result = await ForgotPassword(email);
      
      if (result.success) {
        setSuccess('Un lien de réinitialisation a été envoyé à votre adresse email.');
        setEmail(''); // Vider le champ
        if (onSuccess) {
          setTimeout(onSuccess, 2000);
        }
      } else {
        setError(result.error || 'Erreur lors de l\'envoi du lien de réinitialisation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className={`max-w-md w-full space-y-8 ${className}`}>
      {showTitle && (
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-clrprincipal">
            Réinitialisation du mot de passe
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Saisissez votre adresse email pour recevoir un lien de réinitialisation
          </p>
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Adresse email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 appearance-none relative block w-full px-3 py-2 border bg-white border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
            placeholder="Entrez votre email"
            disabled={loading}
          />
        </div>

        {/* Messages de statut */}
        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {success}
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Envoi en cours...
              </div>
            ) : (
              'Envoyer le lien de réinitialisation'
            )}
          </button>
        </div>

        {showLoginLink && (
          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-sm text-primary hover:text-primary/80"
            >
              Retour à la connexion
            </button>
          </div>
        )}
      </form>
    </div>
  );
}