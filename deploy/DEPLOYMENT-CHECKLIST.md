# ✅ Deployment Checklist

Use this checklist to ensure all steps are completed for successful deployment.

## 📋 Pre-Deployment Checklist

### Docker Hub Setup
- [ ] Docker Hub account created
- [ ] Access token generated
- [ ] Repositories created (optional):
  - [ ] `yanotela-frontend`
  - [ ] `yanotela-backend`

### AWS EC2 Setup
- [ ] EC2 instance launched
  - [ ] Instance type: t2.medium or better
  - [ ] OS: Ubuntu 22.04 LTS
  - [ ] Storage: 20+ GB
- [ ] Security group configured:
  - [ ] Port 22 (SSH) - Your IP
  - [ ] Port 3000 (Frontend) - Public
  - [ ] Port 3001 (Backend) - Public
  - [ ] Port 5432 (PostgreSQL) - Optional
- [ ] SSH key pair generated and saved
- [ ] Elastic IP assigned (recommended for production)

### GitHub Configuration
- [ ] Repository access confirmed
- [ ] GitHub Secrets configured:
  - [ ] `DOCKER_USERNAME`
  - [ ] `DOCKER_PASSWORD`
  - [ ] `EC2_HOST`
  - [ ] `EC2_USER`
  - [ ] `EC2_SSH_PRIVATE_KEY`
  - [ ] `ENV_PROD_FILE`
  - [ ] `NOTIFICATION_EMAIL` (optional)
  - [ ] `NOTIFICATION_EMAIL_PASSWORD` (optional)

### Environment Configuration
- [ ] `.env.prod` file prepared with:
  - [ ] Database credentials
  - [ ] Redis password
  - [ ] Session secret
  - [ ] Mail configuration
  - [ ] API URL
  - [ ] Docker username

## 🖥️ EC2 Instance Setup

### Initial Server Configuration
- [ ] SSH connection tested
- [ ] System updated: `sudo apt-get update && sudo apt-get upgrade`
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] User added to docker group
- [ ] Docker login successful
- [ ] Project directory created: `/var/www/yanotela`
- [ ] Correct permissions set on project directory

### Security Hardening (Recommended)
- [ ] Firewall configured (UFW)
- [ ] Fail2ban installed
- [ ] SSH password authentication disabled
- [ ] Regular security updates enabled
- [ ] Backup strategy defined

## 🚀 First Deployment

### Manual Test Deployment
- [ ] Docker images built locally
- [ ] Images pushed to Docker Hub successfully
- [ ] Images visible in Docker Hub dashboard
- [ ] `docker-compose.prod.yml` copied to EC2
- [ ] `.env.prod` created on EC2
- [ ] Services started: `docker-compose up -d`
- [ ] Services running: `docker-compose ps`
- [ ] Frontend accessible: `http://EC2_IP:3000`
- [ ] Backend accessible: `http://EC2_IP:3001/health`
- [ ] Database migrations applied
- [ ] Basic functionality tested

### CI/CD Pipeline Setup
- [ ] GitHub Actions workflow exists: `.github/workflows/docker-hub-ec2.yml`
- [ ] Workflow syntax validated
- [ ] Test push to main branch
- [ ] GitHub Actions running successfully
- [ ] All workflow steps passing:
  - [ ] Backend tests
  - [ ] Frontend tests
  - [ ] Docker build
  - [ ] Docker push
  - [ ] EC2 deployment
  - [ ] Health checks
- [ ] Deployment notification received (if configured)

## ✅ Post-Deployment Verification

### Service Health
- [ ] All containers running
- [ ] No container restarts
- [ ] Logs show no errors
- [ ] Frontend loads correctly
- [ ] Backend API responds
- [ ] Database connections working
- [ ] Redis connections working
- [ ] Email sending functional (test email)

### Performance Testing
- [ ] Page load times acceptable
- [ ] API response times good
- [ ] Database queries optimized
- [ ] Memory usage within limits
- [ ] CPU usage acceptable
- [ ] Disk space sufficient

### Security Check
- [ ] Secrets not exposed in logs
- [ ] Environment variables correct
- [ ] Database not publicly accessible (unless intended)
- [ ] API rate limiting configured
- [ ] CORS configured correctly
- [ ] Session management working

## 🔄 Ongoing Maintenance

### Daily
- [ ] Monitor GitHub Actions for any failures
- [ ] Check error logs on EC2
- [ ] Monitor disk space
- [ ] Verify services are running

### Weekly
- [ ] Review Docker Hub for image storage
- [ ] Check EC2 metrics (CPU, Memory, Network)
- [ ] Review application logs for errors
- [ ] Test backup restoration (if configured)

### Monthly
- [ ] Update system packages on EC2
- [ ] Review and update dependencies
- [ ] Audit security group rules
- [ ] Review and clean old Docker images
- [ ] Check SSL certificate expiration (if configured)

## 🐛 Troubleshooting Reference

### If deployment fails:

#### GitHub Actions Failed
- [ ] Check Actions tab for error logs
- [ ] Verify all secrets are set correctly
- [ ] Ensure EC2 is accessible
- [ ] Check EC2 security group allows SSH
- [ ] Verify Docker Hub credentials

#### Services Won't Start
- [ ] Check `docker-compose logs`
- [ ] Verify `.env.prod` exists and is correct
- [ ] Check Docker Hub for image availability
- [ ] Ensure sufficient disk space
- [ ] Check memory availability

#### Database Issues
- [ ] Verify database container is running
- [ ] Check database credentials in `.env.prod`
- [ ] Ensure DATABASE_URL is correct
- [ ] Check migrations applied
- [ ] Review database logs

#### Connection Issues
- [ ] Verify EC2 security group rules
- [ ] Check if services are bound to correct ports
- [ ] Ensure no firewall blocking ports
- [ ] Verify NEXT_PUBLIC_API_URL is correct
- [ ] Check nginx/reverse proxy if configured

## 📞 Emergency Contacts

- **Team Lead:** [Name / Contact]
- **DevOps:** [Name / Contact]
- **AWS Support:** [Account ID / Link]
- **Docker Hub:** [Username]

## 📚 Quick Reference

### Useful Commands
```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Deploy updates
docker-compose -f docker-compose.prod.yml up -d

# Check disk space
df -h

# Check memory
free -h

# Check Docker images
docker images

# Clean unused images
docker image prune -a
```

### Important URLs
- **GitHub Repository:** https://github.com/your-org/yanotela
- **Docker Hub:** https://hub.docker.com/u/your-username
- **EC2 Dashboard:** https://console.aws.amazon.com/ec2/
- **Production Frontend:** http://your-ec2-ip:3000
- **Production Backend:** http://your-ec2-ip:3001

---

**Last Updated:** [Date]  
**Deployment Version:** 1.0  
**Reviewed By:** [Name]

---

## 📝 Notes

Use this section to add deployment-specific notes or lessons learned:

```
[Add your notes here]
```
