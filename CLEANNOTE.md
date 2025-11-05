# Service de nettoyage automatique des notes supprimées

## Configuration Docker du service `cleanup-notes`

### **Vue d'ensemble**
Le service `cleanup-notes` est un conteneur Docker dédié au nettoyage automatique des notes supprimées (soft delete) après 30 jours de rétention dans la corbeille.

---

## Configuration complète

```yaml
cleanup-notes:
    build: 
      context: ./Server
      dockerfile: Dockerfile.preprod
    container_name: yanotela-cleanup-local
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://yanotela_local:yanotela_local_2024@db:5432/yanotela_local
    volumes:
      - ./Server/scripts:/app/scripts
      - ./Server/prisma:/app/prisma
      - /app/node_modules
    depends_on:
      db:
        condition: service_healthy
    # Exécute le script toutes les 24h (86400 secondes)
    command: sh -c "while true; do sleep 86400 && npm run cleanup:notes; done"
    restart: unless-stopped
```

---

## Détails techniques

### **1. Configuration de base**
```yaml
build: 
  context: ./Server
  dockerfile: Dockerfile.preprod
```
- **Nom du service** : `cleanup-notes`
- **Build** : Utilise le Dockerfile de préprod du serveur (même image que le backend)
- **Contexte** : Dossier `./Server` comme base de construction

### **2. Identité du conteneur**
```yaml
container_name: yanotela-cleanup-local
```
- Nom explicite du conteneur pour faciliter son identification dans Docker Desktop et les logs

### **3. Variables d'environnement**
```yaml
environment:
  - NODE_ENV=development
  - DATABASE_URL=postgresql://yanotela_local:yanotela_local_2024@db:5432/yanotela_local
```
- **NODE_ENV=development** : Mode développement
- **DATABASE_URL** : Connexion à la base PostgreSQL (même DB que le backend)
  - Utilisateur : `yanotela_local`
  - Mot de passe : `yanotela_local_2024`
  - Hôte : `db` (nom du service PostgreSQL dans Docker Compose)
  - Port : `5432` (port standard PostgreSQL)
  - Base de données : `yanotela_local`

### **4. Volumes montés**
```yaml
volumes:
  - ./Server/scripts:/app/scripts        # Scripts de nettoyage
  - ./Server/prisma:/app/prisma          # Schéma Prisma
  - /app/node_modules                    # Node_modules isolés
```

**Rôle de chaque volume** :
- **`./Server/scripts:/app/scripts`** : Monte les scripts de nettoyage en temps réel
  - Permet de modifier `cleanup-deleted-notes.js` sans rebuild du conteneur
  - Hot-reload des modifications
  
- **`./Server/prisma:/app/prisma`** : Monte le schéma Prisma
  - Accès direct au schéma de la base de données
  - Synchronisation avec les migrations
  
- **`/app/node_modules`** : Volume anonyme pour les dépendances Node.js
  - Évite les conflits entre node_modules de l'hôte et du conteneur
  - Optimise les performances

### **5. Dépendances de services**
```yaml
depends_on:
  db:
    condition: service_healthy
```
- Attend que le service `db` (PostgreSQL) soit **en bonne santé** avant de démarrer
- Garantit que la base de données est prête à accepter des connexions
- Évite les erreurs de connexion au démarrage

### **6. Commande principale** ⏰
```yaml
command: sh -c "while true; do sleep 86400 && npm run cleanup:notes; done"
```

**Décortiquons cette commande** :

| Élément | Description |
|---------|-------------|
| `sh -c` | Exécute une commande shell dans le conteneur |
| `while true; do ... done` | Boucle infinie qui ne s'arrête jamais |
| `sleep 86400` | Attend **86400 secondes = 24 heures** |
| `&&` | Opérateur logique : si le sleep réussit, exécute la commande suivante |
| `npm run cleanup:notes` | Exécute le script défini dans `Server/package.json` |

**Fonctionnement en pratique** :
1. Le conteneur démarre
2. Attend 24 heures (premier cycle)
3. Exécute `npm run cleanup:notes` → appelle `Server/scripts/cleanup-deleted-notes.js`
4. Retourne à l'étape 2 (attend à nouveau 24 heures)
5. Répète indéfiniment

### **7. Politique de redémarrage**
```yaml
restart: unless-stopped
```
- Le conteneur redémarre **automatiquement** en cas d'erreur ou de crash
- **Exception** : Si vous l'arrêtez manuellement avec `docker stop`, il ne redémarre pas
- Assure la continuité du service de nettoyage

---

## 📋 Workflow complet du nettoyage

### **Phase 1 : Démarrage**
1. Docker Compose lance le conteneur `cleanup-notes`
2. Le conteneur attend que PostgreSQL soit "healthy" (via `depends_on`)
3. Une fois prêt, il démarre la boucle de nettoyage

### **Phase 2 : Cycle de nettoyage (toutes les 24h)**
1. Le service dort pendant 24 heures (`sleep 86400`)
2. Au réveil, il exécute `npm run cleanup:notes`
3. Le script `cleanup-deleted-notes.js` :
   - Se connecte à la base de données via Prisma
   - Calcule la date limite : `Date actuelle - 30 jours`
   - Recherche toutes les notes avec `deletedAt <= date limite`
   - Pour chaque note trouvée :
     - Supprime les permissions associées
     - Supprime les relations noteFolder
     - Supprime définitivement la note
   - Log les résultats dans la console Docker

### **Phase 3 : Gestion des erreurs**
- Si le script échoue : Log de l'erreur + redémarrage automatique du conteneur
- Si la base de données est indisponible : Retry automatique après redémarrage
- Les logs sont accessibles via `docker logs yanotela-cleanup-local`

---

## 🎯 Utilité et avantages

### **Pourquoi ce service est nécessaire ?**
1. **Respect de la politique RGPD** : Suppression automatique des données après une période définie
2. **Optimisation de la base de données** : Évite l'accumulation de données obsolètes
3. **Automatisation** : Aucune intervention manuelle nécessaire
4. **Transparence** : Les utilisateurs savent que leurs notes supprimées seront définitivement effacées après 30 jours

### **Avantages de l'architecture Docker**
- ✅ **Isolation** : Le service de nettoyage ne perturbe pas le backend principal
- ✅ **Scalabilité** : Peut être désactivé/activé indépendamment
- ✅ **Maintenance** : Modifications du script sans rebuild grâce aux volumes
- ✅ **Fiabilité** : Redémarrage automatique en cas d'erreur

---

## 🔧 Commandes utiles

### Vérifier les logs du service
```bash
docker logs yanotela-cleanup-local
```

### Suivre les logs en temps réel
```bash
docker logs -f yanotela-cleanup-local
```

### Forcer l'exécution immédiate du nettoyage (pour test)
```bash
docker exec yanotela-cleanup-local npm run cleanup:notes
```

### Redémarrer le service manuellement
```bash
docker restart yanotela-cleanup-local
```

### Arrêter le service de nettoyage
```bash
docker stop yanotela-cleanup-local
```

---

## 📊 Configuration dans package.json

Le script `cleanup:notes` doit être défini dans `Server/package.json` :

```json
{
  "scripts": {
    "cleanup:notes": "node scripts/cleanup-deleted-notes.js"
  }
}
```

---

## 🔐 Politique de rétention

| Action | Délai | Type de suppression |
|--------|-------|---------------------|
| Supprimer une note (Owner/Admin) | Immédiat | Soft delete (`deletedAt` défini) |
| Nettoyage automatique | 30 jours après `deletedAt` | Hard delete (suppression définitive) |
| Quitter une note (Éditeur/Lecteur) | Immédiat | Suppression de la permission |

---

## ⚠️ Points d'attention

1. **Première exécution** : Le script s'exécute 24h après le démarrage du conteneur
2. **Changement de configuration** : Nécessite un rebuild du conteneur
3. **Base de données** : Le service doit toujours pouvoir accéder à PostgreSQL
4. **Logs** : Penser à consulter régulièrement les logs pour vérifier le bon fonctionnement

---

## 🚀 Pour aller plus loin

### Modifier la fréquence de nettoyage
Remplacer `86400` (24h) par une autre valeur en secondes :
- 3600 = 1 heure
- 43200 = 12 heures
- 604800 = 7 jours

### Modifier la période de rétention
Éditer `Server/scripts/cleanup-deleted-notes.js` et changer la constante :
```javascript
const RETENTION_DAYS = 30; // Modifier cette valeur
```
