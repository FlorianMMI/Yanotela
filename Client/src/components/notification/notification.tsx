"use client";

import React, { useState, useEffect } from "react";
import { NotificationRow } from "@/ui/choose-notif";

interface NotificationSetting {
  id: string;
  name: string;
  appnotif: boolean;
  mailnotif: boolean;
}

const NOTIFICATION_PREFS_KEY = 'yanotela_notification_prefs';

export default function NotificationPage() {
  // État initial des notifications
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: "invitation",
      name: "Invitations et partages",
      appnotif: true,
      mailnotif: true,
    },
    {
      id: "comment",
      name: "Commentaires",
      appnotif: true,
      mailnotif: true,
    },
    {
      id: "activity",
      name: "Activités sur mes notes",
      appnotif: true,
      mailnotif: true,
    },
  ]);

  // Sauvegarde de l'état initial pour détecter les modifications
  const [initialNotifications, setInitialNotifications] = useState<NotificationSetting[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Charger depuis localStorage au montage
  useEffect(() => {
    const savedPrefs = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        // Fusionner avec les défauts pour garder les nouveaux types si ajoutés
        setNotifications(prev => prev.map(p => {
          const saved = parsed.find((s: NotificationSetting) => s.id === p.id);
          return saved ? { ...p, ...saved } : p;
        }));
      } catch (e) {
        console.error("Erreur lecture préférences notifications", e);
      }
    }
  }, []);

  // Mettre à jour initialNotifications après le chargement initial (ou changement)
  useEffect(() => {
    // On ne met à jour initialNotifications que si c'est la première fois (chargement)
    // ou après une sauvegarde réussie (géré dans handleSave)
    if (initialNotifications.length === 0 && notifications.length > 0) {
       setInitialNotifications(JSON.parse(JSON.stringify(notifications)));
    }
  }, [notifications, initialNotifications]); // Dépendance simplifiée, attention à la boucle infinie si mal géré

  // Détecter les modifications
  useEffect(() => {
    if (initialNotifications.length === 0) return;
    
    const changed = JSON.stringify(notifications) !== JSON.stringify(initialNotifications);
    setHasChanges(changed);
  }, [notifications, initialNotifications]);

  // Gestionnaire pour les notifications par app
  const handleAppNotifChange = (id: string, value: boolean) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, appnotif: value } : notif
      )
    );
    
  };

  // Gestionnaire pour les notifications par mail
  const handleMailNotifChange = (id: string, value: boolean) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, mailnotif: value } : notif
      )
    );
    
  };

  // Fonction de sauvegarde
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Sauvegarde locale
      localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(notifications));
      
      // Simuler un délai réseau pour l'UX
      await new Promise(resolve => setTimeout(resolve, 500));

      setInitialNotifications(JSON.parse(JSON.stringify(notifications)));
      setHasChanges(false);
      
      // Déclencher un événement pour que les autres composants se mettent à jour
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notificationPrefsChanged'));
      }
      
      console.log('Notifications sauvegardées avec succès (local)');
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    

        <div className="">
          {/* En-têtes */}
          <div className="flex items-center gap-4 mb-6 pb-4 border-b">
            <div className="flex-1 text-xl font-semibold ">
              Type de notification
            </div>
            <div className="w-12 text-center text-sm ">
              Par
              <br />
              mail
            </div>
            <div className="w-12 text-center text-sm ">
              Par
              <br />
              l&apos;app
            </div>
          </div>

          {/* Liste des notifications */}
          <div className="space-y-4">
            {notifications.map((notif) => (
              <NotificationRow
                key={notif.id}
                id={notif.id}
                name={notif.name}
                appnotif={notif.appnotif}
                mailnotif={notif.mailnotif}
                onAppNotifChange={handleAppNotifChange}
                onMailNotifChange={handleMailNotifChange}
              />
            ))}
          </div>

          {/* Bouton de sauvegarde */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                hasChanges && !isSaving
                  ? 'bg-primary text-white hover:bg-primary/90 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSaving ? 'Sauvegarde en cours...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
  );
}
