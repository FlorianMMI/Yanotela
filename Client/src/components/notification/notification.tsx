"use client";

import React, { useState, useEffect } from "react";
import { NotificationRow } from "@/ui/choose-notif";

interface NotificationSetting {
  id: string; // 'activity' | 'invitation' | 'comment'
  name: string;
  description?: string;
  appnotif: boolean;
  mailnotif: boolean;
}

const NOTIFICATION_PREFS_KEY = 'yanotela_notification_prefs';

export default function NotificationPage() {
  // État initial des notifications
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: "activity",
      name: "Activité sur les notes",
      description: "Suppressions de notes, ajouts de membres...",
      appnotif: true,
      mailnotif: false,
    },
    {
      id: "invitation",
      name: "Partage de notes",
      description: "Invitations, exclusions, changements de rôle",
      appnotif: true,
      mailnotif: true,
    },
    {
      id: "comment",
      name: "Commentaires",
      description: "Nouveaux commentaires sur vos notes",
      appnotif: false,
      mailnotif: true,
    },
  ]);

  // Sauvegarde de l'état initial pour détecter les modifications
  const [initialNotifications, setInitialNotifications] = useState<NotificationSetting[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialiser l'état de référence au montage
  useEffect(() => {
    const loadPrefs = () => {
      try {
        const stored = localStorage.getItem(NOTIFICATION_PREFS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Merge stored prefs with default structure to ensure all fields exist
          setNotifications(prev => prev.map(def => {
            const saved = parsed.find((p: any) => p.id === def.id);
            return saved ? { ...def, ...saved, name: def.name, description: def.description } : def;
          }));
        }
      } catch (e) {
        
      } finally {
        setIsLoading(false);
      }
    };

    loadPrefs();
  }, []);

  // Update initialNotifications when loading is done
  useEffect(() => {
    if (!isLoading) {
      setInitialNotifications(JSON.parse(JSON.stringify(notifications)));
    }
  }, [isLoading]); // Only run when loading finishes

  // Détecter les modifications
  useEffect(() => {
    if (isLoading) return;
    const changed = JSON.stringify(notifications) !== JSON.stringify(initialNotifications);
    setHasChanges(changed);
  }, [notifications, initialNotifications, isLoading]);

  // Gestionnaire pour "Toutes les notifications"
  const handleToggleAll = (type: 'app' | 'mail', value: boolean) => {
    setNotifications((prev) =>
      prev.map((notif) => ({
        ...notif,
        [type === 'app' ? 'appnotif' : 'mailnotif']: value,
      }))
    );
  };

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
      // Save to localStorage
      const prefsToSave = notifications.map(n => ({
        id: n.id,
        appnotif: n.appnotif,
        mailnotif: n.mailnotif
      }));

      localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefsToSave));

      // Dispatch event for other components (like useYjsNotifications)
      window.dispatchEvent(new Event('notificationPrefsChanged'));

      // Mettre à jour l'état initial après sauvegarde réussie
      setInitialNotifications(JSON.parse(JSON.stringify(notifications)));
      setHasChanges(false);

    } catch (error) {
      
    } finally {
      setIsSaving(false);
    }
  };

  // Calculer si tout est activé/désactivé pour les toggles globaux
  const allAppEnabled = notifications.every(n => n.appnotif);
  const allMailEnabled = notifications.every(n => n.mailnotif);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg">Chargement des préférences...</div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      {/* En-têtes */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b">
        <div className="flex-1 text-xl font-semibold">
          Type de notification
        </div>
        <div className="w-12 text-center text-sm">
          Par
          <br />
          mail
        </div>
        <div className="w-12 text-center text-sm">
          Par
          <br />
          l&apos;app
        </div>
      </div>

      <div className="h-96 overflow-y-auto custom-scrollbar">

        {/* Ligne "Toutes les notifications" */}
        <div className="mb-6 pb-4 border-b border-dashed">
          <NotificationRow
            id="all"
            name="Toutes les notifications"
            description="Activer ou désactiver toutes les notifications d'un seul coup"
            appnotif={allAppEnabled}
            mailnotif={allMailEnabled}
            onAppNotifChange={(_, value) => handleToggleAll('app', value)}
            onMailNotifChange={(_, value) => handleToggleAll('mail', value)}
          />
        </div>

        {/* Liste des notifications */}
        <div className="space-y-4">
          {notifications.map((notif) => (
            <NotificationRow
              key={notif.id}
              id={notif.id}
              name={notif.name}
              description={notif.description}
              appnotif={notif.appnotif}
              mailnotif={notif.mailnotif}
              onAppNotifChange={handleAppNotifChange}
              onMailNotifChange={handleMailNotifChange}
            />
          ))}
        </div>
      </div>
      {/* Bouton de sauvegarde */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${hasChanges && !isSaving
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
