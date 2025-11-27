# Architecture Unifiée : Serveur YJS Unique

## 🎯 Solution Finale : Un Seul Serveur pour Tout

Le serveur YJS unifié (`Server/src/yjs-server.js`) gère **TOUT** sur un seul WebSocket :

✅ **Collaboration temps réel** (édition Lexical partagée)  
✅ **Notifications temps réel** (via Awareness)  
✅ **Protocole YJS complet** (sync + awareness + updates)  
✅ **Performance optimale** (compression, multiplexage)

---

## 🏗️ Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│              SERVEUR YJS UNIFIÉ (port 1234)                  │
│                  Server/src/yjs-server.js                    │
│                                                              │
│  📝 Y.Doc (état du document Lexical partagé)               │
│  👁️ Awareness (curseurs + sélections + NOTIFICATIONS)      │
│  🔌 WebSocket Protocol (sync + awareness messages)         │
│                                                              │
│  ✅ registerProvider(noteId, {awareness, doc})             │
│     → yjsProviders.set(noteId, provider)                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ WebSocket (ws://localhost:1234)
                           │ Messages encodés (lib0)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Next.js)                          │
│           Client/src/collaboration/providers.ts              │
│                                                              │
│  1. createWebsocketProvider(noteId)                         │
│  2. provider.connect() → établit connexion WebSocket       │
│  3. provider.doc → document YJS partagé (Lexical)          │
│  4. provider.awareness → awareness partagée                 │
│     ├─ Curseurs temps réel (CollaborationPlugin)           │
│     ├─ Sélections partagées                                 │
│     └─ NOTIFICATIONS (useYjsNotifications.ts)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flow Complet : Collaboration + Notifications

### **Scénario 1 : Édition Collaborative**

```
User A tape "Hello" dans Lexical
    ↓
Lexical → Y.Text update
    ↓
provider.doc.on('update') → WebSocket message (type: sync)
    ↓
Serveur YJS reçoit update → Y.applyUpdate(doc, update)
    ↓
Serveur broadcast à tous les autres clients (type: sync)
    ↓
User B reçoit l'update → Lexical met à jour l'éditeur
    ✅ "Hello" apparaît instantanément chez User B
```

### **Scénario 2 : Notification de Rôle**

```
User A (admin) change rôle de User B (Editor → Admin)
    ↓
POST /permission/update/:noteId/:userId
    ↓
permissionController.js → notifyRoleChanged(userId, noteId, ...)
    ↓
yjsNotificationService.js → createNotification(ROLE_CHANGED, userId, data)
    ↓
broadcastNotificationViaAwareness(notification)
    ├─ yjsProviders.forEach((provider) => {
    │    awareness.setLocalStateField('notifications', [...])
    └─ })
    ↓
awareness.on('update') → WebSocket message (type: awareness)
    ↓
Serveur YJS reçoit awareness update → applyAwarenessUpdate()
    ↓
Serveur broadcast à tous les clients (type: awareness)
    ↓
User B reçoit awareness update
    ↓
useYjsNotifications.ts → provider.awareness.on('change')
    ↓
setNotifications([...invitations, ...yjsNotifs])
    ✅ Notification apparaît instantanément chez User B
```

---

## 📁 Fichiers Clés

### **Serveur**

1. **`Server/src/yjs-server.js`** ⭐ (SERVEUR UNIFIÉ)
   - **Protocole YJS complet** : sync (messageType=0) + awareness (messageType=1)
   - **Sync initial** : `writeSyncStep1(encoder, doc)` → envoie l'état complet
   - **Updates bidirectionnels** : `readSyncMessage()` + `writeUpdate()` + broadcast
   - **Awareness bidirectionnel** : `applyAwarenessUpdate()` + `encodeAwarenessUpdate()` + broadcast
   - **Provider registration** : `registerProvider(noteId, {awareness, doc, roomName})`
   - **Cleanup automatique** : `unregisterProvider()` quand room vide
   - **Dépendances** : `ws`, `yjs`, `y-protocols/awareness`, `y-protocols/sync`, `lib0`

2. **`Server/src/services/yjsNotificationService.js`**
   - `yjsProviders` Map<noteId, provider> → remplie par yjs-server.js
   - `registerProvider(noteId, provider)` → appelé au connect
   - `unregisterProvider(noteId)` → appelé au disconnect
   - `broadcastNotificationViaAwareness(notification)` :
     ```javascript
     yjsProviders.forEach((provider) => {
       awareness.setLocalStateField('notifications', [...notifications, notification]);
     });
     ```
   - `notifyRoleChanged()`, `notifyUserRemoved()`, `notifyNoteDeleted()`

3. **`Server/src/controllers/permissionController.js`**
   - `UpdatePermission` → `notifyRoleChanged()`
   - `RemovePermission` → `notifyUserRemoved()`

4. **`Server/src/controllers/noteController.js`**
   - `deleteNote` → `notifyNoteDeleted()`

### **Client**

1. **`Client/src/collaboration/providers.ts`**
   - `createWebsocketProvider(noteId)` → crée `WebsocketProvider`
   - Auto-détection : `ws://localhost:1234` (dev) ou `wss://domain/yjs` (prod)
   - Stocke dans `providerInstances` Map<noteId, provider>
   - **UN SEUL provider par note** = collaboration + notifications

2. **`Client/src/hooks/useYjsNotifications.ts`** ⭐
   - Écoute `provider.awareness.on('change')` sur TOUS les providers actifs
   - Extrait notifications depuis `awareness.getStates()`
   - **Déduplication** : `seenIds` Set pour éviter les doublons
   - **Fusion** : invitations classiques (API) + notifications YJS (Awareness)
   - Expose `markAsRead()`, `deleteNotification()`

3. **`Client/src/components/notificationList/page.tsx`**
   - Utilise `useYjsNotifications(userId)`
   - Dropdown avec liste notifications
   - Bouton "Rafraîchir" → `dispatchEvent('refreshNotifications')`

4. **`Client/src/ui/notification.tsx`**
   - Affichage d'une notification individuelle
   - Boutons Accept/Refuse → callbacks `onAccept`/`onRefuse`

---

## 🔧 Configuration

### **Docker Compose** (`docker-compose.dev.yml`)

```yaml
yjs-server:
  build:
    context: ./Server
    dockerfile: Dockerfile.preprod
  container_name: yanotela-yjs-server
  ports:
    - "1234:1234"
  environment:
    - NODE_ENV=development
    - HOST=0.0.0.0
    - PORT=1234
  volumes:
    - ./Server/src:/app/src
    - /app/node_modules
  command: node src/yjs-server.js  # ← Serveur unifié
  restart: unless-stopped
```

### **Dépendances** (`Server/package.json`)

```json
{
  "dependencies": {
    "ws": "^8.18.0",
    "yjs": "^13.6.27",
    "y-protocols": "^1.0.6",
    "lib0": "^0.2.98"
  }
}
```

---

## 🚀 Démarrage

### **Première Installation**

```bash
cd /home/donzaud/SAÉ\ 5.DWeb-DI.01/Yanotela

# Reconstruire TOUT (nouvelles dépendances + serveur unifié)
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up --build

# Logs du serveur YJS
docker logs yanotela-yjs-server -f
```

**Logs attendus au démarrage** :
```
🚀 [YJS] Serveur WebSocket unifié démarré sur 0.0.0.0:1234
📝 [YJS] Collaboration temps réel : ACTIVÉE
🔔 [YJS] Notifications temps réel : ACTIVÉES
📡 [YJS] Protocole YJS complet (sync + awareness)
```

### **Logs Lors d'une Connexion Client**

Quand un utilisateur ouvre une note (`/notes/{id}`) :

```
🔌 [YJS] Nouvelle connexion pour room: yanotela-abc123
📄 [YJS] Room créée: yanotela-abc123
✅ [YJS] Provider enregistré pour noteId: abc123
✅ [YJS NOTIF SERVICE] Provider enregistré: noteId=abc123, total=1
```

### **Logs Lors d'une Notification**

Quand un admin change un rôle :

```
🔔 [NOTIF] Rôle changé: userId=2, note="Ma Note", 2 → 1
✅ [YJS NOTIF] ROLE_CHANGED créée pour user=2
📡 [YJS NOTIF] Broadcast via Awareness pour 1 providers
```

---

## 🧪 Tests de Validation

### **Test 1 : Collaboration Fonctionne**

1. Ouvrir la même note dans **2 navigateurs** (2 utilisateurs différents)
2. **User A** tape "Bonjour" dans Lexical
3. **User B** voit "Bonjour" apparaître **instantanément** (< 500ms)
4. Vérifier les curseurs collaboratifs (avatar + couleur)

✅ **Succès** : Édition temps réel fonctionne via le serveur unifié

### **Test 2 : Notifications Fonctionnent**

1. **User A** (admin) change le rôle de **User B** (Editor → Admin)
2. **User B** voit la notification **instantanément** dans le dropdown
3. Message : "FlorianMMI vous a promu Administrateur sur 'Ma Note'"

✅ **Succès** : Notifications temps réel via le serveur unifié

### **Test 3 : Un Seul WebSocket**

1. Ouvrir DevTools → **Network** tab → **WS** filter
2. Ouvrir une note
3. **Vérifier** : **UN SEUL** WebSocket actif (`ws://localhost:1234?room=yanotela-...`)
4. **Éditer** la note → messages de type `sync` (collaboration)
5. **Changer un rôle** → messages de type `awareness` (notifications)

✅ **Succès** : Tout passe par le même WebSocket

---

## 📊 Debugging

### **Endpoint de Debug** (à ajouter dans `Server/index.js`)

```javascript
import { yjsProviders } from './src/services/yjsNotificationService.js';

app.get('/debug/yjs-providers', (req, res) => {
  const providers = Array.from(yjsProviders.entries()).map(([noteId, provider]) => ({
    noteId,
    roomName: provider.roomName,
    hasDoc: !!provider.doc,
    hasAwareness: !!provider.awareness,
    awarenessClients: provider.awareness?.getStates().size || 0
  }));
  res.json({ 
    total: providers.length, 
    providers,
    message: providers.length === 0 ? 'Aucun provider actif (aucune note ouverte)' : 'Providers actifs'
  });
});
```

**Appel** : `http://localhost:3001/debug/yjs-providers`

**Réponse attendue** (1 note ouverte) :
```json
{
  "total": 1,
  "providers": [
    {
      "noteId": "abc123",
      "roomName": "yanotela-abc123",
      "hasDoc": true,
      "hasAwareness": true,
      "awarenessClients": 2
    }
  ],
  "message": "Providers actifs"
}
```

### **Console Navigateur**

```javascript
// Dans la console du navigateur (sur /notes/{id})
import { providerInstances } from '@/collaboration/providers';

// Voir les providers actifs
console.log(providerInstances);

// Voir l'awareness d'un provider
const provider = providerInstances.get('{noteId}');
console.log(provider.awareness.getStates());

// Voir le document YJS
console.log(provider.doc.toJSON());
```

---

## ⚠️ Limitations Connues

1. **Notifications éphémères** : Stockées en mémoire (`pendingNotifications` Map), perdues au redémarrage serveur
2. **Scope par note** : Notifications diffusées uniquement aux clients connectés à la **même note**
3. **Pas de persistance** : L'état YJS n'est pas sauvegardé en base (seulement via `/note/sync`)

---

## 🔄 Prochaines Améliorations

1. **Persistence YJS** : Stocker `yjsState` en base à chaque update (actuellement seulement via debounce)
2. **Global Awareness** : Créer une room globale (`yanotela-global`) pour notifications hors note
3. **Redis Pub/Sub** : Synchroniser plusieurs instances du serveur YJS (scalabilité)
4. **Notification History** : Table `Notification` en DB pour garder historique

---

## 📚 Références Techniques

- **YJS Documentation** : https://docs.yjs.dev/
- **YJS Awareness Protocol** : https://docs.yjs.dev/api/about-awareness
- **y-protocols** : https://github.com/yjs/y-protocols
- **lib0** (encoding/decoding) : https://github.com/dmonad/lib0
- **WebSocket (ws)** : https://github.com/websockets/ws

---

## ✅ Checklist de Validation

- [ ] Rebuild Docker : `docker compose -f docker-compose.dev.yml up --build`
- [ ] Serveur YJS démarre : logs "🚀 Serveur WebSocket unifié"
- [ ] Collaboration fonctionne : édition temps réel entre 2 utilisateurs
- [ ] Notifications fonctionnent : changement de rôle instantané
- [ ] **UN SEUL WebSocket** visible dans DevTools Network tab
- [ ] Pas d'erreurs console côté client
- [ ] Pas d'erreurs logs côté serveur

---

## 🎉 Résultat Final

**Avant** : 2 serveurs distincts (collaboration + notifications) → complexité, risque de désynchronisation

**Après** : **1 serveur unifié** → simplicité, performance, protocole YJS standard

✅ **Collaboration temps réel** : édition Lexical partagée via Y.Doc  
✅ **Notifications temps réel** : via Awareness (même WebSocket)  
✅ **Code maintenable** : protocole YJS standard (sync + awareness)  
✅ **Performance optimale** : compression, multiplexage, pas de polling HTTP
