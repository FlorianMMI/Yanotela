/**
 * Hook pour gérer les notifications via YJS Awareness
 * 
 * Écoute les changements d'awareness pour recevoir les notifications en temps réel
 * sans polling HTTP. Les notifications sont transmises via le WebSocket YJS existant.
 * 
 * Types de notifications supportés :
 * - INVITATION : Invitation à collaborer sur une note
 * - REMOVED : Exclusion d'une note partagée
 * - NOTE_DELETED : Note collaborative supprimée
 * - USER_ADDED : Utilisateur ajouté à une note
 * - ROLE_CHANGED : Promotion/rétrogradation de rôle
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  connectNotificationProvider, 
  disconnectNotificationProvider, 
  addNotificationListener,
} from '@/collaboration/notificationProvider';

export interface YjsNotification {
  id: string;
  type: 'INVITATION' | 'REMOVED' | 'NOTE_DELETED' | 'USER_ADDED' | 'ROLE_CHANGED';
  noteId?: string;
  noteTitle?: string;
  author?: string;
  actorPseudo?: string;
  roleLabel?: string;
  isPromotion?: boolean;
  timestamp: number;
  read: boolean;
  targetUserId?: number;
}

/**
 * Hook pour écouter les notifications via YJS Awareness
 * 
 * @param userId - ID de l'utilisateur connecté
 * @returns notifications - Liste des notifications
 * @returns loading - Chargement initial
 * @returns markAsRead - Fonction pour marquer une notification comme lue
 * @returns deleteNotification - Fonction pour supprimer une notification
 */
export function useYjsNotifications(userId?: number) {
  const [notifications, setNotifications] = useState<YjsNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const hasInitialized = useRef(false);

  // Connecter au provider de notifications et charger les invitations initiales
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Éviter double initialisation en Strict Mode
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // 1. Connecter au WebSocket de notifications
    connectNotificationProvider(userId);

    // 2. Écouter les notifications temps réel
    const removeListener = addNotificationListener((realTimeNotifs) => {
      setNotifications((prev) => {
        // Fusionner les notifications temps réel avec les existantes
        // en évitant les doublons (par ID)
        const existingIds = new Set(prev.map((n) => n.id));
        const newNotifs = realTimeNotifs.filter((n) => !existingIds.has(n.id));
        
        if (newNotifs.length === 0) return prev;
        
        const merged = [...prev, ...newNotifs];
        // Trier par timestamp (plus récent en premier)
        return merged.sort((a, b) => b.timestamp - a.timestamp);
      });
    });

    // 3. Charger les invitations existantes depuis l'API (au cas où non connecté avant)
    const fetchExistingInvitations = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/notification/get`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const invitations: YjsNotification[] = (data.notes || []).map((n: { id: string; Titre: string; author: string }) => ({
            id: `invitation-${n.id}`,
            type: 'INVITATION' as const,
            noteId: n.id,
            noteTitle: n.Titre,
            author: n.author,
            timestamp: Date.now(),
            read: false,
          }));
          
          // Ajouter les invitations existantes (éviter doublons)
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const newInvitations = invitations.filter((n) => !existingIds.has(n.id));
            if (newInvitations.length === 0) return prev;
            return [...prev, ...newInvitations].sort((a, b) => b.timestamp - a.timestamp);
          });
        }
      } catch (error) {
        console.error('[useYjsNotifications] Erreur chargement invitations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingInvitations();

    // Cleanup à la déconnexion
    return () => {
      removeListener();
      disconnectNotificationProvider();
      hasInitialized.current = false;
    };
  }, [userId]);

  // Écouter l'événement personnalisé pour forcer le rafraîchissement
  useEffect(() => {
    const handleRefresh = async () => {
      if (!userId) return;
      
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/notification/get`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const invitations: YjsNotification[] = (data.notes || []).map((n: { id: string; Titre: string; author: string }) => ({
            id: `invitation-${n.id}`,
            type: 'INVITATION' as const,
            noteId: n.id,
            noteTitle: n.Titre,
            author: n.author,
            timestamp: Date.now(),
            read: false,
          }));
          
          // Remplacer les invitations actuelles
          setNotifications((prev) => {
            const nonInvitations = prev.filter((n) => n.type !== 'INVITATION');
            return [...nonInvitations, ...invitations].sort((a, b) => b.timestamp - a.timestamp);
          });
        }
      } catch (error) {
        console.error('[useYjsNotifications] Erreur refresh:', error);
      }
    };

    window.addEventListener('refreshNotifications', handleRefresh);
    return () => window.removeEventListener('refreshNotifications', handleRefresh);
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    // Marquer comme lue localement
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );

    // Si c'est une invitation classique, appeler l'API
    if (notificationId.startsWith('invitation-')) {
      const noteId = notificationId.replace('invitation-', '');
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/notification/accept/${noteId}`, {
          method: 'POST',
          credentials: 'include',
        });
        
        if (response.ok) {
          // Supprimer la notification de la liste après acceptation
          setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        }
      } catch (error) {
        console.error('[markAsRead] Erreur:', error);
      }
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    // Supprimer localement
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

    // Si c'est une invitation classique, appeler l'API
    if (notificationId.startsWith('invitation-')) {
      const noteId = notificationId.replace('invitation-', '');
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        await fetch(`${apiUrl}/notification/refuse/${noteId}`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        console.error('[deleteNotification] Erreur:', error);
      }
    }
  }, []);

  return {
    notifications,
    loading,
    markAsRead,
    deleteNotification,
  };
}
