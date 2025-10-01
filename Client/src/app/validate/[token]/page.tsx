'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import "../../globals.css";

export default function ValidatePage() {
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const validateAccount = async () => {
      const token = params.token as string;
      
      if (!token) {
        setStatus('error');
        setMessage('Token de validation manquant');
        return;
      }

      try {
        
        // Appeler l'API de validation du backend
        const response = await fetch(`http://localhost:3001/validate/${token}`, {
          method: 'GET',
          credentials: 'include', // Important pour les sessions
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setMessage('Votre compte a été validé avec succès !');
          
          // Rediriger vers la racine après 2 secondes
          setTimeout(() => {
            router.push('/');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Erreur lors de la validation du compte');
        }
      } catch (error) {
        console.error('Erreur validation:', error);
        setStatus('error');
        setMessage(`Erreur de connexion au serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    };

    validateAccount();
  }, [params.token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-clrprincipal">
            Validation du compte
          </h2>
          
          {status === 'loading' && (
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-foreground">
                Validation en cours...
              </p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="mt-4 flex justify-center">
              <div className="rounded-md bg-green-50 p-4 w-full max-w-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-10 w-10 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 text-center w-full">
                    <p className="text-sm font-medium text-green-800">
                      {message}
                    </p>
                      <Link href="/notes" className="mt-2 text-sm text-green-700 hover:text-green-500 underline">
                        Accéder à mes notes
                      </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="mt-4 flex justify-center">
              <div className="rounded-md bg-red-50 p-4 w-full max-w-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-10 w-10 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 text-center w-full">
                    <p className="text-sm font-medium text-red-800">
                      {message}
                    </p>
                    <Link
                      href="/"
                      className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                    >
                      Retour
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
