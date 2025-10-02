"use client";

import ReturnButton from "@/ui/returnButton";
import React, { useState } from "react";
import Icons from "@/ui/Icon";
import InputModified from "@/ui/inputModified";
import { ForgotPassword } from '@/loader/loader';

export default function ModificationProfil() {
  const [userEmail, setUserEmail] = useState("ethan@example.com");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSendConfirmationEmail = async () => {
    if (!userEmail) {
      setError('Aucune adresse email trouvée');
      return;
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      setError('L\'adresse email n\'est pas valide');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Envoi de la demande de confirmation
      const result = await ForgotPassword(userEmail);
      
      if (result.success) {
        setSuccess('Un mail de confirmation a été envoyé à votre adresse email.');
      } else {
        setError(result.error || 'Erreur lors de l\'envoi du mail de confirmation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailUpdate = (newEmail: string) => {
    setUserEmail(newEmail);
    // Reset des messages quand l'email change
    setError(null);
    setSuccess(null);
  };
  

  return (
    <>
      <div className="p-4 flex flex-col gap-6 items-center">
        <ReturnButton />
        <div className="flex flex-col gap-8 w-fit items-center">
          <h1 className="text-clrprincipal font-gant text-center text-4xl">
            Modifier le profil
          </h1>
          {/*email*/}
          <InputModified 
            name="Pseudonyme"
            placeholder="pseudo"
            type="pseudo"
            defaultValue="Ethan02"
          />
          <InputModified 
            name="Prénom"
            placeholder="userName"
            type="username"
            defaultValue="Ethan"
          />
          <InputModified 
            name="Nom"
            placeholder="Name"
            type="name"
            defaultValue="Manchon"
          />
          <InputModified 
            name="Mail"
            placeholder="Mail"
            type="email"
            defaultValue={userEmail}
            onSave={handleEmailUpdate}
          />

          {/* Messages de statut */}
          {success && (
            <div className="w-full rounded-md bg-green-50 p-4">
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
            <div className="w-full rounded-md bg-red-50 p-4">
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

          <button 
            onClick={handleSendConfirmationEmail}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-3 py-2 px-4 bg-primary text-white border border-red-700 rounded-xl shadow-md hover:bg-red-700 hover:border-red-800 hover:text-white hover:shadow-lg transition-all cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <p>Envoi en cours...</p>
              </>
            ) : (
              <>
                <p>Modifier le mot de passe</p>
                <Icons
                  name="keyhole"
                  size={20}
                  className="text-white"
                />
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
