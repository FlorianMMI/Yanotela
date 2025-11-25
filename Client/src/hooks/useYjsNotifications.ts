/**
 * Hook pour gérer les notifications via YJS Awareness
 * 
 * Écoute les changements d'awareness pour recevoir les notifications en temps réel
 * sans polling HTTP. Les notifications sont transmises via le WebSocket YJS existant.
 * 
 * Types de notifications supportés :
 * - INVITATION : Invitation classique (Permission.isAccepted=false)
 * - REMOVED : Exclusion d'une note partagée
 * - NOTE_DELETED : Note collaborative supprimée
 * - USER_ADDED : Utilisateur ajouté à une note
 * - ROLE_CHANGED : Promotion/rétrogradation de rôle
 */

import { useEffect, useState, useCallback } from 'react';
import { providerInstances } from '@/collaboration/providers';

/**
 * Interface pour les invitations classiques retournées par l'API
 */
interface ClassicInvitationNote {
  id: string;
  Titre: string;
  author: string;
}

/**
 * Interface pour la réponse de l'API /notification/get
 */
interface NotificationApiResponse {
  notes: ClassicInvitationNote[];
}

/**
 * Interface pour l'état awareness YJS
 */
interface AwarenessState {
  user?: {
    name: string;
    id: number;
    color: string;
  };
  notifications?: YjsNotification[];
}

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

  // Charger les invitations classiques au montage
  useEffect(() => {
    if (!userId) return;

    const fetchClassicInvitations = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/notification/get`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json() as NotificationApiResponse;
          const invitations: YjsNotification[] = (data.notes || []).map((n) => ({
            id: `invitation-${n.id}`,
            type: 'INVITATION' as const,
            noteId: n.id,
            noteTitle: n.Titre,
            author: n.author,
            timestamp: Date.now(),
            read: false,
          }));
          setNotifications(invitations);
        }
      } catch (error) {
        console.error('[useYjsNotifications] Erreur chargement invitations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassicInvitations();
  }, [userId]);

  // Écouter les changements d'awareness sur tous les providers actifs
  useEffect(() => {
    if (!userId) return;

    const handleAwarenessChange = () => {
      // Récupérer les notifications depuis l'awareness de tous les providers
      const allNotifications: YjsNotification[] = [];
      const seenIds = new Set<string>();

      providerInstances.forEach((provider) => {
        const awareness = provider.awareness;
        const states = awareness.getStates() as Map<number, AwarenessState>;

        states.forEach((state) => {
          // Vérifier si cet état contient des notifications pour notre utilisateur
          if (state.notifications && Array.isArray(state.notifications)) {
            const userNotifications = state.notifications.filter(
              (n) => n.targetUserId === userId && !seenIds.has(n.id)
            );
            
            // Ajouter les IDs vus pour éviter les doublons
            userNotifications.forEach((n) => seenIds.add(n.id));
            allNotifications.push(...userNotifications);
          }
        });
      });

      // Fusionner avec les invitations classiques existantes
      setNotifications((prev) => {
        const invitations = prev.filter((n) => n.type === 'INVITATION');
        // Trier par timestamp décroissant (plus récent en premier)
        const merged = [...invitations, ...allNotifications];
        return merged.sort((a, b) => b.timestamp - a.timestamp);
      });
    };

    // Écouter les changements sur tous les providers existants
    const listeners: Array<() => void> = [];
    providerInstances.forEach((provider) => {
      provider.awareness.on('change', handleAwarenessChange);
      listeners.push(() => provider.awareness.off('change', handleAwarenessChange));
    });

    // Appeler une fois pour récupérer l'état courant des providers
    // (utile si les providers sont déjà connectés au montage)
    try {
      handleAwarenessChange();
    } catch (err) {
      console.error('[useYjsNotifications] Initial awareness fetch error:', err);
    }

    // Écouter l'événement personnalisé pour forcer le rafraîchissement
    const handleRefresh = () => {
      handleAwarenessChange();
    };
    window.addEventListener('refreshNotifications', handleRefresh);

    return () => {
      listeners.forEach((cleanup) => cleanup());
      window.removeEventListener('refreshNotifications', handleRefresh);
    };
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
