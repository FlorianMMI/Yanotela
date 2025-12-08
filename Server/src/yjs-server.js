/**
 * Serveur YJS WebSocket unifié pour Yanotela
 * 
 * Ce serveur gère TOUT sur un seul WebSocket :
 * ✅ Collaboration temps réel (édition Lexical partagée)
 * ✅ Notifications temps réel (via Awareness)
 * ✅ Sync YJS complet (utilise y-websocket/bin/utils)
 * 
 * Architecture :
 * - Un seul serveur WebSocket (port 1234)
 * - Protocole YJS complet (sync + awareness + updates)
 * - Enregistre les providers pour les notifications
 * - Gère la persistance automatique
 */

import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness.js';
import * as syncProtocol from 'y-protocols/sync.js';
import * as awarenessProtocol from 'y-protocols/awareness.js';
import * as encoding from 'lib0/encoding.js';
import * as decoding from 'lib0/decoding.js';
import { registerProvider, unregisterProvider, registerNotificationRoom, unregisterNotificationRoom } from './services/yjsNotificationService.js';

const PORT = process.env.PORT || 1234;
const HOST = process.env.HOST || '0.0.0.0';

// Message types du protocole YJS
const messageSync = 0;
const messageAwareness = 1;
const messageNotification = 99; // Message personnalisé pour les notifications du backend

/**
 * Map des documents YJS + Awareness par room
 * Structure: Map<roomName, { doc: Y.Doc, awareness: Awareness, conns: Set<WebSocket> }>
 */
const rooms = new Map();

/**
 * Obtenir ou créer une room complète (doc + awareness + connexions)
 */
function getOrCreateRoom(roomName) {
  let room = rooms.get(roomName);
  if (!room) {
    const doc = new Y.Doc();
    const awareness = new Awareness(doc);
    
    room = {
      doc,
      awareness,
      conns: new Set(),
    };
    
    rooms.set(roomName, room);
    console.log(`📄 [YJS] Room créée: ${roomName}`);
    
    // Enregistrer dans le service de notifications
    if (isNotificationRoom(roomName)) {
      // Room de notifications pour un utilisateur
      const userId = extractUserIdFromNotificationRoom(roomName);
      if (userId) {
        registerNotificationRoom(userId, { awareness, doc, roomName, conns: room.conns });
        console.log(`🔔 [YJS] Room de notifications enregistrée pour userId: ${userId}`);
      }
    } else {
      // Room de collaboration pour une note
      const noteId = extractNoteIdFromRoom(roomName);
      if (noteId) {
        registerProvider(noteId, { awareness, doc, roomName, noteId });
        console.log(`✅ [YJS] Provider enregistré pour noteId: ${noteId}`);
      }
    }
  }
  return room;
}

/**
 * Extraire noteId depuis le nom de la room
 * Format attendu: yanotela-{noteId}
 */
function extractNoteIdFromRoom(roomName) {
  const match = roomName.match(/^yanotela-(.+)$/);
  return match ? match[1] : null;
}

/**
 * Vérifie si une room est une room de notifications
 * Format: yanotela-notifications-{userId}
 */
function isNotificationRoom(roomName) {
  return roomName.startsWith('yanotela-notifications-');
}

/**
 * Extraire userId depuis le nom d'une room de notifications
 * Format attendu: yanotela-notifications-{userId}
 */
function extractUserIdFromNotificationRoom(roomName) {
  const match = roomName.match(/^yanotela-notifications-(\d+)$/);
  return match ? parseInt(match[1]) : null;
}

/**
 * Envoyer un message YJS à une connexion WebSocket
 */
function send(conn, message) {
  if (conn.readyState !== conn.OPEN) {
    return;
  }
  conn.send(message, (err) => {
    if (err) {
      console.error('❌ [YJS] Erreur envoi message:', err);
    }
  });
}

/**
 * Gérer une nouvelle connexion WebSocket
 */
function setupWSConnection(ws, req) {
  // Extraire le nom de la room depuis l'URL
  // Format y-websocket standard: ws://host:port/roomName (ex: /yanotela-abc123)
  // OU format query param: ws://host:port?room=roomName
  console.log(`📥 [YJS] Connexion entrante: ${req.url}`);
  
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // Essayer d'abord le path (format standard y-websocket)
  let roomName = url.pathname.substring(1); // Enlever le premier "/"
  
  // Sinon essayer query param (format alternatif)
  if (!roomName || roomName === '') {
    roomName = url.searchParams.get('room');
  }

  console.log(`🔍 [YJS] Room extraite: "${roomName}" (path: "${url.pathname}", query: "${url.searchParams.get('room')}")`);

  if (!roomName || roomName === '') {
    console.warn('❌ [YJS] Connexion sans room, fermeture');
    ws.close(1008, 'Room name required');
    return;
  }

  console.log(`🔌 [YJS] Nouvelle connexion pour room: ${roomName}`);

  // Obtenir ou créer la room
  const room = getOrCreateRoom(roomName);
  const { doc, awareness, conns } = room;
  
  // Ajouter la connexion à la room
  conns.add(ws);
  ws.roomName = roomName;

  // ===== ÉTAPE 1 : SYNC INITIAL =====
  // Envoyer l'état complet du document au client
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeSyncStep1(encoder, doc);
  send(ws, encoding.toUint8Array(encoder));

  // Écouter les updates du document et broadcaster
  const updateHandler = (update, origin) => {
    if (origin !== ws) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageSync);
      syncProtocol.writeUpdate(encoder, update);
      const message = encoding.toUint8Array(encoder);
      
      // Envoyer à tous les autres clients de la room
      conns.forEach((conn) => {
        if (conn !== ws) {
          send(conn, message);
        }
      });
    }
  };
  doc.on('update', updateHandler);

  // ===== ÉTAPE 2 : AWARENESS =====
  // Envoyer l'état awareness initial au client
  const awarenessStates = awareness.getStates();
  if (awarenessStates.size > 0) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageAwareness);
    encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(
      awareness,
      Array.from(awarenessStates.keys())
    ));
    send(ws, encoding.toUint8Array(encoder));
  }

  // Écouter les changements d'awareness et broadcaster
  const awarenessChangeHandler = ({ added, updated, removed }, origin) => {
    const changedClients = added.concat(updated).concat(removed);
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageAwareness);
    encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(
      awareness,
      changedClients
    ));
    const message = encoding.toUint8Array(encoder);
    
    // Envoyer à tous les autres clients de la room
    conns.forEach((conn) => {
      send(conn, message);
    });
  };
  awareness.on('update', awarenessChangeHandler);

  // ===== ÉTAPE 3 : MESSAGES ENTRANTS =====
  ws.on('message', (data) => {
    try {
      const dataArray = new Uint8Array(data);
      const messageType = dataArray[0];

      // ===== NOTIFICATION DU BACKEND (type=99) =====
      if (messageType === messageNotification) {
        // Décoder le JSON de notification
        const jsonBytes = dataArray.slice(1);
        const decoder = new TextDecoder();
        const notification = JSON.parse(decoder.decode(jsonBytes));
        
        console.log(`📥 [YJS] Notification reçue du backend:`, notification.type, `pour user=${notification.targetUserId}`);
        
        // Broadcaster la notification via awareness à tous les clients de cette room
        const localState = awareness.getLocalState() || {};
        const notifications = localState.notifications || [];
        notifications.push(notification);
        awareness.setLocalStateField('notifications', notifications);
        
        // IMPORTANT: Encoder et broadcaster manuellement le changement d'awareness
        // car setLocalStateField ne déclenche pas automatiquement le broadcast
        const awarenessEncoder = encoding.createEncoder();
        encoding.writeVarUint(awarenessEncoder, messageAwareness);
        encoding.writeVarUint8Array(
          awarenessEncoder,
          awarenessProtocol.encodeAwarenessUpdate(awareness, [doc.clientID])
        );
        const awarenessMessage = encoding.toUint8Array(awarenessEncoder);
        
        // Envoyer à tous les clients connectés
        conns.forEach((conn) => {
          send(conn, awarenessMessage);
        });
        
        console.log(`📡 [YJS] Notification broadcastée à ${conns.size} clients dans room ${roomName}`);
        return;
      }

      // ===== MESSAGES YJS STANDARD =====
      const decoder = decoding.createDecoder(dataArray);
      const encoder = encoding.createEncoder();
      const yjsMessageType = decoding.readVarUint(decoder);

      switch (yjsMessageType) {
        case messageSync: {
          // Message de synchronisation YJS
          encoding.writeVarUint(encoder, messageSync);
          syncProtocol.readSyncMessage(decoder, encoder, doc, ws);
          
          if (encoding.length(encoder) > 1) {
            send(ws, encoding.toUint8Array(encoder));
          }
          break;
        }
        
        case messageAwareness: {
          // Message d'awareness (curseurs, sélections, notifications)
          awarenessProtocol.applyAwarenessUpdate(
            awareness,
            decoding.readVarUint8Array(decoder),
            ws
          );
          break;
        }
        
        default:
          console.warn(`⚠️ [YJS] Type de message inconnu: ${yjsMessageType}`);
      }
    } catch (error) {
      console.error('❌ [YJS] Erreur traitement message:', error);
    }
  });

  // ===== ÉTAPE 4 : DÉCONNEXION =====
  ws.on('close', () => {
    console.log(`🔌 [YJS] Déconnexion de room: ${roomName}`);
    
    // Supprimer la connexion
    conns.delete(ws);
    
    // Nettoyer les listeners
    doc.off('update', updateHandler);
    awareness.off('update', awarenessChangeHandler);
    
    // Si plus personne dans la room, nettoyer complètement
    if (conns.size === 0) {
      if (isNotificationRoom(roomName)) {
        // Room de notifications
        const userId = extractUserIdFromNotificationRoom(roomName);
        if (userId) {
          unregisterNotificationRoom(userId);
          console.log(`🧹 [YJS] Room de notifications désenregistrée pour userId: ${userId}`);
        }
      } else {
        // Room de collaboration
        const noteId = extractNoteIdFromRoom(roomName);
        if (noteId) {
          unregisterProvider(noteId);
          console.log(`🧹 [YJS] Provider désenregistré pour noteId: ${noteId}`);
        }
      }
      
      rooms.delete(roomName);
      doc.destroy();
      awareness.destroy();
      
      console.log(`🧹 [YJS] Room nettoyée: ${roomName}`);
    }
  });

  ws.on('error', (error) => {
    console.error('❌ [YJS] Erreur WebSocket:', error);
  });
}

/**
 * Démarrer le serveur WebSocket
 */
function startServer() {
  const wss = new WebSocketServer({ 
    host: HOST,
    port: PORT,
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      clientNoContextTakeover: true,
      serverNoContextTakeover: true,
      serverMaxWindowBits: 10,
      concurrencyLimit: 10,
      threshold: 1024
    }
  });

  wss.on('connection', setupWSConnection);

  wss.on('error', (error) => {
    console.error('❌ [YJS] Erreur serveur WebSocket:', error);
  });

  console.log(`🚀 [YJS] Serveur WebSocket unifié démarré sur ${HOST}:${PORT}`);
  console.log(`📝 [YJS] Collaboration temps réel : ACTIVÉE`);
  console.log(`🔔 [YJS] Notifications temps réel : ACTIVÉES`);
  console.log(`📡 [YJS] Protocole YJS complet (sync + awareness)`);
}

// Gérer l'arrêt gracieux
process.on('SIGINT', () => {
  console.log('\n👋 [YJS] Arrêt du serveur...');
  rooms.forEach((room) => {
    room.doc.destroy();
    room.awareness.destroy();
  });
  rooms.clear();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 [YJS] Arrêt du serveur...');
  rooms.forEach((room) => {
    room.doc.destroy();
    room.awareness.destroy();
  });
  rooms.clear();
  process.exit(0);
});

// Démarrer le serveur
startServer();
