"use client";
import React from "react";
import InfoProfil from "@/components/infoprofil/page";
import Image from "next/image";
import { GetNotes, InfoUser, GetFolders } from "@/loader/loader";
import { useEffect, useState } from "react";
import Logout from "@/ui/logout";
import TotalNotes from "@/ui/note/totalNotes";
import TotalFolders from "@/ui/folder/totalFolders";
import Icons from "@/ui/Icon";
import ModificationProfil from "@/components/ModificationProfil/page";
import ParamModal from "@/components/infoprofil/paramModal";
import { AnimatePresence } from "motion/react";
// import Notification from "@/ui/notification";
import NotificationList from "@/components/notificationList/page";
import ReturnButton from "@/ui/returnButton";
import ThemeSelector from "@/components/theme/themeSelector";

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
        <div className="text-center text-dangerous-800">
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
        {/* Boutons settings, thème et notifications alignés en haut */}
        <div className="flex flex-row justify-between items-center w-full px-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-fit" title="Paramètres du compte"
              onClick={openParamModal}
            >
              <Icons
                name="settings"
                size={35}
                className="cursor-pointer rounded-lg p-2 hover:bg-primary hover:text-white hover:shadow-md transition-all duration-300"
              />
            </div>
            
            {/* Sélecteur de thème */}
            <ThemeSelector />
          </div>

          <div className="md:hidden flex relative">
            <NotificationList isOpenSideBar={true} />
          </div>
        </div>

        {/* Contenu centré et réparti */}
        <div className="flex-1 flex flex-col justify-start gap-12 items-center text-center w-full">

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
                Vos contenus
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-center md:w-full md:justify-between">
            <div className="flex flex-col items-end justify-center">
              <Logout />
            </div>
            <div className="cursor-pointer flex gap-2 items-center" title="Paramètres du compte"
              onClick={openParamModal}
            >
              <p className="font-normal text-md hidden md:block">Paramètres</p>
              <Icons
                name="settings"
                size={20}
              />
            </div>
          </div>
        </div>

        
        <ModificationProfil />

      </div>

      <AnimatePresence>
        {isParamModalOpen && (
          <ParamModal onClose={closeParamModal} />
        )}
      </AnimatePresence>

    </>
  );
}
