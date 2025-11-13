"use client";
import React from "react";
import { GetNotes, InfoUser, GetFolders } from "@/loader/loader";
import { useEffect, useState } from "react";
import Logout from "@/ui/logout";
import Icons from "@/ui/Icon";
import ModificationProfil from "@/components/ModificationProfil/page";
import ParamModal from "@/components/infoprofil/paramModal";
import { AnimatePresence } from "motion/react";
// import Notification from "@/ui/notification";
import NotificationList from "@/components/notificationList/page";
import ReturnButton from "@/ui/returnButton";

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
      <div className="flex justify-center items-center min-h-full bg-fondpage">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement des informations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-full bg-fondpage">
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
      <div className="relative h-full md:h-full flex flex-col gap-4 bg-fondpage">
        {/* Boutons settings et déconnexion alignés en haut */}
        <div className="flex-shrink-0 px-4 pt-4 w-full flex justify-between items-center">
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

        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
          <ModificationProfil />
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