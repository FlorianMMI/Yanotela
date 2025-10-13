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

#!/bin/bash
# Development EC2 Setup Commands

echo "🚀 Setting up development environment on EC2..."

# 1. Navigate to development directory
cd ~/yanotela-dev

# 2. Move development Docker Compose file
echo "📦 Setting up Docker Compose for development..."
sudo mv ~/docker-compose.dev.yml .

# 3. Make deployment script executable
chmod +x deploy/scripts/build-and-push-dev.sh

# 4. Create development environment file
echo "📝 Creating .env.dev file..."
cat > .env.dev << 'EOF'
# Development Environment Configuration
DATABASE_URL="postgresql://yanotela_dev:dev_secure_password_123@localhost:5432/yanotela_dev"
NODE_ENV=development
PORT=3001
SESSION_SECRET="dev_session_secret_change_this_in_production"

# Database
POSTGRES_DB=yanotela_dev
POSTGRES_USER=yanotela_dev
POSTGRES_PASSWORD=dev_secure_password_123

# Application URLs  
CLIENT_URL=http://13.39.48.72:3000
SERVER_URL=http://13.39.48.72:3001

# Development settings
DEBUG=true
LOG_LEVEL=debug
EOF

echo "✅ Development environment configured!"
echo ""
echo "⚠️  IMPORTANT: Edit .env.dev and update:"
echo "  - POSTGRES_PASSWORD with a secure password"
echo "  - SESSION_SECRET with a random secret"
echo "  - Database connection details"
echo "  - Email configuration if needed"
echo ""
echo "Run: sudo nano .env.dev"
echo ""
echo "After editing .env.dev, run the deployment:"
echo "sudo docker compose -f docker-compose.dev.yml up -d"
