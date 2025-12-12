/**
 * Providers WebSocket pour collaboration YJS
 * Basé sur: facebook/lexical/examples/react-rich-collab/src/providers.ts
 */

import { Provider } from '@lexical/yjs';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';
import { AutoAcceptPermission } from '@/loader/loader';

/**
 * Map globale des providers pour accès depuis les composants UI
 * Key: noteId, Value: WebsocketProvider instance
 */
export const providerInstances = new Map<string, WebsocketProvider>();

/**
 * Map globale des documents YJS pour accès depuis les plugins
 * Key: noteId, Value: Y.Doc instance
 */
export const yjsDocuments = new Map<string, Y.Doc>();

/**
 * Définir les informations utilisateur dans l'awareness d'un provider
 * 
 * @param noteId - ID de la note
 * @param userName - Nom de l'utilisateur
 * @param userColor - Couleur du curseur
 * @param userId - ID de l'utilisateur
 * @returns true si le provider existe et a été mis à jour, false sinon
 */
export function setAwarenessUserInfo(noteId: string, userName: string, userColor: string, userId?: number): boolean {
  const provider = providerInstances.get(noteId);
  if (!provider) {
    // Ne pas logger en mode warning - c'est normal que le provider n'existe pas encore
    // pendant l'initialisation (il sera créé par CollaborationPlugin)
    return false;
  }

  const awareness = provider.awareness;
  awareness.setLocalStateField('user', {
    name: userName,
    color: userColor,
    id: userId, // Inclure l'userId pour la synchronisation
  });

  // ✅ CRITIQUE: Connecter le provider APRÈS avoir configuré l'awareness
  // Ceci garantit que les autres clients reçoivent immédiatement les bonnes informations
  if (!provider.wsconnected && !provider.wsconnecting) {
    provider.connect();
  }

  // AUTO-SYNC: Appeler le serveur pour auto-accepter la permission si nécessaire
  if (userId) {
    autoAcceptPermissionOnJoin(noteId).catch(err => {
      
    });
  }
  
  return true;
}

/**
 * Auto-accepte une permission quand l'utilisateur rejoint une note
 * Déclenche aussi le rafraîchissement des notifications côté client
 * 
 * @param noteId - ID de la note rejointe
 */
async function autoAcceptPermissionOnJoin(noteId: string): Promise<void> {
  try {
    const result = await AutoAcceptPermission(noteId);
    
    // Si une permission a été auto-acceptée, rafraîchir les notifications
    if (result.success && result.autoAccepted) {

      // Déclencher le rafraîchissement des notifications en temps réel
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refreshNotifications'));
      }
    }
  } catch (error) {
    
  }
}

/**
 * Factory pour créer un WebSocket provider YJS
 * 
 * @param id - Identifiant unique du document (noteId)
 * @param yjsDocMap - Map partagée des documents YJS (gérée par LexicalCollaboration)
 * @returns Provider configuré pour la collaboration temps réel
 */
export function createWebsocketProvider(
  id: string,
  yjsDocMap: Map<string, Y.Doc>,
): Provider {
  const doc = getDocFromMap(id, yjsDocMap);

  // Détection auto: prod = wss://domaine/yjs/, dev = ws://localhost:1234
  const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
  const wsProtocol = isProd && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = isProd ? window.location.host : 'localhost:1234';
  const wsPath = isProd ? '/yjs/' : ''; // Slash final requis pour éviter 301 redirect
  const wsUrl = `${wsProtocol}//${wsHost}${wsPath}`;

  const provider = new WebsocketProvider(
    wsUrl,                              // URL du serveur WebSocket YJS
    `yanotela-${id}`,                   // Room name (préfixe + noteId)
    doc,
    {
      connect: false,                   // Ne pas connecter immédiatement - attendre que l'awareness soit configurée
      // Paramètres de reconnexion
      resyncInterval: 10000,            // Resync toutes les 10s
      maxBackoffTime: 10000,            // Délai max entre reconnexions
      disableBc: false,                 // Activer BroadcastChannel pour tabs locales
    },
  );

  // Stocker le provider pour accès depuis les composants UI
  providerInstances.set(id, provider);
  
  // Stocker le document YJS pour accès depuis les plugins de sync
  yjsDocuments.set(id, doc);

  return provider as unknown as Provider;
}

/**
 * Obtenir ou créer un Y.Doc depuis la map
 * 
 * @param id - Identifiant du document
 * @param yjsDocMap - Map des documents YJS
 * @returns Y.Doc pour ce document
 */
function getDocFromMap(id: string, yjsDocMap: Map<string, Y.Doc>): Y.Doc {
  let doc = yjsDocMap.get(id);

  if (doc === undefined) {
    doc = new Y.Doc();
    yjsDocMap.set(id, doc);
  } else {
    // Charger depuis IndexedDB si persisté localement
    doc.load();
  }

  return doc;
}
