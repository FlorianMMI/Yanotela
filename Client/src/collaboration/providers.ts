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
 * Définir les informations utilisateur dans l'awareness d'un provider
 * 
 * @param noteId - ID de la note
 * @param userName - Nom de l'utilisateur
 * @param userColor - Couleur du curseur
 */
export function setAwarenessUserInfo(noteId: string, userName: string, userColor: string) {
  const provider = providerInstances.get(noteId);
  if (!provider) {
    console.warn(`[setAwarenessUserInfo] Provider non trouvé pour note ${noteId}`);
    return;
  }

  const awareness = provider.awareness;
  awareness.setLocalStateField('user', {
    name: userName,
    color: userColor,
  });
  
  console.log(`👤 [Awareness] User info défini pour ${noteId}: ${userName} (${userColor})`);
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

  // Construire l'URL WebSocket depuis NEXT_PUBLIC_API_URL
  // Exemple: http://localhost:3001 -> ws://localhost:1234
  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  // Utiliser un port dédié pour y-websocket (1234 par convention)
  const wsUrl = rawApiUrl
    .replace(/^http/, 'ws')           // http -> ws, https -> wss
    .replace(/:\d+/, ':1234')         // Remplacer le port par 1234
    .replace(/\/api\/?$/, '');         // Retirer /api si présent

  console.log(`🔌 Création du WebSocket provider pour note ${id}`);
  console.log(`📡 URL WebSocket: ${wsUrl}`);

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

  // Logs pour debugging
  provider.on('status', ({ status }: { status: string }) => {
    console.log(`🔌 WebSocket status pour note ${id}: ${status}`);
  });

  provider.on('sync', (isSynced: boolean) => {
    console.log(`📥 Document ${id} synced: ${isSynced}`);
  });

  // Stocker le provider pour accès depuis les composants UI
  providerInstances.set(id, provider);

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
    console.log(`📄 Création d'un nouveau Y.Doc pour note ${id}`);
    doc = new Y.Doc();
    yjsDocMap.set(id, doc);
  } else {
    console.log(`📄 Réutilisation du Y.Doc existant pour note ${id}`);
    // Charger depuis IndexedDB si persisté localement
    doc.load();
  }

  return doc;
}
