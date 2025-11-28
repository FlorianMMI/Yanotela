/**
 * Providers WebSocket pour collaboration YJS
 * Basé sur: facebook/lexical/examples/react-rich-collab/src/providers.ts
 */

import { Provider } from '@lexical/yjs';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

/**
 * Map globale pour stocker les états YJS initiaux à appliquer
 * Key: noteId, Value: Uint8Array de l'état YJS
 */
const pendingYjsStates = new Map<string, Uint8Array>();

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
 * Enregistrer un état YJS initial à appliquer lors de la création du provider
 * DOIT être appelé AVANT que le CollaborationPlugin ne crée le provider
 * 
 * @param noteId - ID de la note
 * @param yjsStateArray - État YJS sous forme de tableau d'octets
 */
export function registerInitialYjsState(noteId: string, yjsStateArray: number[]) {
  if (!yjsStateArray || yjsStateArray.length === 0) {
    return;
  }
  const uint8Array = new Uint8Array(yjsStateArray);
  pendingYjsStates.set(noteId, uint8Array);
  
}

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
  const { doc, hadInitialState } = getDocFromMap(id, yjsDocMap);

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
      connect: !hadInitialState,        // Si état initial, ne pas connecter immédiatement
      // Paramètres de reconnexion
      resyncInterval: 10000,            // Resync toutes les 10s
      maxBackoffTime: 10000,            // Délai max entre reconnexions
      disableBc: false,                 // Activer BroadcastChannel pour tabs locales
    },
  );

  // ✅ Si on a appliqué un état initial, connecter après un court délai
  // pour laisser le temps au document d'être prêt
  if (hadInitialState) {
    
    setTimeout(() => {
      
      provider.connect();
    }, 100);
  }

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
 * @returns Y.Doc pour ce document et un booléen indiquant si un état initial a été appliqué
 */
function getDocFromMap(id: string, yjsDocMap: Map<string, Y.Doc>): { doc: Y.Doc; hadInitialState: boolean } {
  let doc = yjsDocMap.get(id);
  let hadInitialState = false;

  if (doc === undefined) {
    
    doc = new Y.Doc();
    yjsDocMap.set(id, doc);
    
    // ✅ Appliquer l'état YJS initial s'il a été enregistré
    const pendingState = pendingYjsStates.get(id);
    if (pendingState) {
      
      Y.applyUpdate(doc, pendingState);
      pendingYjsStates.delete(id); // Nettoyer après utilisation
      hadInitialState = true;
    }
  } else {
    
    // Charger depuis IndexedDB si persisté localement
    doc.load();
  }

  return { doc, hadInitialState };
}
