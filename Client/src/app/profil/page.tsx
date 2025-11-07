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
import { useTheme, ThemeType } from "@/hooks/useTheme";

interface UserInfo {
  id: number;
  pseudo: string;
  prenom?: string;
  nom?: string;
  email: string;
  noteCount?: number;
  theme?: string;
}

export default function Profil() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isParamModalOpen, setIsParamModalOpen] = useState(false);
  const { loadThemeFromUser } = useTheme();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await InfoUser();

        if (response.success && response.user) {
          setUserInfo(response.user);
          
          // Charger le thème de l'utilisateur depuis la base de données
          if (response.user.theme) {
            loadThemeFromUser(response.user.theme as ThemeType);
          }
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
        <div className="text-center text-dangerous-600">
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
      <div className="relative h-screen md:h-full flex flex-col gap-4 bg-fondpage p-4">
        {/* Boutons settings et déconnexion alignés en haut */}
        <div className="absolute top-4 left-0 px-4 w-full flex justify-between items-center">
          <div className="md:hidden flex gap-1 items-center">

            <div className="flex items-center justify-center">
              <NotificationList isOpenSideBar={true} />
            </div>
          </div>
          <div className="flex gap-4 items-center md:w-full md:justify-between">
             <div className="cursor-pointer flex gap-2 items-center" title="Paramètres du compte"
              onClick={openParamModal}
            >
              <Icons
                name="settings"
                size={20}
              />
              <p className="font-normal text-md hidden md:block">Paramètres</p>
            </div>
            <div className="flex flex-col items-end justify-center">
              <Logout />
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