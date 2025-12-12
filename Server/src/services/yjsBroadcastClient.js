/**
 * Client WebSocket pour communiquer avec le serveur YJS
 * 
 * Ce service permet au backend Express d'envoyer des notifications
 * au serveur YJS qui les diffusera aux clients connectés via l'Awareness.
 * 
 * Architecture :
 * - Le backend agit comme un client YJS (WebsocketProvider)
 * - Il se connecte aux rooms de notifications des utilisateurs
 * - Il met à jour son état Awareness avec les notifications
 */

import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';
import WebSocket from 'ws';

// URL du serveur YJS (dans Docker: yjs-server:1234, en local: localhost:1234)
// IMPORTANT: Utiliser le nom du SERVICE (pas du container) pour la résolution DNS Docker
const YJS_SERVER_URL = process.env.YJS_SERVER_URL || 'ws://yjs-server:1234';

console.log(`🌐 [YJS Client] URL serveur YJS configurée: ${YJS_SERVER_URL}`);

// Providers par room (pour éviter de recréer à chaque notification)
const providers = new Map();

/**
 * Obtient ou crée un provider YJS pour une room de notifications
 * @param {number} userId - ID de l'utilisateur cible
 * @returns {WebsocketProvider} Provider YJS
 */
function getOrCreateProvider(userId) {
  const roomName = `yanotela-notifications-${userId}`;
  
  let provider = providers.get(roomName);
  if (provider) {
    return provider;
  }
  
  console.log(`🔌 [YJS Client] Création provider pour room: ${roomName} sur ${YJS_SERVER_URL}`);
  
  const doc = new Y.Doc();
  provider = new WebsocketProvider(
    YJS_SERVER_URL,
    roomName,
    doc,
    { 
      WebSocketPolyfill: WebSocket,
      connect: true,
      resyncInterval: 10000,
      maxBackoffTime: 5000,
    }
  );
  
  provider.on('status', ({ status }) => {
    console.log(`📡 [YJS Client] Status room ${roomName}: ${status}`);
  });
  
  provider.on('connection-error', (error) => {
    console.error(`❌ [YJS Client] Erreur connexion room ${roomName}:`, error.message);
  });
  
  provider.on('connection-close', () => {
    console.warn(`⚠️ [YJS Client] Connexion fermée pour room ${roomName}`);
  });
  
  providers.set(roomName, provider);
  return provider;
}

/**
 * Envoie une notification à un utilisateur via le serveur YJS (Awareness)
 * 
 * @param {number} userId - ID de l'utilisateur cible
 * @param {object} notification - Notification à envoyer
 * @returns {Promise<boolean>} true si envoyé
 */
export async function sendNotificationToUser(userId, notification) {
  try {
    const provider = getOrCreateProvider(userId);
    
    // Attendre que la connexion soit établie (critique pour garantir l'envoi)
    if (!provider.wsconnected) {
      console.log(`⏳ [YJS Client] Attente connexion pour room: yanotela-notifications-${userId}`);
      await new Promise(resolve => {
        const onStatus = ({ status }) => {
          if (status === 'connected') {
            console.log(`✅ [YJS Client] Connexion établie pour room: yanotela-notifications-${userId}`);
            provider.off('status', onStatus);
            resolve();
          }
        };
        provider.on('status', onStatus);
        // Timeout de sécurité augmenté à 5s
        setTimeout(() => {
            console.warn(`⏱️ [YJS Client] Timeout connexion pour room: yanotela-notifications-${userId}`);
            provider.off('status', onStatus);
            resolve(); 
        }, 5000);
      });
    }

    // Récupérer les notifications existantes dans l'awareness local
    const currentLocalState = provider.awareness.getLocalState();
    const currentNotifications = currentLocalState?.notifications || [];
    
    // Ajouter la nouvelle notification
    // On garde un historique limité pour s'assurer que le client a le temps de la recevoir
    const updatedNotifications = [...currentNotifications, notification];
    
    // Limiter à 20 notifications pour éviter de surcharger l'awareness
    if (updatedNotifications.length > 20) {
      updatedNotifications.splice(0, updatedNotifications.length - 20);
    }
    
    // Mettre à jour l'awareness
    provider.awareness.setLocalStateField('notifications', updatedNotifications);
    
    console.log(`📤 [YJS Client] Notification envoyée à userId=${userId} via Awareness`);
    return true;
    
  } catch (error) {
    console.error(`❌ [YJS Client] Échec envoi notification à userId=${userId}:`, error.message);
    return false;
  }
}

/**
 * Envoie une notification à plusieurs utilisateurs
 * 
 * @param {number[]} userIds - IDs des utilisateurs cibles
 * @param {object} notification - Notification à envoyer
 * @returns {Promise<{sent: number, failed: number}>}
 */
export async function broadcastNotificationToUsers(userIds, notification) {
  let sent = 0;
  let failed = 0;
  
  for (const userId of userIds) {
    // Personnaliser la notification avec le targetUserId
    const userNotification = { ...notification, targetUserId: userId };
    const success = await sendNotificationToUser(userId, userNotification);
    if (success) sent++;
    else failed++;
  }

  return { sent, failed };
}

/**
 * Ferme toutes les connexions WebSocket
 */
export function closeAllConnections() {
  providers.forEach((provider, roomName) => {
    console.log(`🔌 [YJS Client] Fermeture provider: ${roomName}`);
    provider.disconnect();
    provider.destroy();
  });
  providers.clear();
}

/**
 * Obtient des stats sur les connexions actives
 */
export function getConnectionStats() {
  return {
    activeConnections: providers.size,
    pendingNotifications: 0, // Plus utilisé avec cette implémentation
  };
}

// Nettoyage à l'arrêt du serveur
process.on('SIGINT', closeAllConnections);
process.on('SIGTERM', closeAllConnections);
