"use client";

import ReturnButton from "@/ui/returnButton";
import React, { useState, useEffect } from "react";
import Icons from "@/ui/Icon";
import InputModified from "@/ui/inputModified";
import { ForgotPassword, InfoUser, updateUser } from '@/loader/loader';

export default function ModificationProfil() {
  const [userData, setUserData] = useState({
    pseudo: "",
    prenom: "",
    nom: "",
    email: ""
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Charger les informations utilisateur au montage du composant
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const result = await InfoUser();
        if (result.success && result.user) {
          setUserData({
            pseudo: result.user.pseudo || "",
            prenom: result.user.prenom || "",
            nom: result.user.nom || "",
            email: result.user.email || ""
          });
        } else {
          setError("Impossible de charger les informations utilisateur");
        }
      } catch (err) {
        setError("Erreur lors du chargement des informations");
      } finally {
        setPageLoading(false);
      }
    };

    loadUserInfo();
  }, []);

  // Fonction pour sauvegarder un champ spécifique
  const handleFieldSave = async (fieldName: string, newValue: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: any = {};
      updateData[fieldName] = newValue;

      const result = await updateUser(updateData);

      if (result.success) {
        // Mettre à jour les données locales
        setUserData(prev => ({
          ...prev,
          [fieldName]: newValue
        }));
        setSuccess(`${fieldName} mis à jour avec succès`);

        // Faire disparaître le message de succès après 3 secondes
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError(result.error || `Erreur lors de la mise à jour de ${fieldName}`);

        // Faire disparaître le message d'erreur après 5 secondes
        setTimeout(() => {
          setError(null);
        }, 5000);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion au serveur');

      // Faire disparaître le message d'erreur après 5 secondes
      setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleSendConfirmationEmail = async () => {
    if (!userData.email) {
      setError('Aucune adresse email trouvée');
      return;
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      setError('L\'adresse email n\'est pas valide');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Envoi de la demande de confirmation
      const result = await ForgotPassword(userData.email);

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


  return (
    <>
      {pageLoading ? (
        <div className="p-4 flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="w-full px-5 py-6 md:px-8 md:py-8 flex flex-col gap-6 md:gap-8 items-center md:items-stretch">

          <div className="flex md:hidden w-full">
            <ReturnButton />
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-12 w-full items-start">

            <div className="flex flex-col gap-4 items-center md:items-start w-full md:w-auto md:min-w-fit">
              <p className="text-clrprincipal font-gant text-center md:text-left text-3xl md:text-4xl w-full md:w-auto">
                Votre profil
              </p>
            </div>

            {/* Zone de notifications */}
            {(success || error) && (
              <div className="fixed top-4 right-4 z-50 max-w-md">
                {success && (
                  <div
                    onClick={() => setSuccess(null)}
                    className="rounded-md bg-green-50 p-4 border border-green-200 cursor-pointer hover:bg-green-100 transition-colors shadow-lg"
                  >
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-green-800">
                          {success}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <button className="inline-flex text-green-400 hover:text-green-600">
                          <span className="sr-only">Fermer</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div
                    onClick={() => setError(null)}
                    className="rounded-md bg-red-50 p-4 border border-red-200 cursor-pointer hover:bg-red-100 transition-colors shadow-lg"
                  >
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-red-800">
                          {error}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <button className="inline-flex text-red-400 hover:text-red-600">
                          <span className="sr-only">Fermer</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-5 w-full md:flex-1">
              <InputModified
                name="Pseudonyme"
                placeholder="pseudo"
                type="pseudo"
                defaultValue={userData.pseudo}
                onSave={(value) => handleFieldSave('pseudo', value)}
              />
              <InputModified
                name="Prénom"
                placeholder="userName"
                type="username"
                defaultValue={userData.prenom}
                onSave={(value) => handleFieldSave('prenom', value)}
              />
              <InputModified
                name="Nom"
                placeholder="Name"
                type="name"
                defaultValue={userData.nom}
                onSave={(value) => handleFieldSave('nom', value)}
              />
              <InputModified
                name="Mail"
                placeholder="Mail"
                type="email"
                defaultValue={userData.email}
                onSave={(value) => handleFieldSave('email', value)}
              />

              <button
                onClick={handleSendConfirmationEmail}
                disabled={loading}
                className="group relative w-full md:w-auto md:self-start flex justify-center py-3 px-6 border border-transparent text-base md:text-base font-medium rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Envoi en cours...
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Modifier le mot de passe</span>
                    <Icons
                      name="keyhole"
                      size={20}
                      className="text-white"
                    />
                  </div>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
