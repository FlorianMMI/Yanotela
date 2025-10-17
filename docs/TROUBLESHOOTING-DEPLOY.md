# Troubleshooting Guide - Déploiement Production

## Erreur Build #38 - Services non disponibles

### Symptômes
- ❌ Frontend is not responding
- ❌ Backend is not responding
- Les containers ne passent pas en état "healthy"

### Causes principales

1. **Health checks manquants ou mal configurés**
   - Les containers ne peuvent pas signaler leur état de santé
   - Docker Compose ne peut pas vérifier si les services sont prêts

2. **Délai d'attente insuffisant**
   - Les services ont besoin de temps pour démarrer (migrations DB, build, etc.)
   - Le workflow GitHub Actions ne laisse pas assez de temps

3. **Dépendances manquantes dans les images**
   - `wget` ou `curl` non installés pour les health checks
   - Problèmes de build des images Docker

4. **Variables d'environnement incorrectes**
   - `.env.dev` mal configuré
   - Variables manquantes ou invalides

### Solutions appliquées

#### 1. Ajout des Health Checks dans `docker-compose.dev.yml`

**Backend:**
```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/health"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 40s
```

**Frontend:**
```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 40s
```

#### 2. Installation de `wget` dans les Dockerfiles

**Server/Dockerfile:**
```dockerfile
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    openssl \
    wget
```

**Client/Dockerfile:**
```dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache wget
```

#### 3. Amélioration du workflow GitHub Actions

- Augmentation du temps d'attente pour les services
- Vérification active de l'état "healthy" des containers
- Affichage des logs en cas d'échec
- Boucles de retry pour attendre que les services soient prêts

#### 4. Endpoint de santé dans le backend

L'endpoint `/health` existe déjà dans `Server/src/app.js`:
```javascript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});
```

### Comment tester localement

```bash
# 1. Créer le fichier .env.dev
cp .env.dev.example .env.dev

# 2. Lancer les services
docker compose -f docker-compose.dev.yml up -d --build

# 3. Vérifier l'état des containers
docker compose -f docker-compose.dev.yml ps

# 4. Vérifier les health checks
docker inspect yanotela-backend-dev --format='{{.State.Health.Status}}'
docker inspect yanotela-frontend-dev --format='{{.State.Health.Status}}'

# 5. Tester les endpoints manuellement
curl http://localhost:3001/health
curl http://localhost:3000

# 6. Voir les logs en cas de problème
docker compose -f docker-compose.dev.yml logs backend-dev
docker compose -f docker-compose.dev.yml logs frontend-dev
```

### Checklist de vérification avant déploiement

- [ ] Le fichier `.env.dev` contient toutes les variables nécessaires
- [ ] Les images Docker buildent correctement en local
- [ ] Les health checks fonctionnent en local
- [ ] Le backend répond sur `/health`
- [ ] Le frontend répond sur `/`
- [ ] Les migrations Prisma s'exécutent correctement
- [ ] Redis et PostgreSQL sont accessibles

### Commandes utiles

```bash
# Rebuilder les images en forcant
docker compose -f docker-compose.dev.yml build --no-cache

# Nettoyer les containers et volumes
docker compose -f docker-compose.dev.yml down -v

# Voir les logs en temps réel
docker compose -f docker-compose.dev.yml logs -f

# Exécuter une commande dans un container
docker exec -it yanotela-backend-dev sh
docker exec -it yanotela-frontend-dev sh

# Vérifier la connectivité DB depuis le backend
docker exec -it yanotela-backend-dev npx prisma db pull
```

### Temps d'attente recommandés

- **PostgreSQL**: 30-60 secondes (migrations incluses)
- **Redis**: 10-20 secondes
- **Backend**: 60-90 secondes (migrations + démarrage)
- **Frontend**: 40-60 secondes (Next.js build)

### Prochaines étapes si le problème persiste

1. Vérifier les logs GitHub Actions en détail
2. Se connecter en SSH à l'EC2 et vérifier manuellement
3. Vérifier la mémoire et CPU disponibles sur l'EC2
4. Augmenter les limites de ressources dans docker-compose.dev.yml
5. Vérifier les certificats SSL/TLS pour HTTPS

### Resources

- [Docker Health Checks Documentation](https://docs.docker.com/engine/reference/builder/#healthcheck)
- [Docker Compose Health Checks](https://docs.docker.com/compose/compose-file/compose-file-v3/#healthcheck)
- [GitHub Actions SSH Deployment](https://github.com/appleboy/ssh-action)
