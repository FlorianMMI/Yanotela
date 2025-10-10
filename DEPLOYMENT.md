# 🚀 Docker Hub & EC2 Deployment - Quick Reference

This project now includes a complete CI/CD pipeline for deploying to AWS EC2 via Docker Hub!

## 📚 Documentation

All deployment documentation is in the `deploy/` directory:

- **[📖 Quick Start (15 min)](./deploy/QUICKSTART.md)** ← Start here!
- **[📘 Complete Setup Guide](./deploy/DOCKER-HUB-EC2-SETUP.md)** - Detailed instructions
- **[✅ Deployment Checklist](./deploy/DEPLOYMENT-CHECKLIST.md)** - Verification steps
- **[📋 Setup Summary](./deploy/SETUP-SUMMARY.md)** - Overview of everything created
- **[🛠️ Scripts Reference](./deploy/README.md)** - Available scripts and commands

## ⚡ Quick Start

### 1. Prerequisites
- Docker Hub account
- AWS EC2 instance (Ubuntu 22.04, t2.medium)
- GitHub repository access

### 2. Setup (One-time)
```bash
# Configure GitHub Secrets (6 required)
# - DOCKER_USERNAME, DOCKER_PASSWORD
# - EC2_HOST, EC2_USER, EC2_SSH_PRIVATE_KEY
# - ENV_PROD_FILE

# On EC2 instance:
curl -fsSL https://raw.githubusercontent.com/your-repo/main/deploy/scripts/setup-ec2-quick.sh | bash
```

### 3. Deploy
```bash
# Automatic (recommended):
git push origin main
# GitHub Actions handles everything!

# Manual (if needed):
./deploy/scripts/build-and-push.sh latest your-dockerhub-username
ssh ubuntu@your-ec2-host
cd /var/www/yanotela && ./deploy-ec2.sh
```

## 🎯 What You Get

✅ **Automated CI/CD Pipeline**
- Automatic tests on every push
- Build and push Docker images to Docker Hub
- Deploy to EC2 with zero downtime
- Health checks and rollback

✅ **Production-Ready Setup**
- Multi-stage Docker builds
- Health checks for all services
- Automatic backups before deployment
- Detailed logging and monitoring

✅ **Complete Documentation**
- Step-by-step guides
- Troubleshooting section
- Deployment checklist
- Script references

## 🔧 Available Scripts

Located in `deploy/scripts/`:

- **`build-and-push.sh`** - Build and push images to Docker Hub
- **`deploy-ec2.sh`** - Complete automated EC2 deployment
- **`setup-ec2-quick.sh`** - Initial EC2 instance setup
- **`health-check.sh`** - Verify service health
- **`rollback.sh`** - Rollback to previous version

## 📊 CI/CD Workflow

```
Push to main → Tests → Build → Push to Docker Hub → Deploy to EC2 → Health Check → Notification
```

## 🆘 Need Help?

1. Check [Quick Start Guide](./deploy/QUICKSTART.md)
2. Review [Troubleshooting Section](./deploy/DOCKER-HUB-EC2-SETUP.md#troubleshooting)
3. Use [Deployment Checklist](./deploy/DEPLOYMENT-CHECKLIST.md)
4. Check GitHub Actions logs
5. Review EC2 logs: `yanotela-logs`

## 🔗 Important URLs

- **GitHub Actions:** Repository → Actions tab
- **Docker Hub:** https://hub.docker.com/u/your-username
- **Frontend:** http://your-ec2-ip:3000
- **Backend:** http://your-ec2-ip:3001

---

**For complete documentation, see [deploy/QUICKSTART.md](./deploy/QUICKSTART.md)**
