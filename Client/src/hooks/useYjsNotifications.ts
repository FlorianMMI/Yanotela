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

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { 
  connectNotificationProvider, 
  disconnectNotificationProvider, 
  addNotificationListener,
} from '@/collaboration/notificationProvider';
import { cleanupOldDismissedNotifications } from '@/utils/notificationStorageUtils';

// Clé localStorage pour les notifications supprimées
const DISMISSED_NOTIFICATIONS_KEY = 'yanotela_dismissed_notifications';
const NOTIFICATION_PREFS_KEY = 'yanotela_notification_prefs';

/**
 * Charge les IDs des notifications supprimées depuis localStorage
 */
function loadDismissedNotifications(userId: number): Set<string> {
  try {
    const stored = localStorage.getItem(`${DISMISSED_NOTIFICATIONS_KEY}_${userId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Set(parsed);
    }
  } catch (error) {
    
  }
  return new Set();
}

/**
 * Sauvegarde un ID de notification supprimée dans localStorage
 */
function saveDismissedNotification(userId: number, notificationId: string): void {
  try {
    const dismissed = loadDismissedNotifications(userId);
    dismissed.add(notificationId);
    localStorage.setItem(
      `${DISMISSED_NOTIFICATIONS_KEY}_${userId}`,
      JSON.stringify(Array.from(dismissed))
    );
  } catch (error) {
    
  }
}

function getNotificationPrefs() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export type NotificationType = 
  | 'INVITATION' 
  | 'REMOVED' 
  | 'NOTE_DELETED' 
  | 'NOTE_DELETED_ADMIN' 
  | 'NOTE_DELETED_MEMBER' 
  | 'USER_ADDED' 
  | 'ROLE_CHANGED'
  | 'SOMEONE_INVITED'
  | 'COLLABORATOR_REMOVED'
  | 'USER_LEFT'
  | 'COMMENT_ADDED';

interface NotificationSetting {
  code: string;
  name: string;
  description: string;
  appnotif: boolean;
  mailnotif: boolean;
}

function isNotificationEnabled(type: NotificationType, prefs: NotificationSetting[] | null): boolean {
  if (!prefs) return true; // Default to true if no prefs

  let categoryCode = '';
  switch (type) {
    case 'INVITATION':
      categoryCode = 'invitation';
      break;
    case 'REMOVED':
      categoryCode = 'removed';
      break;
    case 'ROLE_CHANGED':
      categoryCode = 'role_changed';
      break;
    case 'SOMEONE_INVITED':
      categoryCode = 'someone_invited';
      break;
    case 'COLLABORATOR_REMOVED':
      categoryCode = 'collaborator_removed';
      break;
    case 'USER_LEFT':
      categoryCode = 'user_left';
      break;
    case 'COMMENT_ADDED':
      categoryCode = 'comment_added';
      break;
    case 'NOTE_DELETED':
    case 'NOTE_DELETED_ADMIN':
    case 'NOTE_DELETED_MEMBER':
      categoryCode = 'note_deleted';
      break;
    default:
      return true;
  }

  const pref = prefs.find((p) => p.code === categoryCode);
  return pref ? pref.appnotif : true;
}

export interface YjsNotification {
  id: string;
  type: NotificationType;
  noteId?: string;
  noteTitle?: string;
  author?: string;
  actorPseudo?: string;
  roleLabel?: string;
  isPromotion?: boolean;
  timestamp: number;
  read: boolean;
  targetUserId?: number;
  // Nouveaux champs pour les notifications spécifiques
  invitedUserPseudo?: string;
  removedUserPseudo?: string;
  leavingUserPseudo?: string;
  commentAuthorPseudo?: string;
  commentPreview?: string;
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
  const [allNotifications, setAllNotifications] = useState<YjsNotification[]>([]);
  const [prefs, setPrefs] = useState<NotificationSetting[] | null>(null);
  const [loading, setLoading] = useState(true);
  const hasInitialized = useRef(false);
  const dismissedNotificationsRef = useRef<Set<string>>(new Set());

  // Charger les préférences
  useEffect(() => {
    const loadPrefs = () => {
        const p = getNotificationPrefs();
        setPrefs(p);
    };
    loadPrefs();
    window.addEventListener('notificationPrefsChanged', loadPrefs);
    return () => window.removeEventListener('notificationPrefsChanged', loadPrefs);
  }, []);

  // Filtrer les notifications
  const notifications = useMemo(() => {
    const filtered = allNotifications.filter(n => {
      const enabled = isNotificationEnabled(n.type, prefs);
      if (!enabled) {
        console.log(`🚫 [Notifications] Filtered out: ${n.type} (prefs:`, prefs?.find(p => p.code === n.type.toLowerCase()), ')');
      }
      return enabled;
    });
    
    return filtered;
  }, [allNotifications, prefs]);

  // Connecter au provider de notifications et charger les invitations initiales
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Éviter double initialisation en Strict Mode
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Charger les notifications supprimées depuis localStorage
    dismissedNotificationsRef.current = loadDismissedNotifications(userId);

    // Nettoyer les anciennes notifications supprimées (> 30 jours ou > 500 entrées)
    cleanupOldDismissedNotifications(userId);

    // 1. Connecter au WebSocket de notifications
    connectNotificationProvider(userId);

    // 2. Écouter les notifications temps réel
    const removeListener = addNotificationListener((realTimeNotifs) => {
      
      setAllNotifications((prev) => {
        
        // Filtrer les notifications supprimées
        const filtered = realTimeNotifs.filter((n) => !dismissedNotificationsRef.current.has(n.id));

        // Fusionner les notifications temps réel avec les existantes
        // en évitant les doublons (par ID)
        const existingIds = new Set(prev.map((n) => n.id));
        const newNotifs = filtered.filter((n) => !existingIds.has(n.id));

        if (newNotifs.length === 0) {
          
          return prev;
        }
        
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
            id: `invitation-${n.id}-${Date.now()}`,
            type: 'INVITATION' as const,
            noteId: n.id,
            noteTitle: n.Titre,
            author: n.author,
            timestamp: Date.now(),
            read: false,
          }));
          
          // Filtrer les invitations supprimées + éviter doublons par noteId
          setAllNotifications((prev) => {
            const existingNoteIds = new Set(prev.filter(n => n.type === 'INVITATION').map((n) => n.noteId));
            const newInvitations = invitations.filter(
              (n) => !existingNoteIds.has(n.noteId)
            );
            
            if (newInvitations.length === 0) return prev;
            return [...prev, ...newInvitations].sort((a, b) => b.timestamp - a.timestamp);
          });
        }
      } catch (error) {
        
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
            id: `invitation-${n.id}-${Date.now()}`,
            type: 'INVITATION' as const,
            noteId: n.id,
            noteTitle: n.Titre,
            author: n.author,
            timestamp: Date.now(),
            read: false,
          }));
          
          // Remplacer les invitations actuelles par celles de l'API (source de vérité)
          // Les invitations de l'API sont basées sur les permissions non acceptées en DB
          // donc on ne filtre PAS par dismissed - la DB est la source de vérité
          setAllNotifications((prev) => {
            console.log(`🔃 [Notifications] Refresh: Current ${prev.length} (${prev.filter(n => n.type === 'INVITATION').length} invitations)`);
            const nonInvitations = prev.filter((n) => n.type !== 'INVITATION');
            const newState = [...nonInvitations, ...invitations].sort((a, b) => b.timestamp - a.timestamp);
            
            return newState;
          });
        }
      } catch (error) {
        
      }
    };

    window.addEventListener('refreshNotifications', handleRefresh);
    return () => window.removeEventListener('refreshNotifications', handleRefresh);
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!userId) return;

    // Si c'est une invitation classique, appeler l'API et supprimer
    if (notificationId.startsWith('invitation-')) {
      // Extraire noteId de 'invitation-{noteId}' ou 'invitation-{noteId}-{timestamp}'
      const parts = notificationId.split('-');
      const noteId = parts[1]; // Le noteId est toujours le 2ème élément
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/notification/accept/${noteId}`, {
          method: 'POST',
          credentials: 'include',
        });
        
        if (response.ok) {
          // Sauvegarder dans localStorage pour éviter réapparition
          saveDismissedNotification(userId, notificationId);
          dismissedNotificationsRef.current.add(notificationId);
          
          // Supprimer la notification de la liste après acceptation
          setAllNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        }
      } catch (error) {
        
      }
    } else {
      // Pour les autres types de notifications, juste marquer comme lue
      setAllNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    }
  }, [userId]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!userId) return;

    // Sauvegarder dans localStorage
    saveDismissedNotification(userId, notificationId);
    dismissedNotificationsRef.current.add(notificationId);

    // Supprimer localement
    setAllNotifications((prev) => prev.filter((n) => n.id !== notificationId));

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
        
      }
    }
  }, [userId]);

  return {
    notifications,
    loading,
    markAsRead,
    deleteNotification,
  };
}
