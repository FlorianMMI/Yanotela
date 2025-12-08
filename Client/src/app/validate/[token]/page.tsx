'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import "../../globals.css";
import MobileFlashNoteButton from '@/components/flashnote/MobileFlashNoteButton';

interface ValidatePageProps {
  params: Promise<{ token: string }>;
}

export default function ValidatePage({ params }: ValidatePageProps) {
  const router = useRouter();
  const { token } = use(params);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const validateToken = async () => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://yanotela.fr/api';
      
      try {
        const response = await fetch(`${API_URL}/validate/${token}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
          setStatus('success');
          // Force session check before redirect
          try {
            const checkUrl = `${API_URL.replace(/\/api$/, '')}/auth/check`;
            await fetch(checkUrl, {
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
            });
          } catch (e) {
            // ignore
          }
          setTimeout(() => {
            router.push('/notes');
          }, 1500);
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'Erreur lors de la validation du compte');
        }
      } catch (error) {
        console.error('Erreur validation:', error);
        setStatus('error');
        setErrorMessage('Erreur de connexion au serveur');
      }
    };

    validateToken();
  }, [token, router]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-full flex items-center justify-center">
        <MobileFlashNoteButton />
        
        <div className="max-w-md w-full">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-clrprincipal">
              Validation du compte
            </h2>
            
            <div className="mt-4 flex justify-center">
              <div className="rounded-md bg-info-50 p-4 w-full max-w-sm">
                <div className="flex items-center justify-center">
                  <div className="shrink-0">
                    <svg className="animate-spin h-10 w-10 text-info-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <div className="ml-3 text-center w-full">
                    <p className="text-sm font-medium text-info-800">
                      Validation en cours...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-full flex items-center justify-center">
        <MobileFlashNoteButton />
        
        <div className="max-w-md w-full">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-clrprincipal">
              Validation du compte
            </h2>
            
            <div className="mt-4 flex justify-center">
              <div className="rounded-md bg-success-50 p-4 w-full max-w-sm">
                <div className="flex items-center">
                  <div className="shrink-0">
                    <svg className="h-10 w-10 text-success-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 text-center w-full">
                    <p className="text-sm font-medium text-success-800">
                      Compte validé avec succès !
                    </p>
                    <p className="text-xs text-success-600 mt-1">
                      Redirection en cours...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-full flex items-center justify-center">
      <MobileFlashNoteButton />
      
      <div className="max-w-md w-full">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-clrprincipal">
            Validation du compte
          </h2>
          
          <div className="mt-4 flex justify-center">
            <div className="rounded-md bg-dangerous-50 p-4 w-full max-w-sm">
              <div className="flex items-center">
                <div className="shrink-0">
                  <svg className="h-10 w-10 text-dangerous-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 text-center w-full">
                  <p className="text-sm font-medium text-dangerous-800">
                    {errorMessage || 'Erreur lors de la validation du compte'}
                  </p>
                  <Link
                    href="/"
                    className="mt-2 block text-sm text-dangerous-800 hover:text-dangerous-600 underline"
                  >
                    Retour
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
