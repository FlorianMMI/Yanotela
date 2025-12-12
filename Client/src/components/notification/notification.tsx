"use client";

import React, { useState, useEffect } from "react";
import { NotificationRow } from "@/ui/choose-notif";
import { 
  NotificationSetting, 
  NotificationPreferenceResponse,
  NotificationPreferenceUpdate 
} from "@/type/NotificationPreference";

export default function NotificationPage() {
  const [notifications, setNotifications] = useState<NotificationSetting[]>([]);
  const [initialNotifications, setInitialNotifications] = useState<NotificationSetting[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les préférences depuis l'API au montage
  useEffect(() => {
    loadPreferences();
  }, []);

  // Fonction pour charger les préférences depuis l'API
  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/notification-preference/get`, {
        method: 'GET',
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const prefs: NotificationPreferenceResponse[] = await response.json();
        
        // Convertir les préférences en format NotificationSetting pour l'UI
        const notifSettings: NotificationSetting[] = prefs.map(pref => ({
          code: pref.code,
          name: pref.name,
          description: pref.description || '',
          appnotif: pref.appEnabled,
          mailnotif: pref.mailEnabled,
        }));

        setNotifications(notifSettings);
        setInitialNotifications(JSON.parse(JSON.stringify(notifSettings)));
      } else {
        console.error('Erreur lors du chargement des préférences');
      }
    } catch (error) {
      console.error('Erreur de chargement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Détecter les modifications
  useEffect(() => {
    if (initialNotifications.length === 0) return;
    
    const changed = JSON.stringify(notifications) !== JSON.stringify(initialNotifications);
    setHasChanges(changed);
  }, [notifications, initialNotifications]);

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
  const handleAppNotifChange = (code: string, value: boolean) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.code === code ? { ...notif, appnotif: value } : notif
      )
    );
  };

  // Gestionnaire pour les notifications par mail
  const handleMailNotifChange = (code: string, value: boolean) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.code === code ? { ...notif, mailnotif: value } : notif
      )
    );
  };

  // Fonction de sauvegarde
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      // Construire le tableau de mises à jour
      const updates: NotificationPreferenceUpdate[] = notifications.map(notif => ({
        code: notif.code,
        appEnabled: notif.appnotif,
        mailEnabled: notif.mailnotif,
      }));
      
      const response = await fetch(`${apiUrl}/notification-preference/update`, {
        method: 'PUT',
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        // Mettre à jour l'état initial après sauvegarde réussie
        setInitialNotifications(JSON.parse(JSON.stringify(notifications)));
        setHasChanges(false);
        console.log('✅ Préférences de notifications sauvegardées avec succès');
      } else {
        console.error('❌ Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('❌ Erreur de sauvegarde:', error);
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
    <div className="mb-2">
      {/* En-têtes */}
      <div className="flex items-center gap-4 mb-3 pb-4 border-b">
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

      <div className="max-h-50 overflow-y-auto custom-scrollbar">

      {/* Ligne "Toutes les notifications" */}
      <div className="mb-3 pb-4 border-b border-dashed">
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
            key={notif.code}
            id={notif.code}
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
      <div className="mt-2 flex justify-end">
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
