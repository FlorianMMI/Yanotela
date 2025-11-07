# Plan de Refonte - Système de Collaboration Yanotela

## 📋 Vue d'ensemble

**Objectif**: Remplacer le système de collaboration custom actuel par l'implémentation officielle de Lexical basée sur l'exemple [react-rich-collab](https://github.com/facebook/lexical/tree/main/examples/react-rich-collab).

**Bénéfices attendus**:
- ✅ Code maintainable et conforme aux standards Lexical
- ✅ Meilleure gestion des conflits CRDT avec YJS natif
- ✅ Curseurs collaboratifs intégrés
- ✅ Support WebSocket robuste via `y-websocket`
- ✅ Moins de code custom = moins de bugs

---

## 🎯 Architecture Actuelle (À REMPLACER)

### Client (`Client/src/`)
```
├── hooks/
│   └── useYjsDocument.ts              ❌ CUSTOM - À SUPPRIMER
├── services/
│   ├── socketService.ts               ❌ CUSTOM - À REMPLACER
│   ├── yjsAwarenessProvider.ts        ❌ CUSTOM - À SUPPRIMER
│   └── yjsCollaborationService.ts     ❌ CUSTOM - À SUPPRIMER
├── components/
│   └── collaboration/
│       ├── YjsCollaborationPlugin.tsx ❌ CUSTOM - À SUPPRIMER
│       ├── CursorPlugin.tsx           ❌ CUSTOM - À SUPPRIMER
│       ├── ConnectedUsers.tsx         ✅ À CONSERVER (adaptation légère)
│       └── TypingIndicator.tsx        ✅ À CONSERVER (adaptation légère)
└── app/notes/[id]/page.tsx            🔄 REFACTOR COMPLET
```

### Server (`Server/src/`)
```
├── app.js                             🔄 REFACTOR Socket.IO → y-websocket server
├── controllers/
│   └── yjsController.js               ❌ À SUPPRIMER (géré par y-websocket)
└── services/
    └── collaborationService.js        ❌ À SUPPRIMER
```

**Problèmes du système actuel**:
1. Logique custom Socket.IO fragile avec gestion manuelle des updates YJS
2. Synchronisation Awareness manuelle via `yjsAwarenessProvider`
3. Hook `useYjsDocument` complexe qui réinvente la roue Lexical
4. Pas de support officiel → maintenance difficile

---

## 🚀 Architecture Cible (Standard Lexical)

### Client - Structure Finale
```
Client/src/
├── collaboration/
│   ├── providers.ts                    ✅ NOUVEAU - WebSocket provider factory
│   └── theme.ts                        ✅ NOUVEAU - Thème curseurs collab
├── components/
│   └── collaboration/
│       ├── ConnectedUsers.tsx          🔄 ADAPTER - Utiliser CollaborationContext
│       └── TypingIndicator.tsx         🔄 ADAPTER - Utiliser Awareness natif
└── app/notes/[id]/page.tsx             🔄 REFACTOR - Wrapper LexicalCollaboration
```

### Server - Structure Finale
```
Server/
├── yjs-server.js                       ✅ NOUVEAU - Serveur y-websocket standalone
└── src/app.js                          🔄 REFACTOR - Retirer logique custom YJS
```

---

## 📦 Dépendances à Installer

```bash
cd Client
npm install --save-exact \
  @lexical/react@0.38.2 \
  @lexical/yjs@0.38.2 \
  y-websocket@2.0.4 \
  yjs@13.6.27

# Optionnel si y-webrtc nécessaire (demo locale)
npm install --save-dev y-webrtc@10.3.0
```

**Versions critiques** (alignées sur exemple officiel):
- `@lexical/react` et `@lexical/yjs` : **v0.38.2** (même version)
- `yjs` : **^13.6.27**
- `y-websocket` : **^2.0.4**

---

## 🛠️ Phase 1: Créer le Provider Factory

### Fichier: `Client/src/collaboration/providers.ts`

```typescript
/**
 * Providers pour collaboration YJS via WebSocket
 * Basé sur: facebook/lexical/examples/react-rich-collab/src/providers.ts
 */

import { Provider } from '@lexical/yjs';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

/**
 * Factory pour créer un WebSocket provider
 * 
 * @param id - Identifiant unique du document (noteId)
 * @param yjsDocMap - Map partagée des documents YJS
 * @returns Provider configuré pour la collaboration
 */
export function createWebsocketProvider(
  id: string,
  yjsDocMap: Map<string, Y.Doc>,
): Provider {
  const doc = getDocFromMap(id, yjsDocMap);

  // Construire l'URL WebSocket depuis NEXT_PUBLIC_API_URL
  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const wsUrl = rawApiUrl
    .replace(/^http/, 'ws')     // http → ws, https → wss
    .replace(/\/api\/?$/, '');   // Retirer /api si présent

  // @ts-expect-error - y-websocket types incomplets
  return new WebsocketProvider(
    wsUrl,                        // URL du serveur WebSocket
    `yanotela-${id}`,             // Room name (préfixe + noteId)
    doc,
    {
      connect: false,             // Ne pas connecter immédiatement
      // Optionnel: Paramètres de reconnexion
      resyncInterval: 10000,      // Resync toutes les 10s
      maxBackoffTime: 10000,      // Délai max entre reconnexions
    },
  );
}

/**
 * Obtenir ou créer un Y.Doc depuis la map
 */
function getDocFromMap(id: string, yjsDocMap: Map<string, Y.Doc>): Y.Doc {
  let doc = yjsDocMap.get(id);

  if (doc === undefined) {
    doc = new Y.Doc();
    yjsDocMap.set(id, doc);
  } else {
    doc.load(); // Charger depuis IndexedDB si persisté
  }

  return doc;
}
```

**Points clés**:
- ✅ Factory pattern standard Lexical
- ✅ Gère automatiquement création/réutilisation des Y.Doc
- ✅ WebSocket URL construite depuis `NEXT_PUBLIC_API_URL`
- ✅ `connect: false` → ConnectPlugin contrôle la connexion

---

## 🛠️ Phase 2: Refactoriser la Page Note

### Fichier: `Client/src/app/notes/[id]/page.tsx`

**Changements majeurs**:

#### Avant (Custom):
```tsx
import { useYjsDocument } from "@/hooks/useYjsDocument";
import YjsCollaborationPlugin from "@/components/collaboration/YjsCollaborationPlugin";

function NoteEditor() {
  const { ydoc, ytext, isReady, state } = useYjsDocument(id);
  
  return (
    <LexicalComposer initialConfig={config}>
      <RichTextPlugin ... />
      <YjsCollaborationPlugin ydoc={ydoc} ytext={ytext} />
    </LexicalComposer>
  );
}
```

#### Après (Standard Lexical):
```tsx
import { LexicalCollaboration } from '@lexical/react/LexicalCollaborationContext';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { createWebsocketProvider } from '@/collaboration/providers';

function NoteEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [userProfile, setUserProfile] = useState({ name: 'Anonyme', color: '#FF5733' });

  // ✅ CRITIQUE: editorState DOIT être null pour collaboration
  const initialConfig = {
    editorState: null,  // ← Laisser CollaborationPlugin gérer l'état initial
    namespace: 'YanotelaNoteEditor',
    nodes: editorNodes,
    onError,
    theme,
  };

  const providerFactory = useCallback(
    (id: string, yjsDocMap: Map<string, Y.Doc>) => {
      const provider = createWebsocketProvider(id, yjsDocMap);
      
      // Écouter les changements de connexion
      provider.on('status', (event) => {
        console.log('WebSocket status:', event.status);
      });
      
      provider.on('sync', (isSynced: boolean) => {
        console.log('Document synced:', isSynced);
      });
      
      return provider;
    },
    []
  );

  return (
    <LexicalCollaboration>
      <LexicalComposer initialConfig={initialConfig}>
        <div ref={containerRef}>
          <RichTextPlugin
            contentEditable={<ContentEditable />}
            placeholder={<div>Commencez à écrire...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          
          {/* ✅ Plugin officiel de collaboration */}
          <CollaborationPlugin
            id={id}  // noteId
            providerFactory={providerFactory}
            shouldBootstrap={false}  // ⚠️ IMPORTANT: Ne pas bootstrap côté client
            username={userProfile.name}
            cursorColor={userProfile.color}
            cursorsContainerRef={containerRef}
          />
          
          <HistoryPlugin />
          <ToolbarPlugin />
        </div>
      </LexicalComposer>
    </LexicalCollaboration>
  );
}
```

**Points critiques**:
- ⚠️ `editorState: null` → **OBLIGATOIRE** pour collaboration
- ⚠️ `shouldBootstrap: false` → éviter race conditions entre clients
- ✅ `LexicalCollaboration` wrapper → fournit context pour awareness
- ✅ `cursorsContainerRef` → container pour afficher curseurs collaboratifs

---

## 🛠️ Phase 3: Serveur YJS WebSocket

### Option A: Serveur Standalone (RECOMMANDÉ)

**Fichier**: `Server/yjs-server.js`

```javascript
#!/usr/bin/env node

/**
 * Serveur YJS WebSocket standalone
 * Basé sur: y-websocket/bin/utils.js
 * 
 * Gère:
 * - Synchronisation CRDT entre clients
 * - Awareness (curseurs, utilisateurs actifs)
 * - Persistance optionnelle (LevelDB, PostgreSQL, etc.)
 */

import * as Y from 'yjs';
import { WebSocketServer } from 'ws';
import http from 'http';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import * as map from 'lib0/map';

const PORT = process.env.YJS_PORT || 1234;
const PERSISTENCE = process.env.YPERSISTENCE || './yjs-db'; // Path pour LevelDB

// Map des documents actifs: roomName → Y.Doc
const docs = new Map();

// Map des connexions par room: roomName → Set<WebSocket>
const conns = new Map();

/**
 * Obtenir ou créer un document YJS
 */
const getYDoc = (docname) => map.setIfUndefined(docs, docname, () => {
  const doc = new Y.Doc();
  
  // TODO: Charger depuis persistence (LevelDB, Postgres, etc.)
  console.log(`📄 Document créé: ${docname}`);
  
  // Observer les changements pour sauvegarde
  doc.on('update', (update, origin) => {
    // TODO: Persister dans DB
    if (origin !== 'db') {
      console.log(`💾 Document modifié: ${docname} (${update.length} bytes)`);
    }
  });
  
  return doc;
});

/**
 * Setup WebSocket server
 */
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (conn, req) => {
  // Extraire le room name depuis l'URL: /yanotela-<noteId>
  const docname = req.url?.slice(1) || 'default';
  console.log(`🔌 Connexion à la room: ${docname}`);
  
  const doc = getYDoc(docname);
  
  // Ajouter la connexion à la room
  map.setIfUndefined(conns, docname, () => new Set()).add(conn);
  
  // Envoyer l'état initial du document
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, syncProtocol.messageYjsSyncStep1);
  syncProtocol.writeSyncStep1(encoder, doc);
  conn.send(encoding.toUint8Array(encoder));
  
  // Awareness initial
  const awarenessStates = awarenessProtocol.encodeAwarenessUpdate(
    doc.getAwareness ? doc.getAwareness() : new awarenessProtocol.Awareness(doc),
    Array.from(doc.getAwareness?.getStates().keys() || [])
  );
  conn.send(awarenessStates);
  
  // Gérer les messages entrants
  conn.on('message', (message) => {
    // TODO: Implémenter protocole YJS complet
    // Voir: y-websocket/src/y-websocket.js
  });
  
  // Cleanup à la déconnexion
  conn.on('close', () => {
    console.log(`🔌 Déconnexion de la room: ${docname}`);
    const set = conns.get(docname);
    if (set) {
      set.delete(conn);
      if (set.size === 0) {
        conns.delete(docname);
        // TODO: Sauvegarder et fermer le document
      }
    }
  });
});

// Créer le serveur HTTP
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('YJS WebSocket Server\n');
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Serveur YJS WebSocket démarré sur ws://localhost:${PORT}`);
});
```

**Commande pour lancer**:
```bash
# Development
cd Server
PORT=1234 YPERSISTENCE=./yjs-db node yjs-server.js

# Docker (ajouter au docker-compose.dev.yml)
```

### Option B: Utiliser `y-websocket` NPM Package Directement

```bash
cd Server
npx y-websocket --port 1234
# Ou avec persistence:
HOST=localhost PORT=1234 YPERSISTENCE=./yjs-db npx y-websocket
```

**Avantages Option B**:
- ✅ Zero code à maintenir
- ✅ Testé et robuste
- ❌ Moins de contrôle sur la logique métier

---

## 🛠️ Phase 4: Adapter ConnectedUsers & TypingIndicator

### ConnectedUsers.tsx (ADAPTATION)

```tsx
import { useCollaborationContext } from '@lexical/react/LexicalCollaborationContext';
import { useEffect, useState } from 'react';
import type { UserState } from '@lexical/yjs';

export default function ConnectedUsers() {
  const { yjsDocMap } = useCollaborationContext();
  const [activeUsers, setActiveUsers] = useState<UserState[]>([]);
  
  useEffect(() => {
    // Obtenir le document principal
    const doc = Array.from(yjsDocMap.values())[0];
    if (!doc) return;
    
    const awareness = doc.getAwareness?.();
    if (!awareness) return;
    
    const updateUsers = () => {
      const states = Array.from(awareness.getStates().entries());
      const users = states
        .filter(([clientId]) => clientId !== awareness.clientID)
        .map(([_, state]) => state as UserState);
      
      setActiveUsers(users);
    };
    
    awareness.on('change', updateUsers);
    updateUsers();
    
    return () => {
      awareness.off('change', updateUsers);
    };
  }, [yjsDocMap]);
  
  return (
    <div className="connected-users">
      {activeUsers.map(user => (
        <div key={user.clientId} style={{ color: user.color }}>
          {user.name}
        </div>
      ))}
    </div>
  );
}
```

---

## 📝 Phase 5: Migration des Données

### Stratégie de Migration

**Option 1: Migration à la volée (RECOMMANDÉ)**
```javascript
// Dans Server/src/controllers/noteController.js

export async function getNoteById(req, res) {
  const note = await prisma.note.findUnique({ where: { id: req.params.id } });
  
  if (!note) return res.status(404).json({ error: 'Note non trouvée' });
  
  // ✅ Si yjsState vide mais Content existe → créer Y.Doc depuis JSON
  if (!note.yjsState && note.Content) {
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('content');
    
    // Parser ancien contenu Lexical JSON
    const lexicalState = JSON.parse(note.Content || '{}');
    const textContent = extractTextFromLexical(lexicalState);
    
    // Insérer dans YJS
    ytext.insert(0, textContent);
    
    // Sauvegarder l'état YJS
    const yjsState = Y.encodeStateAsUpdate(ydoc);
    await prisma.note.update({
      where: { id: note.id },
      data: { yjsState: Buffer.from(yjsState) }
    });
    
    note.yjsState = Buffer.from(yjsState);
  }
  
  return res.json({ note });
}
```

**Option 2: Script de migration batch**
```bash
cd Server
npm run migrate:yjs
```

---

## 🧪 Phase 6: Tests & Validation

### Checklist Tests Fonctionnels

- [ ] **Multi-clients**: Ouvrir 2+ navigateurs, éditer simultanément
- [ ] **Curseurs collaboratifs**: Vérifier affichage curseurs autres users
- [ ] **Reconnexion**: Couper réseau, reconnecter → sync automatique
- [ ] **Conflits**: Modifier même ligne simultanément → résolution CRDT
- [ ] **Awareness**: Nom/couleur utilisateurs affichés correctement
- [ ] **Performance**: <100ms latence pour édition locale
- [ ] **Mobile**: Tester sur mobile (touch events, soft keyboard)

### Tests Automatisés
```typescript
// Client/tests/collaboration/collab.test.ts

describe('Collaboration YJS', () => {
  it('should sync edits between clients', async () => {
    // TODO: Playwright tests multi-tabs
  });
  
  it('should show connected users', async () => {
    // TODO: Vérifier awareness
  });
});
```

---

## 🗑️ Phase 7: Cleanup Code Legacy

### Fichiers à SUPPRIMER

```bash
# Client
rm Client/src/hooks/useYjsDocument.ts
rm -rf Client/src/services/yjsAwarenessProvider.ts
rm -rf Client/src/services/yjsCollaborationService.ts
rm -rf Client/src/services/socketService.ts
rm -rf Client/src/components/collaboration/YjsCollaborationPlugin.tsx
rm -rf Client/src/components/collaboration/CursorPlugin.tsx

# Server
rm Server/src/controllers/yjsController.js
rm Server/src/services/collaborationService.js
```

### Code à MODIFIER dans `Server/src/app.js`

**Retirer**:
- Lignes 100-615: toute la logique Socket.IO custom
- Imports: `collaborationService`, `yjsController`

**Conserver**:
- Routes REST API existantes (auth, notes, permissions)
- Session middleware

---

## 📚 Documentation & Copilot Instructions

### Mise à jour `.github/copilot-instructions.md`

```markdown
## Real-Time Collaboration (Production-Ready)

**Architecture**: Lexical + YJS + WebSocket Provider (standard officiel)

**Stack**:
- Client: `@lexical/react/LexicalCollaborationPlugin` + `y-websocket`
- Server: `y-websocket` standalone server (port 1234)
- CRDT: YJS pour résolution automatique des conflits

**Setup Client**:
```tsx
import { LexicalCollaboration } from '@lexical/react/LexicalCollaborationContext';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';

<LexicalCollaboration>
  <LexicalComposer initialConfig={{ editorState: null }}>
    <CollaborationPlugin
      id={noteId}
      providerFactory={createWebsocketProvider}
      shouldBootstrap={false}
    />
  </LexicalComposer>
</LexicalCollaboration>
```

**Setup Server**:
```bash
cd Server
PORT=1234 YPERSISTENCE=./yjs-db npx y-websocket
```

**Provider Factory**: `Client/src/collaboration/providers.ts`
- Crée WebSocketProvider via `y-websocket`
- URL: `ws://localhost:1234` (dev) ou env var en prod
- Room name: `yanotela-${noteId}`

**Critical Points**:
- ⚠️ `editorState: null` obligatoire dans LexicalComposer config
- ⚠️ `shouldBootstrap: false` → évite race conditions multi-clients
- ✅ Cursors automatiques via `cursorsContainerRef`
- ✅ Awareness (users connectés) via `useCollaborationContext()`

**Migration Données**:
- Ancien: `Note.Content` (JSON Lexical stringifié)
- Nouveau: `Note.yjsState` (Bytes YJS CRDT)
- Migration à la volée dans `getNoteById` controller
```

---

## 🚀 Timeline & Priorités

### Phase 1-2 (Jour 1-2): Setup Base
- [ ] Installer dépendances
- [ ] Créer `providers.ts`
- [ ] Refactoriser 1 page test (`/notes/[id]`)

### Phase 3 (Jour 2-3): Serveur WebSocket
- [ ] Configurer `y-websocket` server
- [ ] Intégrer au Docker Compose
- [ ] Tester connexion client-serveur

### Phase 4-5 (Jour 3-4): Migration & Adaptation
- [ ] Adapter ConnectedUsers/TypingIndicator
- [ ] Migration données (script ou à la volée)
- [ ] Tests multi-clients

### Phase 6-7 (Jour 5): Cleanup & Docs
- [ ] Supprimer code legacy
- [ ] Tests automatisés
- [ ] Documentation complète

---

## 🎯 Commandes Récapitulatives

```bash
# Installation
cd Client && npm install @lexical/react@0.38.2 @lexical/yjs@0.38.2 y-websocket@2.0.4 yjs@13.6.27

# Lancer serveur YJS (dev)
cd Server && PORT=1234 YPERSISTENCE=./yjs-db npx y-websocket

# Lancer client
cd Client && npm run dev

# Tests
cd Client && npm run test
cd Server && npm run test

# Cleanup
rm -rf Client/src/{hooks/useYjsDocument.ts,services/{yjsAwarenessProvider,yjsCollaborationService,socketService}.ts}
```

---

## 📖 Références

- [Lexical React Rich Collab Example](https://github.com/facebook/lexical/tree/main/examples/react-rich-collab)
- [Lexical Collaboration Docs](https://lexical.dev/docs/collaboration/react)
- [YJS Documentation](https://docs.yjs.dev/)
- [y-websocket Provider](https://github.com/yjs/y-websocket)
- [y-protocols Awareness](https://github.com/yjs/y-protocols)
