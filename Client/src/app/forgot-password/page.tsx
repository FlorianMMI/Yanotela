'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Icons from '@/ui/Icon';
import "../globals.css";
import Logo from '@/ui/logo';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setStatus('error');
      setMessage('Veuillez saisir votre adresse email');
      return;
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus('error');
      setMessage('Veuillez saisir une adresse email valide');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      console.log('Envoi demande de réinitialisation pour:', email);
      
      const response = await fetch('http://localhost:3001/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log('Réponse du serveur:', data);

      if (response.ok && data.success) {
        setStatus('success');
        setMessage('Un lien de réinitialisation a été envoyé à votre adresse email.');
        setEmail(''); // Vider le champ
      } else {
        setStatus('error');
        setMessage(data.error || 'Erreur lors de l\'envoi du lien de réinitialisation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setStatus('error');
      setMessage('Erreur de connexion au serveur');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start h-screen p-4 gap-20">
      
        <Logo />
      <div className=' flex flex-col justify-center items-center gap-10'>
        <div className="flex flex-col gap-2 text-center">
            <h2 className="text-3xl font-extrabold text-clrprincipal">
              Réinitialisation du mot de passe
            </h2>
            <p className="text-sm text-clrprincipal">
              Saisissez votre adresse email pour recevoir un lien de réinitialisation
            </p>
          </div>
        

        <form className="flex flex-col gap-6 w-full" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-clrprincipal">
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
              className="appearance-none w-full px-3 py-2 border bg-clrsecondaire border-gray-300 placeholder-gray-500 text-clrprincipal rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Entrez votre email"
              disabled={status === 'loading'}
            />
          </div>

          {/* Messages de statut */}
          {status === 'success' && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex gap-3">
                <svg className="h-5 w-5 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-green-800">
                  {message}
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex gap-3">
                <svg className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-red-800">
                  {message}
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-clrsecondaire"></div>
                Envoi en cours...
              </>
            ) : (
              'Envoyer le lien de réinitialisation'
            )}
          </button>

          
        </form>
        <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-primary hover:text-primary-hover"
            >
              Retour à la connexion
            </Link>
          </div>

          </div>
      
    </div>
  );
}
