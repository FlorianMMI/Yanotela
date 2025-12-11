"use client";

import React, { useState, useEffect } from "react";
import { NotificationRow } from "@/ui/choose-notif";

interface NotificationSetting {
  id: string;
  name: string;
  appnotif: boolean;
  mailnotif: boolean;
}

export default function NotificationPage() {
  // État initial des notifications
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: "1",
      name: "Recherche de notes",
      appnotif: true,
      mailnotif: false,
    },
    {
      id: "2",
      name: "Partage de notes",
      appnotif: true,
      mailnotif: true,
    },
    {
      id: "3",
      name: "Commentaires",
      appnotif: false,
      mailnotif: true,
    },
  ]);

  // Sauvegarde de l'état initial pour détecter les modifications
  const [initialNotifications, setInitialNotifications] = useState<NotificationSetting[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialiser l'état de référence au montage
  useEffect(() => {
    setInitialNotifications(JSON.parse(JSON.stringify(notifications)));
  }, []);

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
      // TODO: Remplacer par votre appel API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/notification/update-all`, {
        method: 'PUT',
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifications: notifications.map(n => ({
            id: n.id,
            appnotif: n.appnotif ? 1 : 0,
            mailnotif: n.mailnotif ? 1 : 0,
          }))
        })
      });

      if (response.ok) {
        // Mettre à jour l'état initial après sauvegarde réussie
        setInitialNotifications(JSON.parse(JSON.stringify(notifications)));
        setHasChanges(false);
        
        // Notification de succès (optionnel)
        console.log('Notifications sauvegardées avec succès');
      } else {
        console.error('Erreur lors de la sauvegarde');
      }
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
