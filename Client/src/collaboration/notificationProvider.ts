/**
 * Provider WebSocket dédié aux notifications temps réel
 * 
 * Ce provider se connecte à une room globale "yanotela-notifications-{userId}"
 * pour recevoir les notifications en temps réel sans polling HTTP.
 * 
 * Architecture :
 * - Une seule connexion WebSocket par utilisateur (pas par note)
 * - Utilise le même serveur YJS que la collaboration
 * - Les notifications sont diffusées via l'awareness YJS
 */

import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

// Instance singleton du provider de notifications
let notificationProvider: WebsocketProvider | null = null;
let notificationDoc: Y.Doc | null = null;
let currentUserId: number | null = null;

// Callbacks pour les listeners de notifications
type NotificationListener = (notifications: NotificationData[]) => void;
const notificationListeners = new Set<NotificationListener>();

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

export interface NotificationData {
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
 * Connecte l'utilisateur à la room de notifications globale
 * @param userId - ID de l'utilisateur connecté
 */
export function connectNotificationProvider(userId: number): void {
  // Si déjà connecté avec le même userId, ne rien faire
  if (notificationProvider && currentUserId === userId) {
    
    return;
  }

  // Déconnecter l'ancien provider si présent
  disconnectNotificationProvider();

  currentUserId = userId;

  // Créer le Y.Doc pour les notifications
  notificationDoc = new Y.Doc();

  // Détection auto: prod = wss://domaine/yjs/, dev = ws://localhost:1234
  const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
  const wsProtocol = isProd && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = isProd ? window.location.host : 'localhost:1234';
  const wsPath = isProd ? '/yjs/' : ''; // Slash final pour éviter redirect
  const wsUrl = `${wsProtocol}//${wsHost}${wsPath}`;

  console.log(`🔔 [NotificationProvider] Connexion à: ${wsUrl} (room: yanotela-notifications-${userId})`);

  // Créer le provider WebSocket pour la room de notifications
  notificationProvider = new WebsocketProvider(
    wsUrl,
    `yanotela-notifications-${userId}`, // Room unique par utilisateur
    notificationDoc,
    {
      connect: true,              // Connexion automatique
      resyncInterval: 10000,       // Resync toutes les 10s (même fréquence que collaboration)
      maxBackoffTime: 5000,        // Reconnexion rapide
      disableBc: false,            // Activer BroadcastChannel pour sync entre tabs
    }
  );

  // Écouter les changements d'awareness (notifications entrantes)
  notificationProvider.awareness.on('change', () => {
    handleAwarenessChange();
  });

  // Logs pour debugging
  notificationProvider.on('status', ({ status }: { status: string }) => {
    
  });

  // Premier check au démarrage
  handleAwarenessChange();
}

/**
 * Déconnecte le provider de notifications
 */
export function disconnectNotificationProvider(): void {
  if (notificationProvider) {
    
    notificationProvider.disconnect();
    notificationProvider.destroy();
    notificationProvider = null;
  }

  if (notificationDoc) {
    notificationDoc.destroy();
    notificationDoc = null;
  }

  currentUserId = null;
}

// Interface pour l'état awareness
interface AwarenessState {
  notifications?: NotificationData[];
  user?: { name: string; color: string; id?: number };
}

/**
 * Gère les changements d'awareness et extrait les notifications
 */
function handleAwarenessChange(): void {
  if (!notificationProvider) return;

  const awareness = notificationProvider.awareness;
  const states = awareness.getStates() as Map<number, AwarenessState>;
  const allNotifications: NotificationData[] = [];
  const seenIds = new Set<string>();

  // Parcourir tous les états d'awareness
  states.forEach((state: AwarenessState, clientId: number) => {
    if (state.notifications && Array.isArray(state.notifications)) {
      state.notifications.forEach((notif: NotificationData) => {
        // Filtrer pour cet utilisateur et éviter les doublons
        // Aussi accepter les notifications sans targetUserId (anciennes notifications)
        if ((!notif.targetUserId || notif.targetUserId === currentUserId) && !seenIds.has(notif.id)) {
          seenIds.add(notif.id);
          allNotifications.push(notif);
          console.log(`📩 [NotificationProvider] Notification reçue: ${notif.type} (id: ${notif.id}, client: ${clientId})`);
        }
      });
    }
  });

  // Log pour debugging si aucune notification
  if (allNotifications.length === 0) {
    console.log(`[NotificationProvider] Aucune notification trouvée (${states.size} états awareness)`);
  }

  // Trier par timestamp (plus récent en premier)
  allNotifications.sort((a, b) => b.timestamp - a.timestamp);

  // Notifier tous les listeners
  notificationListeners.forEach((listener) => {
    listener(allNotifications);
  });
}

/**
 * Ajoute un listener pour les notifications
 * @param listener - Callback appelé quand les notifications changent
 * @returns Fonction pour retirer le listener
 */
export function addNotificationListener(listener: NotificationListener): () => void {
  notificationListeners.add(listener);
  
  // Appeler immédiatement avec l'état actuel
  if (notificationProvider) {
    handleAwarenessChange();
  }

  return () => {
    notificationListeners.delete(listener);
  };
}

/**
 * Vérifie si le provider est connecté
 */
export function isNotificationProviderConnected(): boolean {
  return notificationProvider !== null && notificationProvider.wsconnected;
}

/**
 * Obtient le provider actuel (pour debugging)
 */
export function getNotificationProvider(): WebsocketProvider | null {
  return notificationProvider;
}
