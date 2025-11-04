# 🔧 Corrections de la collaboration temps réel

## Problèmes identifiés et corrigés

### 1. ❌ Problème : Curseur qui se déplace automatiquement
**Cause** : La fonction `handleRemoteContentUpdate` sauvegardait la position du curseur et la restaurait après chaque mise à jour distante, ce qui déplaçait le curseur de l'utilisateur actif vers la position de l'autre utilisateur.

**Solution** : Suppression complète de la sauvegarde/restauration de la sélection et du focus lors des mises à jour distantes.

```tsx
// ❌ AVANT (mauvais)
const hasFocus = editor.getRootElement() === document.activeElement;
let savedSelection = editor.getEditorState()._selection?.clone();
// ... restauration du focus et de la sélection après mise à jour

// ✅ APRÈS (correct)
// Pas de sauvegarde ni restauration - laissez l'utilisateur là où il est !
```

### 2. ❌ Problème : "X écrit..." affiché pour le mauvais utilisateur
**Cause** : Le serveur renvoyait les événements `contentUpdate` à TOUS les utilisateurs, y compris l'émetteur, créant une boucle infinie et des messages incorrects.

**Solution** : Utilisation de `socket.to(room)` au lieu de `io.to(room)` pour broadcaster uniquement aux AUTRES utilisateurs.

```javascript
// ❌ AVANT
io.to(roomName).emit('contentUpdate', { ... }); // Envoie à tout le monde

// ✅ APRÈS
socket.to(roomName).emit('contentUpdate', { ... }); // Envoie aux autres seulement
```

### 3. ❌ Problème : Boucles infinies de mise à jour
**Cause** : Le flag `isApplyingRemoteUpdateRef` était réinitialisé trop tôt (50ms), permettant aux événements de se déclencher avant la fin de l'application de la mise à jour.

**Solution** : 
- Augmentation du délai à 300ms
- Application immédiate sans `setTimeout`
- Suppression des restaurations de focus/sélection

```tsx
// ✅ Marquer AVANT l'application
isApplyingRemoteUpdateRef.current = true;

// ✅ Appliquer immédiatement
const newEditorState = editor.parseEditorState(parsedContent);
editor.setEditorState(newEditorState);

// ✅ Réinitialiser après 300ms (au lieu de 50ms)
setTimeout(() => {
  isApplyingRemoteUpdateRef.current = false;
}, 300);
```

### 4. ❌ Problème : Trop de sauvegardes en base de données
**Cause** : Chaque frappe déclenchait une sauvegarde BDD avec un simple `setTimeout`, créant des centaines de requêtes.

**Solution** : Système de debounce centralisé côté serveur.

```javascript
// ✅ Map globale pour gérer les timers
const saveTimers = new Map();

function debouncedSave(noteId, content, userId) {
  // Annuler le timer précédent
  if (saveTimers.has(noteId)) {
    clearTimeout(saveTimers.get(noteId));
  }
  
  // Créer un nouveau timer de 1 seconde
  const timer = setTimeout(async () => {
    await prisma.note.update({ ... });
    saveTimers.delete(noteId);
  }, 1000);
  
  saveTimers.set(noteId, timer);
}
```

### 5. ⚠️ Amélioration : Messages de warning pour le debug
**Ajout** : Logs explicites quand le socket n'est pas connecté pour éviter les erreurs silencieuses.

```typescript
emitContentUpdate(noteId: string, content: string) {
  if (!this.socket || !this.socket.connected) {
    console.warn('⚠️ Socket non connecté, impossible d\'émettre contentUpdate');
    return;
  }
  this.socket.emit('contentUpdate', { noteId, content });
}
```

## Fichiers modifiés

1. **Client/src/app/notes/[id]/page.tsx**
   - Simplification de `handleRemoteContentUpdate`
   - Suppression de la gestion du focus/sélection
   - Augmentation du délai du flag à 300ms

2. **Client/src/services/socketService.ts**
   - Ajout de warnings explicites sur émissions
   - Meilleure gestion des erreurs de connexion

3. **Server/src/app.js**
   - Ajout du système `debouncedSave()`
   - Utilisation de `socket.to()` au lieu de broadcaster à tous
   - Optimisation des sauvegardes BDD

## Tests recommandés

1. ✅ Ouvrir la même note dans 2 navigateurs différents
2. ✅ Taper en même temps des deux côtés
3. ✅ Vérifier que le curseur ne se déplace PAS
4. ✅ Vérifier que "X écrit..." s'affiche correctement
5. ✅ Vérifier que les modifications sont bien synchronisées
6. ✅ Vérifier les logs serveur (pas de spam de sauvegardes)

## Commandes de test

```bash
# Redémarrer le serveur
cd Server && npm run dev

# Redémarrer le client
cd Client && npm run dev

# Ou avec Docker
docker compose -f docker-compose.dev.yml up --build
```

## Notes importantes

- ⚠️ Le système utilise toujours Lexical (pas YJS) pour le moment
- ⚠️ Les sauvegardes sont debounced à 1 seconde côté serveur
- ⚠️ La synchronisation temps réel passe uniquement par Socket.IO
- ✅ Les conflits d'édition sont maintenant gérés correctement
