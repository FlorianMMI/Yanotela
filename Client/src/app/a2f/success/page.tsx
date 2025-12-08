"use client";

import { useRouter } from 'next/navigation';

export default function A2FSuccessPage() {
  const router = useRouter();

  return (
    <div className="h-full flex items-center justify-center bg-background">
      <div className="max-w-auto sm:max-w-2xl mx-0 sm:mx-auto h-full sm:h-auto p-6 flex flex-col gap-4 items-center justify-center bg-white rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-xl font-bold text-clrprincipal text-center">
          Données envoyées avec succès
        </h1>
        <p className="text-center text-gray-700 text-sm">
          Votre identité a été vérifiée avec succès. Vous pouvez maintenant fermer cette fenêtre et retourner à votre profil.
        </p>
        <p className="text-center text-gray-700 text-sm">
          Les données demandées ont été envoyées à votre adresse e-mail.
        </p>
        <button 
          className="bg-primary text-white px-6 py-2 rounded hover:bg-clrprincipal-dark"
          type="submit"
          onClick={
            () => router.push('/profil')
          }
        >
          Retourner au profil
        </button>
      </div>
    </div>
  )
}
