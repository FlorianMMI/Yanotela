"use client";

import ReturnButton from "@/ui/returnButton";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Icons from "@/ui/Icon";
import InputModified from "@/ui/inputModified";
import { ForgotPassword, InfoUser, updateUser } from '@/loader/loader';
import { CheckIcon, CloseIcon, KeyholeIcon } from "@/libs/Icons";

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
  const hasFetched = useRef(false);

  const loadUserInfo = useCallback(async () => {
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
  }, []);

  // Charger les informations utilisateur au montage du composant
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadUserInfo();
  }, [loadUserInfo]);

  // Fonction pour sauvegarder un champ spécifique
    const handleFieldSave = async (fieldName: keyof typeof userData, newValue: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: Partial<typeof userData> = {};
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
        <div className="p-4 flex justify-center items-center min-h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="p-4 flex flex-col gap-6 items-center">
          <ReturnButton />
          <div className="flex flex-col gap-8 w-fit items-center">
            <h1 className="text-clrprincipal font-gant text-center text-4xl">
              Modifier le profil
            </h1>

            {/* Zone de notifications */}
            {(success || error) && (
              <div className="fixed top-4 right-4 z-50 max-w-md pl-4">
                {success && (
                  <div 
                    onClick={() => setSuccess(null)}
                    className="rounded-md bg-success-50 p-4 border border-success-200 cursor-pointer hover:bg-success-100 transition-colors shadow-lg"
                  >
                    <div className="flex">
                      <div className="shrink-0">
                        <CheckIcon className="h-5 w-5 text-success-400" />
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-success-800">
                          {success}
                        </p>
                      </div>
                      <div className="ml-4 shrink-0">
                        <button className="inline-flex text-success-400 hover:text-success-600">
                          <span className="sr-only">Fermer</span>
                          <CloseIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div 
                    onClick={() => setError(null)}
                    className="rounded-md bg-dangerous-50 p-4 border border-dangerous-200 cursor-pointer hover:bg-dangerous-100 transition-colors shadow-lg"
                  >
                    <div className="flex">
                      <div className="shrink-0">
                        <CloseIcon className="h-5 w-5 text-dangerous-400" />
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-dangerous-800">
                          {error}
                        </p>
                      </div>
                      <div className="ml-4 shrink-0">
                        <button className="inline-flex text-dangerous-400 hover:text-dangerous-600">
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
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Envoi en cours...
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>Modifier le mot de passe</span>
                <KeyholeIcon className="text-white w-5 h-5" />
              </div>
            )}
          </button>
          </div>
        </div>
      )}
    </>
  );
}
