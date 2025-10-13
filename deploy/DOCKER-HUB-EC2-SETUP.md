# 🚀 Docker Hub & EC2 CI/CD Setup Guide

This guide will walk you through setting up a complete CI/CD pipeline for deploying your Yanotela application to an AWS EC2 instance using Docker Hub.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Docker Hub Setup](#docker-hub-setup)
3. [GitHub Secrets Configuration](#github-secrets-configuration)
4. [EC2 Instance Setup](#ec2-instance-setup)
5. [Manual Deployment](#manual-deployment)
6. [Automated CI/CD Deployment](#automated-cicd-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- ✅ GitHub account with repository access
- ✅ Docker Hub account (free tier is sufficient)
- ✅ AWS account with EC2 access

### Required Tools (for manual deployment)
- Docker Desktop or Docker Engine
- Git
- SSH client

---

## 🐳 Docker Hub Setup

### 1. Create Docker Hub Account
1. Go to [Docker Hub](https://hub.docker.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Create Repositories (Optional)
Docker Hub will automatically create repositories when you first push images, but you can create them manually:

1. Go to "Repositories" in Docker Hub
2. Click "Create Repository"
3. Create two repositories:
   - `yanotela-frontend`
   - `yanotela-backend`
4. Set visibility to **Private** (recommended for production) or **Public**

### 3. Generate Access Token
For CI/CD, use an access token instead of your password:

1. Go to Account Settings → Security
2. Click "New Access Token"
3. Name it: `github-actions-yanotela`
4. Copy the token (you won't see it again!)

---

## 🔐 GitHub Secrets Configuration

Add these secrets to your GitHub repository:

### Navigate to Secrets
1. Go to your repository on GitHub
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"

### Required Secrets

#### Docker Hub Credentials
```
Name: DOCKER_USERNAME
Value: your-dockerhub-username
```

```
Name: DOCKER_PASSWORD
Value: your-dockerhub-access-token
```

#### EC2 Connection
```
Name: EC2_HOST
Value: ec2-xx-xxx-xxx-xxx.compute-1.amazonaws.com (or IP address)
```

```
Name: EC2_USER
Value: ubuntu (or ec2-user for Amazon Linux)
```

```
Name: EC2_SSH_PRIVATE_KEY
Value: (paste your private SSH key here)
```

To generate SSH key pair:
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/yanotela-ec2 -N ""
# Add the PUBLIC key to EC2 instance: ~/.ssh/authorized_keys
# Use the PRIVATE key for the GitHub secret
```

#### Environment Configuration
```
Name: ENV_PROD_FILE
Value: (entire content of your .env.prod file)
```

Example `.env.prod` content:
```env
# Database
DB_USER=yanotela_prod
DB_PASSWORD=your_secure_password_here
DB_NAME=yanotela_prod

# Redis
REDIS_PASSWORD=your_redis_password_here

# Application
NODE_ENV=production
SESSION_SECRET=your_session_secret_here

# Mail Configuration
MAIL_SERVICE=gmail
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your_app_specific_password

# API URL (adjust to your domain)
NEXT_PUBLIC_API_URL=http://your-domain.com:3001

# Docker Configuration
DOCKER_USERNAME=your-dockerhub-username
IMAGE_TAG=latest
```

#### Email Notifications (Optional)
```
Name: NOTIFICATION_EMAIL
Value: your-email@gmail.com
```

```
Name: NOTIFICATION_EMAIL_PASSWORD
Value: your-app-specific-password
```

---

## ☁️ EC2 Instance Setup

### 1. Launch EC2 Instance

**Recommended Specifications:**
- **Instance Type:** t2.medium or t3.medium (minimum)
- **OS:** Ubuntu 22.04 LTS or Amazon Linux 2023
- **Storage:** 20 GB minimum (30 GB recommended)
- **Security Group:** Open ports:
  - SSH: 22
  - Frontend: 3000
  - Backend: 3001
  - PostgreSQL: 5432 (only if accessing externally)

### 2. Connect to EC2
```bash
ssh -i "your-key.pem" ubuntu@your-ec2-host
```

### 3. Initial Server Setup

Run these commands on your EC2 instance:

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install required packages
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (replace ubuntu with your username)
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version

# Log out and log back in for group changes to take effect
exit
```

### 4. Create Project Directory
```bash
ssh -i "your-key.pem" ubuntu@your-ec2-host

sudo mkdir -p /var/www/yanotela
sudo chown $USER:$USER /var/www/yanotela
cd /var/www/yanotela
```

### 5. Login to Docker Hub
```bash
docker login
# Enter your Docker Hub username and password/token
```

---

## 🛠️ Manual Deployment

### Option 1: Using the Build and Push Script (Local Build)

**On your local machine:**

1. **Update the script with your Docker Hub username:**
   ```bash
   cd deploy/scripts
   chmod +x build-and-push.sh
   ```

2. **Login to Docker Hub:**
   ```bash
   docker login
   ```

3. **Build and push images:**
   ```bash
   ./build-and-push.sh latest yourdockerhubusername
   ```

### Option 2: Manual Docker Commands

```bash
# Build Frontend
docker build -t yourusername/yanotela-frontend:latest ./Client

# Build Backend
docker build -t yourusername/yanotela-backend:latest ./Server

# Push to Docker Hub
docker push yourusername/yanotela-frontend:latest
docker push yourusername/yanotela-backend:latest
```

### Deploy to EC2

**On your EC2 instance:**

1. **Copy necessary files:**
   ```bash
   cd /var/www/yanotela
   
   # Copy docker-compose.prod.yml from your repo
   # Copy .env.prod with your configuration
   ```

2. **Create .env.prod file:**
   ```bash
   nano .env.prod
   # Add your environment variables (see example above)
   ```

3. **Export Docker Hub username:**
   ```bash
   export DOCKER_USERNAME=yourdockerhubusername
   export IMAGE_TAG=latest
   ```

4. **Pull and start services:**
   ```bash
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```

5. **Check status:**
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   docker-compose -f docker-compose.prod.yml logs -f
   ```

---

## 🤖 Automated CI/CD Deployment

Once you've configured GitHub secrets, the CI/CD pipeline will automatically:

### Trigger Conditions
- **Push to `main` branch**: Runs tests, builds images, and deploys to EC2
- **Pull request to `main`**: Runs tests only (no deployment)
- **Manual trigger**: Via GitHub Actions UI with optional parameters

### Workflow Steps

1. **Test Backend** 🧪
   - Sets up PostgreSQL test database
   - Runs backend tests

2. **Test Frontend** 🧪
   - TypeScript checks
   - Build verification
   - Unit tests (if configured)

3. **Build & Push Images** 🐳
   - Builds frontend and backend Docker images
   - Tags with commit SHA and `latest`
   - Pushes to Docker Hub

4. **Deploy to EC2** 🚀
   - Connects to EC2 via SSH
   - Copies deployment files
   - Pulls latest images
   - Restarts services with zero-downtime

5. **Health Checks** 🏥
   - Verifies frontend is responding
   - Verifies backend API is healthy

6. **Notifications** 📧
   - Sends email on success/failure (if configured)

### Manual Workflow Trigger

1. Go to **Actions** tab in GitHub
2. Select **"CI/CD - Docker Hub & EC2 Deployment"**
3. Click **"Run workflow"**
4. Optional parameters:
   - `force_deploy`: Deploy even if tests fail
   - `image_tag`: Custom tag for Docker images

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Docker Images Not Found
**Problem:** `Error: image not found`

**Solution:**
```bash
# Check if images exist on Docker Hub
# Go to https://hub.docker.com/r/yourusername/yanotela-frontend

# Ensure DOCKER_USERNAME is set correctly
export DOCKER_USERNAME=yourdockerhubusername

# Pull images manually
docker pull $DOCKER_USERNAME/yanotela-frontend:latest
docker pull $DOCKER_USERNAME/yanotela-backend:latest
```

#### 2. SSH Connection Failed
**Problem:** GitHub Actions can't connect to EC2

**Solution:**
- Verify EC2 security group allows SSH from GitHub IPs
- Check SSH key format in GitHub secret (should be entire private key)
- Test SSH connection manually:
  ```bash
  ssh -i key.pem ubuntu@ec2-host
  ```

#### 3. Services Not Starting
**Problem:** Containers exit immediately

**Solution:**
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check environment variables
docker-compose -f docker-compose.prod.yml config

# Verify .env.prod exists and is correct
cat .env.prod
```

#### 4. Database Connection Issues
**Problem:** Backend can't connect to database

**Solution:**
```bash
# Check database is running
docker-compose -f docker-compose.prod.yml ps db-prod

# Check database logs
docker-compose -f docker-compose.prod.yml logs db-prod

# Verify DATABASE_URL in .env.prod
# Should be: postgresql://user:pass@db-prod:5432/dbname
```

#### 5. Health Checks Failing
**Problem:** Health check endpoints return errors

**Solution:**
```bash
# Check if services are actually running
curl http://localhost:3000
curl http://localhost:3001/health

# Check container logs
docker-compose -f docker-compose.prod.yml logs frontend-prod
docker-compose -f docker-compose.prod.yml logs backend-prod
```

### Useful Commands

```bash
# View all running containers
docker ps

# View all containers (including stopped)
docker ps -a

# Check container logs
docker logs yanotela-frontend-prod
docker logs yanotela-backend-prod

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop and remove all containers
docker-compose -f docker-compose.prod.yml down

# Remove all containers and volumes (⚠️ destructive)
docker-compose -f docker-compose.prod.yml down -v

# View Docker Hub images
docker images | grep yanotela

# Clean up unused images
docker image prune -a
```

---

## 📊 Monitoring & Maintenance

### View Logs
```bash
# Follow all logs
docker-compose -f docker-compose.prod.yml logs -f

# Follow specific service
docker-compose -f docker-compose.prod.yml logs -f backend-prod

# View last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### Database Backups
```bash
# Backup database
docker exec yanotela-db-prod pg_dump -U yanotela_prod yanotela_prod > backup_$(date +%Y%m%d).sql

# Restore database
docker exec -i yanotela-db-prod psql -U yanotela_prod yanotela_prod < backup_20241009.sql
```

### Updates
```bash
# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Restart with new images
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🎯 Next Steps

1. **Configure Domain:**
   - Set up DNS records pointing to your EC2 IP
   - Configure reverse proxy (Nginx) for SSL/HTTPS
   - Update NEXT_PUBLIC_API_URL in .env.prod

2. **Add SSL Certificate:**
   ```bash
   sudo apt-get install certbot
   sudo certbot --nginx -d yourdomain.com
   ```

3. **Set Up Monitoring:**
   - Configure CloudWatch for EC2 metrics
   - Set up application monitoring (e.g., Sentry, DataDog)
   - Enable Docker stats monitoring

4. **Implement Backups:**
   - Automate database backups
   - Configure S3 for backup storage
   - Test backup restoration process

---

## 📚 Additional Resources

- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

## 🆘 Support

If you encounter issues:
1. Check GitHub Actions logs
2. Check EC2 instance logs
3. Check Docker container logs
4. Review this troubleshooting guide

For further assistance, contact your team or create an issue in the repository.
