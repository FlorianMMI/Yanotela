/**
 * Providers WebSocket pour collaboration YJS
 * Basé sur: facebook/lexical/examples/react-rich-collab/src/providers.ts
 */

import { Provider } from '@lexical/yjs';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

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
 */
export function setAwarenessUserInfo(noteId: string, userName: string, userColor: string) {
  const provider = providerInstances.get(noteId);
  if (!provider) {
    return;
  }

  const awareness = provider.awareness;
  awareness.setLocalStateField('user', {
    name: userName,
    color: userColor,
  });
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

  // Détection auto: prod = wss://domaine/yjs, dev = ws://localhost:1234
  const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
  const wsProtocol = isProd && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = isProd ? window.location.host : 'localhost:1234';
  const wsPath = isProd ? '/yjs' : '';
  const wsUrl = `${wsProtocol}//${wsHost}${wsPath}`;

  const provider = new WebsocketProvider(
    wsUrl,                              // URL du serveur WebSocket YJS
    `yanotela-${id}`,                   // Room name (préfixe + noteId)
    doc,
    {
      connect: false,                   // Ne pas connecter immédiatement (géré par plugin)
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
