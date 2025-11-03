#!/bin/bash
# Quick Setup Script for EC2 Instance
# Run this on your EC2 instance for initial setup

set -e

echo "🚀 Yanotela EC2 Quick Setup"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo "ℹ️  $1"
}

# Check if running on Ubuntu
if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
        print_warning "This script is designed for Ubuntu/Debian. It may not work on $ID."
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# Update system
echo ""
print_info "Updating system packages..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq
print_success "System updated"

# Install prerequisites
echo ""
print_info "Installing prerequisites..."
sudo apt-get install -y -qq \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    htop \
    net-tools
print_success "Prerequisites installed"

# Install Docker
echo ""
print_info "Installing Docker..."
if command -v docker &> /dev/null; then
    print_warning "Docker is already installed"
    docker --version
else
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    print_success "Docker installed"
    print_warning "You need to log out and back in for docker group changes to take effect"
fi

# Install Docker Compose
echo ""
print_info "Installing Docker Compose..."
if command -v docker-compose &> /dev/null; then
    print_warning "Docker Compose is already installed"
    docker-compose --version
else
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed"
fi

# Create project directory
echo ""
print_info "Creating project directory..."
PROJECT_DIR="/var/www/yanotela"
sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR
cd $PROJECT_DIR
print_success "Project directory created: $PROJECT_DIR"

# Create .env.prod template
echo ""
print_info "Creating .env.prod template..."
if [ ! -f .env.prod ]; then
    cat > .env.prod << 'EOL'
# Database Configuration
DB_USER=yanotela_prod
DB_PASSWORD=CHANGE_THIS_PASSWORD
DB_NAME=yanotela_prod

# Redis Configuration
REDIS_PASSWORD=CHANGE_THIS_PASSWORD

# Application Configuration
NODE_ENV=production
SESSION_SECRET=CHANGE_THIS_SECRET_KEY

# Mail Configuration
MAIL_SERVICE=gmail
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# API Configuration
NEXT_PUBLIC_API_URL=http://YOUR_EC2_IP:3001

# Docker Configuration
DOCKER_USERNAME=your-dockerhub-username
IMAGE_TAG=latest
EOL
    print_success ".env.prod template created"
    print_warning "IMPORTANT: Edit .env.prod and change all placeholder values!"
else
    print_warning ".env.prod already exists, skipping template creation"
fi

# Configure firewall (UFW)
echo ""
read -p "Do you want to configure the firewall (UFW)? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Configuring firewall..."
    sudo apt-get install -y -qq ufw
    
    # Allow SSH
    sudo ufw allow 22/tcp
    # Allow Frontend
    sudo ufw allow 3000/tcp
    # Allow Backend
    sudo ufw allow 3001/tcp
    
    # Enable firewall
    print_warning "About to enable firewall. Make sure SSH (port 22) is allowed!"
    read -p "Enable firewall now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "y" | sudo ufw enable
        sudo ufw status
        print_success "Firewall configured"
    fi
fi

# Docker Hub login
echo ""
read -p "Do you want to login to Docker Hub now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Logging in to Docker Hub..."
    docker login
    if [ $? -eq 0 ]; then
        print_success "Logged in to Docker Hub"
    else
        print_error "Failed to login to Docker Hub"
    fi
fi

# Create helpful aliases
echo ""
print_info "Creating helpful bash aliases..."
cat >> ~/.bashrc << 'EOL'

# Yanotela aliases
alias yanotela-logs='cd /var/www/yanotela && docker-compose -f docker-compose.prod.yml logs'
alias yanotela-ps='cd /var/www/yanotela && docker-compose -f docker-compose.prod.yml ps'
alias yanotela-restart='cd /var/www/yanotela && docker-compose -f docker-compose.prod.yml restart'
alias yanotela-stop='cd /var/www/yanotela && docker-compose -f docker-compose.prod.yml stop'
alias yanotela-start='cd /var/www/yanotela && docker-compose -f docker-compose.prod.yml start'
alias yanotela-pull='cd /var/www/yanotela && docker-compose -f docker-compose.prod.yml pull'
alias yanotela-up='cd /var/www/yanotela && docker-compose -f docker-compose.prod.yml up -d'
alias yanotela-down='cd /var/www/yanotela && docker-compose -f docker-compose.prod.yml down'
alias yanotela-cd='cd /var/www/yanotela'
EOL
print_success "Bash aliases created"

# Summary
echo ""
echo "================================"
print_success "Setup Complete!"
echo "================================"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Log out and back in for group changes to take effect:"
echo "   exit"
echo ""
echo "2. Edit the .env.prod file with your configuration:"
echo "   cd $PROJECT_DIR"
echo "   nano .env.prod"
echo ""
echo "3. Copy your docker-compose.prod.yml to this directory:"
echo "   # From your local machine:"
echo "   scp docker-compose.prod.yml $USER@\$(hostname):$PROJECT_DIR/"
echo ""
echo "4. Deploy your application:"
echo "   cd $PROJECT_DIR"
echo "   export DOCKER_USERNAME=your-dockerhub-username"
echo "   export IMAGE_TAG=latest"
echo "   docker-compose -f docker-compose.prod.yml pull"
echo "   docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "📊 Useful Commands:"
echo "   yanotela-logs    # View logs"
echo "   yanotela-ps      # View status"
echo "   yanotela-restart # Restart services"
echo "   yanotela-cd      # Go to project directory"
echo ""
echo "🔗 Your server IP: $(hostname -I | awk '{print $1}')"
echo "   Frontend will be at: http://$(hostname -I | awk '{print $1}'):3000"
echo "   Backend will be at: http://$(hostname -I | awk '{print $1}'):3001"
echo ""
print_success "Happy deploying! 🚀"
