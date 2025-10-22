# 🚀 Development Deployment - Yanotela# 🚀 CI/CD Yanotela - Guide de déploiement



Automated development deployment pipeline for Yanotela using Docker and EC2.Pipeline automatisé pour déployer Yanotela sur AWS EC2 avec Docker.



## 📋 Development Workflow## 📋 Flux de déploiement



```mermaid```mermaid

graph LRgraph LR

    A[Push to Develop] --> B[🧪 Build Dev Images]    A[Push develop] --> B[🧪 Vérification Preprod]

    B --> C[🐳 Push to Docker Hub]    B --> C[� Notification]

    C --> D[🚀 Deploy to Dev EC2]    C --> D[� Test local manuel]

    D --> E[🏥 Health Check]    

    E --> F[📧 Notification]    E[Push main] --> F[🧪 Tests Prod]

```    F --> G[🐳 Build Images]

```mermaid
graph LR
    A[Push develop] --> B[🧪 Vérification Preprod]
    B --> C[� Notification]
    C --> D[� Test local manuel]
    
    E[Push main] --> F[🧪 Tests Prod]
    F --> G[🐳 Build Images]
    G --> H[🚀 Deploy Production]
    H --> I[🏥 Health Check]
    I --> J[📧 Notification]

### 1. GitHub Secrets```

📁 See complete guide: [`deploy/SETUP-DEV-SECRETS.md`](./SETUP-DEV-SECRETS.md)

## 🔧 Configuration requise

**Required secrets:**

- `DOCKER_PASSWORD` - Docker Hub access token### 1. Secrets GitHub

- `EC2_SSH_PRIVATE_KEY` - SSH key for development EC2 (yanotela.fr)📁 Voir le guide complet : [`deploy/SETUP-GITHUB-SECRETS.md`](./SETUP-GITHUB-SECRETS.md)



### 2. Development EC2 Setup**Secrets obligatoires :**

**Secrets obligatoires :**
- `EC2_HOST`, `EC2_USER`, `EC2_SSH_PRIVATE_KEY`
- `DOCKER_USERNAME`, `DOCKER_PASSWORD` (Docker Hub)
- `NOTIFICATION_EMAIL`, `NOTIFICATION_EMAIL_PASSWORD`
- `ENV_PROD_FILE`, `ENV_PREPROD_FILE`

```bash- `ENV_PROD_FILE`, `ENV_PREPROD_FILE`

# On your development EC2 (yanotela.fr)

chmod +x deploy/scripts/setup-ec2.sh### 2. Instance EC2

./deploy/scripts/setup-ec2.sh```bash

```# Installer Docker sur EC2

sudo apt update && sudo apt install -y docker.io docker-compose

This will:sudo usermod -aG docker ubuntu

- Install Docker and Docker Compose

- Setup development directories# Créer les répertoires

- Configure firewall for development ports (3000, 3001)mkdir -p ~/yanotela ~/yanotela-preprod

- Setup development environment```



### 3. Deployment Process## 🎯 Utilisation



1. **Automatic**: Push to `Develop` branch triggers deployment### Déploiement automatique

2. **Manual**: Run development build script locally:- **Push sur `develop`** → ✅ Vérification du code (tests + build)

   ```bash- **Push sur `main`** → 🚀 Déploiement production automatique

   ./deploy/scripts/build-and-push-dev.sh

   ```### Test preprod (local)

```bash
# Installer Docker sur EC2
sudo apt update && sudo apt install -y docker.io docker-compose
sudo usermod -aG docker ubuntu

# Créer les répertoires
mkdir -p ~/yanotela ~/yanotela-preprod
```

## 🎯 Utilisation

### Déploiement automatique
- **Push sur `develop`** → ✅ Vérification du code (tests + build)
- **Push sur `main`** → 🚀 Déploiement production automatique

### Test preprod (local)
```bash
# Après vérification réussie sur develop :
git checkout develop && git pull
docker-compose -f docker-compose.preprod.yml up --build
# Accès: http://localhost:8080
```

### Déploiement manuel production
```bash
# Via GitHub Actions
Repository → Actions → Select workflow → Run workflow

- **Frontend**: `jefee/yanotela-frontend-dev:develop`# Accès: http://localhost:8080

- **Backend**: `jefee/yanotela-backend-dev:develop````



### Development Server### Déploiement manuel production

- **Host**: yanotela.fr```bash

- **Frontend**: https://yanotela.fr:3000# Via GitHub Actions

- **Backend**: https://yanotela.fr:3001Repository → Actions → Select workflow → Run workflow



### Configuration Files# Via scripts locaux (sur EC2)

- **Docker Compose**: `docker-compose.dev.yml`./deploy/scripts/deploy.sh prod

- **Environment**: `.env.dev.template` (copy to `.env.dev`)```

- **Build Script**: `deploy/scripts/build-and-push-dev.sh`

## 🔍 Monitoring

## 🛠️ Available Scripts

### Health checks

### `deploy/scripts/build-and-push-dev.sh````bash

Builds and pushes development Docker images to Docker Hub.# Vérifier le statut production

./deploy/scripts/health-check.sh prod

### `deploy/scripts/setup-ec2.sh`

Sets up a fresh EC2 instance for development deployment.# Test local (preprod)

curl http://localhost:8080         # Frontend local

### `deploy/scripts/ec2-setup-commands.sh`curl http://localhost:8081/health  # Backend local

Commands to run on EC2 after initial setup.

# Production

### `deploy/scripts/health-check.sh`curl http://VOTRE_IP              # Prod frontend  

Checks if the development application is running correctly.curl http://VOTRE_IP:3001/health  # Prod backend

```

## 🔧 Troubleshooting

### Logs

### Common Issues```bash

# Logs services locaux (preprod)

1. **SSH Connection Failed**docker-compose -f docker-compose.preprod.yml logs -f

   - Verify SSH key permissions: `chmod 600 your-key.pem`

   - Check EC2 security group allows SSH (port 22)# Logs production

docker-compose -f docker-compose.prod.yml logs -f

2. **Docker Build Failed**

   - Check Docker Hub credentials in GitHub secrets# Logs GitHub Actions

   - Verify repository names match development reposRepository → Actions → Cliquer sur le workflow

```

3. **Deployment Failed**

   - Check EC2 has Docker installed: `docker --version`## 🔄 Rollback

   - Verify development directories exist: `ls ~/yanotela-dev`

### Automatique (production uniquement)

### Logs and MonitoringLe rollback s'effectue automatiquement en cas d'échec du health check en production.



Check deployment logs:### Manuel

```bash```bash

# On development EC2# Production seulement

sudo docker compose -f docker-compose.dev.yml logs -f./deploy/scripts/rollback.sh prod

```

# Local (preprod) : pas de rollback nécessaire

Check service status:docker-compose -f docker-compose.preprod.yml down

```bashgit checkout previous-commit

sudo docker compose -f docker-compose.dev.yml psdocker-compose -f docker-compose.preprod.yml up --build

``````



## 🔒 Security Notes## 📧 Notifications



- Development environment uses separate Docker repositoriesVous recevrez des emails automatiques pour :

- Different SSH keys for development vs production- ✅ Déploiement réussi

- Development database credentials should be different- ❌ Déploiement échoué

- Regular rotation of access tokens recommended- 🔄 Rollback effectué



## 📈 Next Steps## 🛠️ Scripts utiles



After successful development deployment:### Test preprod en local

1. Test application functionality```bash

2. Verify database connections# Démarrer l'environnement de test

3. Check health endpointsdocker-compose -f docker-compose.preprod.yml up --build -d

4. Review logs for any issues

5. Prepare for production deployment when ready# Vérifier les services
curl http://localhost:8080        # Frontend
curl http://localhost:8081/health # Backend

# Développement classique (sans Docker)
cd Server && npm run dev         # Backend sur :3001
cd Client && npm run dev         # Frontend sur :3000
```

### Nettoyage
```bash
# Nettoyer les ressources Docker
docker system prune -af
docker volume prune -f

# Nettoyer les anciens backups
find . -name "backup_*" -type d -mtime +7 -exec rm -rf {} \;
```

## 🚨 Dépannage

### Problèmes courants

#### 🔑 Erreur SSH
```bash
# Vérifier la connectivité
ssh -i votre-cle.pem ubuntu@VOTRE_IP_EC2

# Vérifier les permissions de la clé
chmod 600 votre-cle.pem
```

#### 🐳 Erreur Docker
```bash
# Vérifier Docker sur EC2
docker --version
docker-compose --version
sudo usermod -aG docker ubuntu
```

#### 🏥 Health check échoué
```bash
# Local (preprod)
docker-compose -f docker-compose.preprod.yml ps
curl http://localhost:8080
curl http://localhost:8081/health

# Production 
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3001

# Vérifier les Security Groups AWS
# - Port 22 (SSH)
# - Port 80 (Prod frontend)  
# - Port 3001 (Prod backend)
```

#### 📧 Emails non reçus
```bash
# Vérifier la configuration Gmail
# 1. Activer la validation en 2 étapes
# 2. Générer un mot de passe d'application
# 3. Utiliser ce mot de passe dans NOTIFICATION_EMAIL_PASSWORD
```

### Logs de débogage
```bash
# Voir tous les containers
docker ps -a

# Logs détaillés d'un service
docker logs CONTAINER_NAME

# Logs en temps réel
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```

## 📁 Structure des fichiers

```
yanotela/
├── .github/workflows/
│   ├── production.yml      # Pipeline main → prod
│   └── preprod.yml         # Pipeline develop → preprod
├── deploy/
│   ├── scripts/
│   │   ├── deploy.sh       # Script de déploiement
│   │   ├── health-check.sh # Vérification santé
│   │   └── rollback.sh     # Script de rollback
│   ├── SETUP-GITHUB-SECRETS.md
│   └── README.md           # Ce fichier
├── docker-compose.yml      # Développement local
├── docker-compose.preprod.yml
├── docker-compose.prod.yml
├── .env.preprod
└── .env.prod
```

## 🎉 Prêt à déployer !

1. ✅ Configurez vos secrets GitHub
2. ✅ Préparez votre instance EC2  
3. ✅ Poussez sur `develop` pour tester
4. ✅ Poussez sur `main` pour la production

**🚀 Votre CI/CD est maintenant opérationnel !**
