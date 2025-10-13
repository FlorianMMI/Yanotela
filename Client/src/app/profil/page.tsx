"use client";
import React from "react";
import InfoProfil from "@/components/infoprofil/page";
import Image from "next/image";
import { GetNotes, InfoUser } from "@/loader/loader";
import { useEffect, useState } from "react";
import Logout from "@/ui/logout";
import TotalNotes from "@/ui/note/totalNotes";
import Icons from "@/ui/Icon";
import ModificationProfil from "@/components/ModificationProfil/page";
import ParamModal from "@/components/infoprofil/paramModal";
import { AnimatePresence } from "motion/react";
// import Notification from "@/ui/notification";


interface UserInfo {
  id: number;
  pseudo: string;
  prenom?: string;
  nom?: string;
  email: string;
  noteCount?: number;
}

export default function Profil() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalNotes, setTotalNotes] = useState<number | undefined>(undefined);
  const [isParamModalOpen, setIsParamModalOpen] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await InfoUser();

        if (response.success && response.user) {
          setUserInfo(response.user);
        } else {
          setError(
            response.error || "Erreur lors de la récupération des informations"
          );
        }
      } catch (err) {
        setError("Erreur de connexion");
        console.error("Erreur:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  useEffect(() => {
    async function fetchTotalNotes() {
      try {
        const { totalNotes } = await GetNotes();
        setTotalNotes(totalNotes);
      } catch (error) {
        console.error("Error fetching total notes in Home page:", error);
        setTotalNotes(0);
      }
    }

    fetchTotalNotes();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-fondpage">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement des informations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-fondpage">
        <div className="text-center text-red-600">
          <p>Erreur: {error}</p>
        </div>
      </div>
    );
  }

  const displayName =
    userInfo?.prenom && userInfo?.nom
      ? `${userInfo.prenom} ${userInfo.nom}`
      : userInfo?.pseudo || "Utilisateur";


  const openParamModal = () => {
    setIsParamModalOpen(true);
  };

  const closeParamModal = () => {
    setIsParamModalOpen(false);
  };

  return (
    <>
      <div className="min-h-screen py-4 md:px-8 px-0 flex flex-col bg-fondpage">
        {/* Boutons settings et déconnexion alignés en haut */}
        <div className=" flex-row justify-end items-center w-full px-8">
          <div className=" items-center" title="Paramètres du compte"
            onClick={openParamModal}
          >
            <Icons
              name="settings"
              size={35}
              className="cursor-pointer rounded-lg p-2 hover:bg-primary hover:text-white hover:shadow-md transition-all duration-300"
            />
          </div>

          {/* <div>
            <Icons 
              name='notification'
              size={35}
              className="ml-4 cursor-pointer rounded-lg p-2 hover:bg-primary hover:text-white hover:shadow-md transition-all duration-300"

            />
          </div> */}

        </div>

        {/* Contenu centré et réparti */}
        <div className="flex-1 flex flex-col justify-between items-center text-center w-full">

          <div className="flex md:hidden">
            {userInfo && (
              <InfoProfil
                name={displayName}
                pseudo={userInfo.pseudo}
                email={userInfo.email}
              />
            )}
          </div>

          <div className="hidden md:flex w-full">
            <ModificationProfil />
          </div>

          <div className="flex flex-col md:flex-row gap-8 w-full p-4 md:w-full md:items-start items-center mb-6">

            <div className="flex flex-col gap-4 items-center w-fit">
              <p className="text-clrprincipal font-gant text-center text-2xl w-full">
                Vos notes
              </p>
            </div>

            <div className="flex flex-col gap-4 items-center w-full">
              <TotalNotes totalNotes={totalNotes} />
            </div>

            {/* Bouton déconnexion mobile en bas */}
            <div className="flex flex-col items-center justify-center w-full max-w-1/2">
              <Logout />
            </div>

          </div>

        </div>

      </div>

      <AnimatePresence>
        {isParamModalOpen && (
          <ParamModal onClose={closeParamModal} />
        )}
      </AnimatePresence>


    </>
  );
}