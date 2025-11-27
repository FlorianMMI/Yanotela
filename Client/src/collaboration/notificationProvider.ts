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

export interface NotificationData {
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
 * Connecte l'utilisateur à la room de notifications globale
 * @param userId - ID de l'utilisateur connecté
 */
export function connectNotificationProvider(userId: number): void {
  // Si déjà connecté avec le même userId, ne rien faire
  if (notificationProvider && currentUserId === userId) {
    console.log('[NotifProvider] Déjà connecté pour user', userId);
    return;
  }

  // Déconnecter l'ancien provider si présent
  disconnectNotificationProvider();

  console.log('[NotifProvider] Connexion pour user', userId);
  currentUserId = userId;

  // Créer le Y.Doc pour les notifications
  notificationDoc = new Y.Doc();

  // Détection auto: prod = wss://domaine/yjs, dev = ws://localhost:1234
  const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
  const wsProtocol = isProd && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = isProd ? window.location.host : 'localhost:1234';
  const wsPath = isProd ? '/yjs' : '';
  const wsUrl = `${wsProtocol}//${wsHost}${wsPath}`;

  // Créer le provider WebSocket pour la room de notifications
  notificationProvider = new WebsocketProvider(
    wsUrl,
    `yanotela-notifications-${userId}`, // Room unique par utilisateur
    notificationDoc,
    {
      connect: true,
      resyncInterval: 30000, // Resync toutes les 30s (moins fréquent que les notes)
      maxBackoffTime: 10000,
      disableBc: true, // Pas de BroadcastChannel pour les notifications
    }
  );

  // Écouter les changements d'awareness (notifications entrantes)
  notificationProvider.awareness.on('change', () => {
    handleAwarenessChange();
  });

  // Logs pour debugging
  notificationProvider.on('status', ({ status }: { status: string }) => {
    console.log(`[NotifProvider] Status: ${status}`);
  });

  // Premier check au démarrage
  handleAwarenessChange();
}

/**
 * Déconnecte le provider de notifications
 */
export function disconnectNotificationProvider(): void {
  if (notificationProvider) {
    console.log('[NotifProvider] Déconnexion pour user', currentUserId);
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
  states.forEach((state: AwarenessState) => {
    if (state.notifications && Array.isArray(state.notifications)) {
      state.notifications.forEach((notif: NotificationData) => {
        // Filtrer pour cet utilisateur et éviter les doublons
        if (notif.targetUserId === currentUserId && !seenIds.has(notif.id)) {
          seenIds.add(notif.id);
          allNotifications.push(notif);
        }
      });
    }
  });

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
