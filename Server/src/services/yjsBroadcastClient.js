/**
 * Client WebSocket pour communiquer avec le serveur YJS
 * 
 * Ce service permet au backend Express d'envoyer des notifications
 * au serveur YJS qui les diffusera aux clients connectés.
 * 
 * Architecture :
 * - Le backend ne gère PAS les connexions WebSocket des clients
 * - Le backend envoie les notifications au serveur YJS via HTTP ou WebSocket interne
 * - Le serveur YJS diffuse aux clients connectés
 */

import WebSocket from 'ws';

// URL du serveur YJS (dans Docker: yjs-server:1234, en local: localhost:1234)
const YJS_SERVER_URL = process.env.YJS_SERVER_URL || 'ws://yjs-server:1234';

// Connexions WebSocket par room (pour éviter de recréer à chaque notification)
const connections = new Map();

// File d'attente des notifications en cas de déconnexion
const pendingNotifications = [];

/**
 * Message personnalisé pour les notifications (type=99 pour éviter conflit avec YJS)
 */
const MESSAGE_NOTIFICATION = 99;

/**
 * Encode un message de notification pour le serveur YJS
 * Format: [MESSAGE_NOTIFICATION, JSON stringified notification]
 */
function encodeNotificationMessage(notification) {
  const json = JSON.stringify(notification);
  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(json);
  
  // Format: 1 byte type + JSON
  const message = new Uint8Array(1 + jsonBytes.length);
  message[0] = MESSAGE_NOTIFICATION;
  message.set(jsonBytes, 1);
  
  return message;
}

/**
 * Obtient ou crée une connexion WebSocket vers une room de notifications
 * @param {number} userId - ID de l'utilisateur cible
 * @returns {Promise<WebSocket>} Connexion WebSocket
 */
function getOrCreateConnection(userId) {
  return new Promise((resolve, reject) => {
    const roomName = `yanotela-notifications-${userId}`;
    
    // Vérifier si une connexion existe déjà et est ouverte
    const existing = connections.get(roomName);
    if (existing && existing.readyState === WebSocket.OPEN) {
      return resolve(existing);
    }
    
    // Créer une nouvelle connexion
    const wsUrl = `${YJS_SERVER_URL}/${roomName}`;
    console.log(`🔌 [YJS Client] Connexion à ${wsUrl}`);
    
    const ws = new WebSocket(wsUrl);
    
    ws.on('open', () => {
      console.log(`✅ [YJS Client] Connecté à room: ${roomName}`);
      connections.set(roomName, ws);
      resolve(ws);
    });
    
    ws.on('error', (error) => {
      console.error(`❌ [YJS Client] Erreur connexion ${roomName}:`, error.message);
      connections.delete(roomName);
      reject(error);
    });
    
    ws.on('close', () => {
      console.log(`🔌 [YJS Client] Déconnecté de room: ${roomName}`);
      connections.delete(roomName);
    });
    
    // Timeout de connexion
    setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        ws.terminate();
        reject(new Error('Timeout connexion WebSocket'));
      }
    }, 5000);
  });
}

/**
 * Envoie une notification à un utilisateur via le serveur YJS
 * 
 * @param {number} userId - ID de l'utilisateur cible
 * @param {object} notification - Notification à envoyer
 * @returns {Promise<boolean>} true si envoyé, false sinon
 */
export async function sendNotificationToUser(userId, notification) {
  try {
    const ws = await getOrCreateConnection(userId);
    
    // Encoder et envoyer le message
    const message = encodeNotificationMessage(notification);
    ws.send(message);
    
    console.log(`📤 [YJS Client] Notification envoyée à userId=${userId}, type=${notification.type}`);
    return true;
    
  } catch (error) {
    console.error(`❌ [YJS Client] Échec envoi notification à userId=${userId}:`, error.message);
    
    // Stocker en file d'attente pour retry ultérieur
    pendingNotifications.push({ userId, notification, timestamp: Date.now() });
    
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
  
  console.log(`📡 [YJS Client] Broadcast: ${sent} envoyées, ${failed} échouées`);
  return { sent, failed };
}

/**
 * Ferme toutes les connexions WebSocket
 */
export function closeAllConnections() {
  connections.forEach((ws, roomName) => {
    console.log(`🔌 [YJS Client] Fermeture connexion: ${roomName}`);
    ws.close();
  });
  connections.clear();
}

/**
 * Obtient des stats sur les connexions actives
 */
export function getConnectionStats() {
  return {
    activeConnections: connections.size,
    pendingNotifications: pendingNotifications.length,
  };
}

// Nettoyage à l'arrêt du serveur
process.on('SIGINT', closeAllConnections);
process.on('SIGTERM', closeAllConnections);
