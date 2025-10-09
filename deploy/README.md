# 🚀 Deployment Guide - Yanotela

This directory contains all deployment configurations and scripts for Yanotela.

## � Documentation

### Quick Start
- **[Quick Start Guide](./QUICKSTART.md)** - Get up and running in 15 minutes
- **[Complete Setup Guide](./DOCKER-HUB-EC2-SETUP.md)** - Detailed documentation with troubleshooting

### Setup Guides
- **[GitHub Secrets Setup](./SETUP-GITHUB-SECRETS.md)** - Configure CI/CD secrets

## 🐳 Docker Hub & EC2 Deployment

### Architecture
```
┌─────────────────┐      ┌──────────────┐      ┌─────────────┐
│  GitHub Repo    │─────▶│  Docker Hub  │─────▶│  EC2 Server │
│  (Source Code)  │      │  (Images)    │      │  (Running)  │
└─────────────────┘      └──────────────┘      └─────────────┘
        │                                              │
        │                                              │
        └──────────── GitHub Actions ─────────────────┘
```

### Deployment Flow

1. **Code Push** → Push to `main` branch
2. **CI/CD Trigger** → GitHub Actions starts
3. **Tests** → Backend and frontend tests run
4. **Build** → Docker images are built
5. **Push** → Images pushed to Docker Hub
6. **Deploy** → EC2 pulls images and restarts services
7. **Verify** → Health checks confirm deployment

## 📁 Directory Structure

```
deploy/
├── QUICKSTART.md                 # Quick start guide
├── DOCKER-HUB-EC2-SETUP.md      # Complete setup documentation
├── SETUP-GITHUB-SECRETS.md       # GitHub secrets configuration
├── deploy-preprod.sh             # Preprod deployment script
├── deploy-prod.sh                # Production deployment script
└── scripts/
    ├── build-and-push.sh         # Build and push Docker images
    ├── deploy-ec2.sh             # EC2 deployment automation
    ├── deploy.sh                 # Legacy deployment script
    ├── health-check.sh           # Service health verification
    ├── rollback.sh               # Rollback to previous version
    └── setup-ec2.sh              # EC2 initial setup script
```

## 🚀 Deployment Methods

### 1. Automatic Deployment (Recommended)
Push to `main` branch and GitHub Actions handles everything:
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

### 2. Manual Deployment - Using Scripts
```bash
# Build and push images locally
cd deploy/scripts
chmod +x build-and-push.sh
./build-and-push.sh latest your-dockerhub-username

# Deploy to EC2
ssh ubuntu@your-ec2-host
cd /var/www/yanotela
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

### 3. Manual Deployment - Docker Commands
```bash
# On local machine - Build images
docker build -t username/yanotela-frontend:latest ./Client
docker build -t username/yanotela-backend:latest ./Server
docker push username/yanotela-frontend:latest
docker push username/yanotela-backend:latest

# On EC2 - Deploy
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## 📦 Scripts Reference

### build-and-push.sh
Build and push Docker images to Docker Hub.
```bash
./scripts/build-and-push.sh [tag] [dockerhub_username]
```

### deploy-ec2.sh
Complete automated deployment on EC2 instance.
```bash
./scripts/deploy-ec2.sh
```

### health-check.sh
Verify service health after deployment.
```bash
./scripts/health-check.sh prod
```

### rollback.sh
Rollback to previous deployment.
```bash
./scripts/rollback.sh
```

## 🔍 Monitoring

### Check Service Status
```bash
# On EC2
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Health Checks
- Frontend: `http://your-ec2-ip:3000`
- Backend: `http://your-ec2-ip:3001/health`
- Database: Check logs for connection status

## 🐛 Troubleshooting

See the [Complete Setup Guide](./DOCKER-HUB-EC2-SETUP.md#troubleshooting) for detailed troubleshooting steps.

### Quick Fixes

**Services not starting:**
```bash
docker-compose -f docker-compose.prod.yml logs
```

**Reset everything:**
```bash
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```

## 🔐 Security Best Practices

1. ✅ Use SSH keys instead of passwords
2. ✅ Store secrets in GitHub Secrets, never in code
3. ✅ Use private Docker Hub repositories for production
4. ✅ Regularly update dependencies and base images
5. ✅ Configure EC2 security groups properly
6. ✅ Use environment-specific .env files

## 📊 Workflow Files

### GitHub Actions Workflows
- `.github/workflows/docker-hub-ec2.yml` - Main CI/CD pipeline
- `.github/workflows/production.yml` - Legacy production workflow
- `.github/workflows/preprod.yml` - Preprod verification

## 🆘 Support

1. Check [QUICKSTART.md](./QUICKSTART.md) for quick solutions
2. Review [DOCKER-HUB-EC2-SETUP.md](./DOCKER-HUB-EC2-SETUP.md) for detailed info
3. Check GitHub Actions logs for CI/CD issues
4. Check EC2 system logs: `/var/log/syslog`
5. Check Docker logs on EC2

## 📚 Additional Resources

- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
```

## 🔍 Monitoring

### Health checks
```bash
# Vérifier le statut production
./deploy/scripts/health-check.sh prod

# Test local (preprod)
curl http://localhost:8080         # Frontend local
curl http://localhost:8081/health  # Backend local

# Production
curl http://VOTRE_IP              # Prod frontend  
curl http://VOTRE_IP:3001/health  # Prod backend
```

### Logs
```bash
# Logs services locaux (preprod)
docker-compose -f docker-compose.preprod.yml logs -f

# Logs production
docker-compose -f docker-compose.prod.yml logs -f

# Logs GitHub Actions
Repository → Actions → Cliquer sur le workflow
```

## 🔄 Rollback

### Automatique (production uniquement)
Le rollback s'effectue automatiquement en cas d'échec du health check en production.

### Manuel
```bash
# Production seulement
./deploy/scripts/rollback.sh prod

# Local (preprod) : pas de rollback nécessaire
docker-compose -f docker-compose.preprod.yml down
git checkout previous-commit
docker-compose -f docker-compose.preprod.yml up --build
```

## 📧 Notifications

Vous recevrez des emails automatiques pour :
- ✅ Déploiement réussi
- ❌ Déploiement échoué
- 🔄 Rollback effectué

## 🛠️ Scripts utiles

### Test preprod en local
```bash
# Démarrer l'environnement de test
docker-compose -f docker-compose.preprod.yml up --build -d

# Vérifier les services
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
