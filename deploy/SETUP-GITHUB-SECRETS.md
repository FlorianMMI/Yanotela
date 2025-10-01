# 🔐 Configuration GitHub Secrets - Yanotela CI/CD

Ce guide vous explique comment configurer tous les secrets GitHub nécessaires pour le pipeline CI/CD de Yanotela.

## 📋 Secrets GitHub à configurer

### 🖥️ EC2 / AWS Configuration

#### `EC2_HOST`
- **Description** : Adresse IP publique de votre instance EC2
- **Format** : `12.34.56.78` ou `ec2-12-34-56-78.eu-west-3.compute.amazonaws.com`
- **Exemple** : `54.123.45.67`

#### `EC2_USER` 
- **Description** : Nom d'utilisateur pour SSH sur EC2
- **Valeurs courantes** : 
  - `ubuntu` (pour Ubuntu)
  - `ec2-user` (pour Amazon Linux)
  - `admin` (pour Debian)

#### `EC2_SSH_PRIVATE_KEY`
- **Description** : Clé privée SSH pour accéder à EC2 (contenu du fichier `.pem`)
- **Format** : Coller tout le contenu du fichier, incluant :
```
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA...
...
-----END RSA PRIVATE KEY-----
```

### 🐳 Docker Registry (Choisir une option)

#### Option A: Docker Hub
```bash
# Activer Docker Hub dans les workflows
USE_DOCKER_HUB=true
```

**Secrets requis :**
- `DOCKER_USERNAME` : Votre nom d'utilisateur Docker Hub
- `DOCKER_PASSWORD` : Token d'accès Docker Hub ou mot de passe

#### Option B: AWS ECR  
```bash  
# Activer AWS ECR dans les workflows
USE_AWS_ECR=true
```

**Secrets requis :**
- `AWS_ACCESS_KEY_ID` : Clé d'accès AWS
- `AWS_SECRET_ACCESS_KEY` : Clé secrète AWS
- `AWS_REGION` : Région AWS (ex: `eu-west-3`)

### 📧 Configuration Email

#### `NOTIFICATION_EMAIL`
- **Description** : Adresse email pour recevoir les notifications
- **Exemple** : `votre.email@gmail.com`

#### `NOTIFICATION_EMAIL_PASSWORD`
- **Description** : Mot de passe d'application Gmail
- **⚠️ Important** : Utiliser un **mot de passe d'application**, pas votre mot de passe principal
- **Comment l'obtenir** :
  1. Aller dans votre compte Google
  2. Sécurité → Validation en deux étapes
  3. Mots de passe d'application → Générer

### 🔒 Fichiers d'environnement

#### `ENV_PROD_FILE`
```env
# Contenu complet du fichier .env.prod
DB_USER=yanotela_prod
DB_PASSWORD=VOTRE_MOT_DE_PASSE_BDD_FORT
DB_NAME=yanotela_prod
DB_HOST=localhost
DB_PORT=5432

REDIS_PASSWORD=VOTRE_MOT_DE_PASSE_REDIS_FORT
REDIS_HOST=localhost
REDIS_PORT=6379

SESSION_SECRET=VOTRE_SECRET_SESSION_TRES_FORT_64_CARACTERES_MINIMUM
JWT_SECRET=VOTRE_SECRET_JWT_TRES_FORT

MAIL_SERVICE=gmail
MAIL_USER=contact@votredomaine.com
MAIL_PASSWORD=votre_mot_de_passe_app
MAIL_FROM="Yanotela <noreply@votredomaine.com>"

CLIENT_URL=https://votredomaine.com
SERVER_URL=https://api.votredomaine.com
NEXT_PUBLIC_API_URL=https://api.votredomaine.com

NODE_ENV=production
ENVIRONMENT=production
LOG_LEVEL=warn
ENABLE_LOGS=true
CORS_ORIGIN=https://votredomaine.com
DISABLE_SSL_VERIFY=false
DEBUG_MODE=false
SECURE_COOKIES=true
```

#### `ENV_PREPROD_FILE`
```env  
# Contenu complet du fichier .env.preprod
DB_USER=yanotela_preprod
DB_PASSWORD=mot_de_passe_preprod_fort
DB_NAME=yanotela_preprod
DB_HOST=localhost
DB_PORT=5433

REDIS_PASSWORD=mot_de_passe_redis_preprod
REDIS_HOST=localhost
REDIS_PORT=6380

SESSION_SECRET=secret_session_preprod_fort
JWT_SECRET=secret_jwt_preprod_fort

MAIL_SERVICE=gmail
MAIL_USER=preprod@votredomaine.com
MAIL_PASSWORD=votre_mot_de_passe_app
MAIL_FROM="Yanotela Preprod <noreply-preprod@votredomaine.com>"

CLIENT_URL=http://VOTRE_IP_EC2:8080
SERVER_URL=http://VOTRE_IP_EC2:8081
NEXT_PUBLIC_API_URL=http://VOTRE_IP_EC2:8081

NODE_ENV=production
ENVIRONMENT=preprod
LOG_LEVEL=info
ENABLE_LOGS=true
CORS_ORIGIN=http://VOTRE_IP_EC2:8080
DISABLE_SSL_VERIFY=true
DEBUG_MODE=true
```

## 🚀 Étapes de configuration

### 1. Accéder aux Secrets GitHub
1. Allez sur votre repository GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Cliquez sur **New repository secret**

### 2. Ajouter chaque secret
Pour chaque secret listé ci-dessus :
1. **Name** : Nom exact du secret (ex: `EC2_HOST`)
2. **Secret** : Valeur du secret
3. Cliquez **Add secret**

### 3. Configurer votre instance EC2

#### Préparer votre EC2
```bash
# Se connecter à EC2
ssh -i votre-cle.pem ubuntu@VOTRE_IP_EC2

# Installer Docker
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker ubuntu

# Créer les répertoires
mkdir -p ~/yanotela ~/yanotela-preprod

# Se déconnecter et reconnecter pour appliquer les groupes
exit
```

### 4. Tester la configuration

#### Test manuel des secrets
```bash
# Cloner votre repo sur EC2
git clone https://github.com/VotreUsername/Yanotela.git ~/yanotela
cd ~/yanotela

# Tester le déploiement preprod
chmod +x deploy/scripts/*.sh
./deploy/scripts/deploy.sh preprod

# Tester le health check
./deploy/scripts/health-check.sh preprod
```

## ⚠️ Sécurité importante

### Mots de passe forts recommandés
```bash
# Générer des mots de passe forts (Linux/Mac)
openssl rand -base64 32  # Pour DB_PASSWORD, REDIS_PASSWORD
openssl rand -base64 64  # Pour SESSION_SECRET, JWT_SECRET

# Sur Windows (PowerShell)
[System.Web.Security.Membership]::GeneratePassword(32, 8)
```

### Bonnes pratiques
- ✅ Utilisez des mots de passe différents pour prod/preprod
- ✅ Activez la 2FA sur votre compte GitHub
- ✅ Utilisez des tokens d'accès, pas des mots de passe
- ✅ Révoquez les anciens secrets avant de les changer
- ❌ Ne commitez JAMAIS les secrets dans le code
- ❌ Ne partagez pas les secrets par email/chat

## 🔍 Vérification

Une fois tous les secrets configurés, vérifiez dans GitHub :
- **Settings** → **Secrets and variables** → **Actions**
- Vous devriez voir tous les secrets listés (valeurs cachées)

## 🆘 Dépannage

### Erreurs courantes
1. **SSH Failed** : Vérifiez `EC2_HOST`, `EC2_USER`, `EC2_SSH_PRIVATE_KEY`
2. **Docker Build Failed** : Vérifiez `DOCKER_USERNAME`, `DOCKER_PASSWORD`  
3. **Health Check Failed** : Vérifiez les ports sur EC2 et Security Groups
4. **Email Failed** : Vérifiez `NOTIFICATION_EMAIL_PASSWORD` (mot de passe d'app)

### Logs utiles
```bash
# Voir les logs GitHub Actions
# → Repository → Actions → Cliquer sur le workflow failed

# Voir les logs sur EC2  
docker-compose -f docker-compose.prod.yml logs
```

---

**🎯 Une fois configuré, votre CI/CD sera pleinement fonctionnel !**