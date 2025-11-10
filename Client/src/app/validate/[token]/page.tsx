import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import "../../globals.css";
import MobileFlashNoteButton from '@/components/flashnote/MobileFlashNoteButton';

interface ValidatePageProps {
  params: Promise<{
    token: string;
  }>;
}

async function validateToken(token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://yanotela.fr/api';
  
  try {
    const response = await fetch(`${API_URL}/validate/${token}`, {
      method: 'GET',
      cache: 'no-store', // Don't cache validation requests
    });

    const data = await response.json();
    
    return {
      success: response.ok && data.success,
      error: data.error || null,
    };
  } catch (error) {
    console.error('Erreur validation:', error);
    return {
      success: false,
      error: 'Erreur de connexion au serveur',
    };
  }
}

export default async function ValidatePage({ params }: ValidatePageProps) {
  const { token } = await params;
  
  if (!token) {
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
                      Token de validation manquant
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

  const result = await validateToken(token);
  
  if (result.success) {
    // Redirect to notes page on success
    redirect('/notes');
  }

  // Show error page if validation failed
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
                    {result.error || 'Erreur lors de la validation du compte'}
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
