#!/bin/bash
# Commands to run on EC2 instance after transferring files

echo "🚀 Setting up Yanotela deployment on EC2..."

# 1. Create project directory
sudo mkdir -p /var/www/yanotela
cd /var/www/yanotela

# 2. Move transferred files to project directory
sudo mv ~/deploy-ec2.sh .
sudo mv ~/docker-compose.prod.yml .

# 3. Make script executable
sudo chmod +x deploy-ec2.sh

# 4. Create production environment file
echo "📝 Creating .env.prod file..."
cat > .env.prod << 'EOF'
# Database Configuration
DB_USER=yanotela_user
DB_PASSWORD=$(openssl rand -base64 32)
DB_NAME=yanotela_prod

# Redis Configuration  
REDIS_PASSWORD=$(openssl rand -base64 32)

# Session Configuration
SESSION_SECRET=$(openssl rand -base64 64)

# Email Configuration (UPDATE THESE!)
MAIL_SERVICE=gmail
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_app_password_here

# Docker Configuration (UPDATE THIS!)
DOCKER_USERNAME=your_dockerhub_username
IMAGE_TAG=latest
EOF

echo "⚠️  IMPORTANT: Edit .env.prod and update:"
echo "   - MAIL_USER (your email)"
echo "   - MAIL_PASSWORD (your app password)"
echo "   - DOCKER_USERNAME (your Docker Hub username)"
echo ""
echo "Run: sudo nano .env.prod"
echo ""
echo "After editing .env.prod, run the deployment:"
echo "sudo DOCKER_USERNAME=your_username IMAGE_TAG=latest ./deploy-ec2.sh"
