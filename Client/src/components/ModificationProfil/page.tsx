"use client";

import React, { useState, useEffect } from "react";
import InputModified from "@/ui/inputModified";
import { ForgotPassword, InfoUser, updateUser, GetNotes, GetFolders } from '@/loader/loader';
import TotalNotes from "@/ui/note/totalNotes";
import TotalFolders from "@/ui/folder/totalFolders";
import { KeyholeIcon, ProfileIcon } from "@/libs/Icons";
import TrashCard from "@/ui/trash/trashCard";
import { useRouter } from "next/navigation";

export default function ModificationProfil() {

  const router = useRouter();
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
  const [totalNotes, setTotalNotes] = useState<number | undefined>(undefined);
  const [totalFolders, setTotalFolders] = useState<number | undefined>(undefined);

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
        void err;
      } finally {
        setPageLoading(false);
      }
    };

    loadUserInfo();
  }, []);

  // Fonction pour sauvegarder un champ spécifique
  const handleFieldSave = async (fieldName: keyof typeof userData, newValue: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: Partial<Record<keyof typeof userData, string>> = {};
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

  useEffect(() => {
    async function fetchTotalNotesAndFolders() {
      try {
        const { totalNotes } = await GetNotes();
        setTotalNotes(totalNotes);
      } catch (error) {
        console.error("Error fetching total notes:", error);
        setTotalNotes(0);
      }

      try {
        const { totalFolders } = await GetFolders();
        setTotalFolders(totalFolders);
      } catch (error) {
        console.error("Error fetching total folders:", error);
        setTotalFolders(0);
      }
    }

    fetchTotalNotesAndFolders();
  }, []);

  return (
    <>
      {pageLoading ? (
        <div className="p-4 flex justify-center items-center md:min-h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col gap-4 items-center md:px-[30%]">

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
                        <svg className="h-5 w-5 text-success-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-success-800">
                          {success}
                        </p>
                      </div>
                      <div className="ml-4 shrink-0">
                        <button className="inline-flex text-success-400 hover:text-success-600">
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
                    className="rounded-md bg-dangerous-50 p-4 border border-dangerous-200 cursor-pointer hover:bg-dangerous-100 transition-colors shadow-lg"
                  >
                    <div className="flex">
                      <div className="shrink-0">
                        <svg className="h-5 w-5 text-dangerous-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
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

          <div className="flex flex-col w-full justify-end items-center">
            <div className="flex items-end justify-center rounded-full h-[100px] w-[100px] border-8 border-primary overflow-hidden">
              <ProfileIcon
                width={80}
                height={80}
                className="text-primary"
              />
            </div>
            <p className="text-xl font-bold">@{userData.pseudo}</p>
            <p className="text-sm text-gray-500">{userData.email}</p>
          </div>

          <div className="flex flex-col gap-3 items-center justify-center w-full max-w-[400px]">
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

            <div className="self-stretch flex justify-between items-center gap-3">
              <p className="md:hidden justify-start text-clrprincipal w-fit font-bold text-base text-sm text-nowrap">
                Mot de passe
              </p>
              <button
                onClick={handleSendConfirmationEmail}
                disabled={loading}
                className="group relative w-[200px] md:w-full md:text-nowrap md:self-center flex justify-center py-2 md:py-3 px-6 border border-transparent text-base md:text-base font-medium rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Envoi en cours...
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <p className="flex flex-row flex-nowrap gap-1">Modifier <span className="hidden md:block">le mot de passe</span></p>
                    <KeyholeIcon  
                      width={20}
                      height={20}
                      className="text-white"
                    />
                  </div>
                )}
              </button>
            </div>
          </div>

            <div className="flex flex-col md:flex-row justify-center gap-4 items-center w-full">
            <div className="flex flex-row gap-4 justify-center">
              <TotalNotes totalNotes={totalNotes} />
              <TotalFolders totalFolders={totalFolders} />
              
            </div>
            <div className="flex flex-row justify-center">
              <TrashCard onClick={() => router.push('/corbeille')} />
            </div>
            </div>

        </div>
      )}
    </>
  );
}
