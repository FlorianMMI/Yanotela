"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Verify2FA } from '@/loader/loader';

export default function A2FPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const result = await Verify2FA(code);
      if (result.success) {
        router.push('/a2f/success');
      } else {
        setError(result.error || 'Code A2F invalide. Veuillez réessayer.');
      }
    } catch (error) {
      setError('Une erreur est survenue. Veuillez réessayer plus tard.');
      
    }
  }

  return (
    <form className="h-full flex items-center justify-center bg-background">
      <div className="max-w-auto sm:max-w-2xl mx-0 sm:mx-auto h-full sm:h-auto p-6 flex flex-col gap-4 items-center justify-center bg-white rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-xl font-bold text-clrprincipal text-center">
          Authentification à deux facteurs (A2F)
        </h1>
        <p className="text-center text-gray-700 text-sm">
          Pour votre sécurité, nous devons vérifier votre identité à l&apos;aide de l&apos;authentification à deux facteurs (A2F).
        </p>
        <p className="text-center text-gray-700 text-sm">
          Nous vous avons envoyé un code de vérification à 6 chiffres à l&apos;adresse e-mail associée à votre compte.
        </p>
        <p className="text-center text-gray-700">
          Veuillez entrer ce code ci-dessous pour continuer.
        </p>
        {
          error && <p className="text-red-500 text-sm">{error}</p>
        }
        <input 
          type="text"
          maxLength={6}
          className="border border-gray-300 rounded px-4 py-2 w-48 text-center text-lg my-2"
          placeholder="Entrez le code A2F"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button 
          className="bg-primary text-white px-6 py-2 rounded hover:bg-clrprincipal-dark"
          type="submit"
          onClick={handleSubmit}
        >
          Vérifier
        </button>
      </div>
    </form>
  )
}
