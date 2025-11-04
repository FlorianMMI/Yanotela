# 🔐 Configuration GitHub Secrets - Yanotela CI/CD

Ce guide vous explique comment configurer tous les secrets GitHub nécessaires pour le pipeline CI/CD de Yanotela avec votre configuration actuelle.

## 📋 Secrets GitHub à configurer

### 🖥️ EC2 / AWS Configuration (Votre Configuration Actuelle)

#### `EC2_SSH_PRIVATE_KEY`
- **Description** : Clé privée SSH pour accéder à votre EC2 (13.36.209.205)
- **Format** : Coller tout le contenu du fichier `.pem`, incluant :
```
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA...
...
-----END RSA PRIVATE KEY-----
```

### 🐳 Docker Hub Configuration (Configuration Actuelle)

**Secrets requis :**
- `DOCKER_PASSWORD` : Token d'accès Docker Hub pour le compte `jefee`

**Repositories utilisés :**
- Frontend: `jefee/yanotela-frontend`
- Backend: `jefee/yanotela-backend`

### 📧 Configuration Email (Optionnel - pour les notifications)

#### `NOTIFICATION_EMAIL`
- **Description** : Adresse email pour recevoir les notifications de déploiement
- **Exemple** : `votre.email@gmail.com`

#### `NOTIFICATION_EMAIL_PASSWORD`
- **Description** : Mot de passe d'application Gmail
- **⚠️ Important** : Utiliser un **mot de passe d'application**, pas votre mot de passe principal
- **Comment l'obtenir** :
  1. Aller dans votre compte Google
  2. Sécurité → Validation en deux étapes
  3. Mots de passe d'application → Générer

### 🔒 Configuration Environnement EC2

Votre EC2 (13.36.209.205) doit avoir un fichier `.env.prod` avec la configuration suivante :

```env
# Configuration actuelle pour EC2: 13.36.209.205
EC2_HOST=13.36.209.205

# Docker Configuration
DOCKER_USERNAME=jefee
IMAGE_TAG=latest

# Database Configuration
DB_USER=yanotela_prod
DB_PASSWORD=VOTRE_MOT_DE_PASSE_BDD_FORT
DB_NAME=yanotela_prod

# Redis Configuration
REDIS_PASSWORD=VOTRE_MOT_DE_PASSE_REDIS_FORT

# Session Configuration
SESSION_SECRET=VOTRE_SECRET_SESSION_TRES_FORT_64_CARACTERES_MINIMUM

# Email Configuration
MAIL_SERVICE=gmail
MAIL_USER=contact@votredomaine.com
MAIL_PASSWORD=votre_mot_de_passe_app

# API URLs - CRITIQUE pour éviter les redirections localhost
NEXT_PUBLIC_API_URL=http://13.36.209.205:3001
NEXT_PUBLIC_WS_URL=ws://13.36.209.205:3001
NEXT_PUBLIC_SOCKET_URL=http://13.36.209.205:3001

NODE_ENV=production
```

## 🚀 Étapes de configuration

### 1. Secrets GitHub requis (minimaux)
Pour votre configuration actuelle, vous avez besoin de ces secrets dans GitHub :

**Obligatoires :**
- `EC2_SSH_PRIVATE_KEY` : Votre clé privée SSH pour accéder à 13.36.209.205
- `DOCKER_PASSWORD` : Token d'accès Docker Hub pour le compte `jefee`

**Optionnels (pour les notifications) :**
- `NOTIFICATION_EMAIL` : Votre email
- `NOTIFICATION_EMAIL_PASSWORD` : Mot de passe d'application Gmail

### 2. Configuration sur EC2
Assurez-vous que votre EC2 (13.36.209.205) a :
- Docker et Docker Compose installés
- Le fichier `.env.prod` avec `EC2_HOST=13.36.209.205`
- Les répertoires `/var/www/yanotela` créés

### 3. Test du workflow
Une fois configuré, un push sur `main` déclenchera automatiquement :
1. Tests backend et frontend
2. Build et push des images Docker
3. Déploiement sur EC2
4. Tests de santé des services
5. Notifications par email (si configuré)

## ⚠️ Points critiques pour votre setup

### Configuration EC2_HOST
**CRUCIAL** : Votre `.env.prod` sur EC2 doit contenir :
```bash
EC2_HOST=13.36.209.205
```
Sans cela, le frontend redirigera vers localhost au lieu de votre IP EC2.

### Ports
- Frontend : http://13.36.209.205:3000
- Backend : http://13.36.209.205:3001

## 🆘 Dépannage

### Si le frontend redirige vers localhost
- Vérifiez que `EC2_HOST=13.36.209.205` dans `.env.prod`
- Redémarrez les containers : `sudo docker compose -f docker-compose.prod.yml restart`

### Si les tests échouent
- Utilisez le déploiement forcé : déclenchez manuellement le workflow avec `force_deploy: true`

### Logs utiles
```bash
# Sur EC2, voir les logs
sudo docker compose -f docker-compose.prod.yml logs
```

---

**🎯 Votre workflow est maintenant configuré pour la production !**
