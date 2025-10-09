# 🚀 Quick Start: Docker Hub & EC2 Deployment

This is a condensed guide for getting your Yanotela app deployed quickly.

## ⚡ Prerequisites Checklist

- [ ] Docker Hub account created
- [ ] AWS EC2 instance launched (Ubuntu 22.04, t2.medium)
- [ ] Security group configured (ports 22, 3000, 3001)
- [ ] SSH key pair generated and added to EC2

## 🔑 Step 1: Configure GitHub Secrets

Add these 5 essential secrets in GitHub → Settings → Secrets:

1. `DOCKER_USERNAME` - Your Docker Hub username
2. `DOCKER_PASSWORD` - Docker Hub access token
3. `EC2_HOST` - EC2 public DNS or IP
4. `EC2_USER` - `ubuntu` (or `ec2-user`)
5. `EC2_SSH_PRIVATE_KEY` - Your SSH private key
6. `ENV_PROD_FILE` - Your complete .env.prod file content

## 📝 Step 2: Prepare .env.prod

Create this content for your `ENV_PROD_FILE` secret:

```env
# Database
DB_USER=yanotela_prod
DB_PASSWORD=CHANGE_THIS_PASSWORD
DB_NAME=yanotela_prod

# Redis
REDIS_PASSWORD=CHANGE_THIS_PASSWORD

# Application
NODE_ENV=production
SESSION_SECRET=CHANGE_THIS_SECRET_KEY

# Mail
MAIL_SERVICE=gmail
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# API URL
NEXT_PUBLIC_API_URL=http://YOUR_EC2_IP:3001

# Docker
DOCKER_USERNAME=your-dockerhub-username
IMAGE_TAG=latest
```

## 🖥️ Step 3: Setup EC2 Instance

SSH into your EC2 and run:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create project directory
sudo mkdir -p /var/www/yanotela
sudo chown ubuntu:ubuntu /var/www/yanotela

# Login to Docker Hub
docker login
```

Log out and back in for changes to take effect.

## 🚀 Step 4: Deploy

### Automatic Deployment (Recommended)
Simply push to the `main` branch:

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

The GitHub Actions workflow will:
- ✅ Run tests
- ✅ Build Docker images
- ✅ Push to Docker Hub
- ✅ Deploy to EC2
- ✅ Run health checks

### Manual Deployment (Alternative)

**On your local machine:**
```bash
# Login to Docker Hub
docker login

# Build and push images
cd deploy/scripts
chmod +x build-and-push.sh
./build-and-push.sh latest your-dockerhub-username
```

**On your EC2 instance:**
```bash
cd /var/www/yanotela

# Create docker-compose.prod.yml (copy from repo)
# Create .env.prod (with your configuration)

# Set environment variables
export DOCKER_USERNAME=your-dockerhub-username
export IMAGE_TAG=latest

# Deploy
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

## ✅ Step 5: Verify Deployment

Access your application:

- **Frontend:** `http://YOUR_EC2_IP:3000`
- **Backend:** `http://YOUR_EC2_IP:3001/health`

Check logs if needed:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

## 🐛 Quick Troubleshooting

**Services not starting?**
```bash
docker-compose -f docker-compose.prod.yml logs
```

**Can't connect to database?**
```bash
docker-compose -f docker-compose.prod.yml logs db-prod
```

**GitHub Actions failing?**
- Check Actions tab for detailed logs
- Verify all secrets are set correctly
- Ensure EC2 security group allows SSH

## 📚 Full Documentation

For detailed setup, troubleshooting, and advanced configuration, see:
- [Complete Setup Guide](./DOCKER-HUB-EC2-SETUP.md)
- [Deployment Scripts](./scripts/)

## 🎯 What's Next?

1. Set up a domain name and SSL certificate
2. Configure automated backups
3. Set up monitoring and alerts
4. Implement staging environment

---

**Need help?** Check the [full documentation](./DOCKER-HUB-EC2-SETUP.md) or review GitHub Actions logs.
