#!/bin/bash
# EC2 Deployment Script for Yanotela
# This script should be run on the EC2 instance

set -e

# Configuration
DOCKER_USERNAME=${DOCKER_USERNAME:-"yourusername"}
IMAGE_TAG=${IMAGE_TAG:-"latest"}
PROJECT_DIR="/var/www/yanotela"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"

echo "🚀 Starting deployment on EC2..."
echo "📋 Configuration:"
echo "   - Docker Username: $DOCKER_USERNAME"
echo "   - Image Tag: $IMAGE_TAG"
echo "   - Project Directory: $PROJECT_DIR"
echo ""

# Function to check if running as root or with sudo
check_permissions() {
    if [ "$EUID" -ne 0 ]; then 
        echo "⚠️  Warning: Not running as root. Some commands may require sudo."
        SUDO="sudo"
    else
        SUDO=""
    fi
}

# Function to install Docker if not present
install_docker() {
    if ! command -v docker &> /dev/null; then
        echo "🔧 Docker not found. Installing Docker..."
        
        $SUDO apt-get update
        $SUDO apt-get install -y \
            ca-certificates \
            curl \
            gnupg \
            lsb-release
        
        $SUDO mkdir -p /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | $SUDO gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
          $(lsb_release -cs) stable" | $SUDO tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        $SUDO apt-get update
        $SUDO apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        
        echo "✅ Docker installed successfully"
    else
        echo "✅ Docker is already installed"
    fi
}

# Function to install Docker Compose if not present
install_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
        echo "🔧 Docker Compose not found. Installing Docker Compose..."
        
        $SUDO curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        $SUDO chmod +x /usr/local/bin/docker-compose
        
        echo "✅ Docker Compose installed successfully"
    else
        echo "✅ Docker Compose is already installed"
    fi
}

# Function to create project directory
setup_project_directory() {
    echo "📁 Setting up project directory..."
    
    $SUDO mkdir -p "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    
    echo "✅ Project directory ready"
}

# Function to create backup
create_backup() {
    echo "📦 Creating backup..."
    
    local backup_dir="backup_$(date +%Y%m%d_%H%M%S)"
    $SUDO mkdir -p "$backup_dir"
    
    # Backup environment file
    if [ -f "$ENV_FILE" ]; then
        $SUDO cp "$ENV_FILE" "$backup_dir/"
    fi
    
    # Backup container status
    if [ -f "$COMPOSE_FILE" ]; then
        $SUDO docker-compose -f "$COMPOSE_FILE" ps > "$backup_dir/services_status.txt" 2>/dev/null || true
    fi
    
    # Create symlink to latest backup
    $SUDO rm -f backup
    $SUDO ln -sf "$backup_dir" backup
    
    echo "✅ Backup created in $backup_dir"
}

# Function to login to Docker Hub
docker_login() {
    if [ -n "$DOCKER_PASSWORD" ]; then
        echo "🔑 Logging in to Docker Hub..."
        echo "$DOCKER_PASSWORD" | $SUDO docker login -u "$DOCKER_USERNAME" --password-stdin
        echo "✅ Logged in to Docker Hub"
    else
        echo "⚠️  DOCKER_PASSWORD not set. Assuming already logged in or using public images."
    fi
}

# Function to pull images
pull_images() {
    echo "📥 Pulling latest images from Docker Hub..."
    
    export DOCKER_USERNAME
    export IMAGE_TAG
    
    $SUDO docker-compose -f "$COMPOSE_FILE" pull
    
    echo "✅ Images pulled successfully"
}

# Function to stop current services
stop_services() {
    echo "🛑 Stopping current services..."
    
    if [ -f "$COMPOSE_FILE" ]; then
        $SUDO docker-compose -f "$COMPOSE_FILE" down || true
    fi
    
    echo "✅ Services stopped"
}

# Function to start services
start_services() {
    echo "🚀 Starting services..."
    
    export DOCKER_USERNAME
    export IMAGE_TAG
    
    $SUDO docker-compose -f "$COMPOSE_FILE" up -d
    
    echo "✅ Services started"
}

# Function to wait for services
wait_for_services() {
    echo "⏳ Waiting for services to be ready..."
    
    local max_wait=120
    local elapsed=0
    local interval=5
    
    while [ $elapsed -lt $max_wait ]; do
        # Check if all containers are running
        local running=$($SUDO docker-compose -f "$COMPOSE_FILE" ps -q | wc -l)
        local healthy=$($SUDO docker-compose -f "$COMPOSE_FILE" ps | grep -c "Up" || true)
        
        if [ "$running" -gt 0 ] && [ "$healthy" -eq "$running" ]; then
            echo "✅ All services are running"
            return 0
        fi
        
        echo "   Waiting... ($elapsed/$max_wait seconds)"
        sleep $interval
        elapsed=$((elapsed + interval))
    done
    
    echo "⚠️  Services did not start within $max_wait seconds"
    return 1
}

# Function to verify deployment
verify_deployment() {
    echo "🏥 Verifying deployment..."
    
    # Check frontend
    if curl -f -s -m 10 http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend is responding"
    else
        echo "❌ Frontend is not responding"
        return 1
    fi
    
    # Check backend
    if curl -f -s -m 10 http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Backend is responding"
    else
        echo "❌ Backend is not responding"
        return 1
    fi
    
    echo "✅ Deployment verification successful"
    return 0
}

# Function to rollback
rollback() {
    echo "🔄 Rolling back to previous version..."
    
    stop_services
    
    if [ -d "backup" ] && [ -f "backup/$ENV_FILE" ]; then
        $SUDO cp "backup/$ENV_FILE" "$ENV_FILE"
        start_services
        echo "✅ Rollback completed"
    else
        echo "❌ No backup found for rollback"
        return 1
    fi
}

# Function to cleanup
cleanup() {
    echo "🧹 Cleaning up..."
    
    # Remove unused images
    $SUDO docker image prune -f
    
    # Remove old backups (keep last 5)
    ls -t | grep "backup_" | tail -n +6 | xargs -r $SUDO rm -rf
    
    echo "✅ Cleanup completed"
}

# Main deployment flow
main() {
    check_permissions
    install_docker
    install_docker_compose
    setup_project_directory
    
    # Create backup before deployment
    create_backup
    
    # Login to Docker Hub if credentials provided
    docker_login
    
    # Pull latest images
    if ! pull_images; then
        echo "❌ Failed to pull images"
        exit 1
    fi
    
    # Stop current services
    stop_services
    
    # Start new services
    if ! start_services; then
        echo "❌ Failed to start services"
        rollback
        exit 1
    fi
    
    # Wait for services to be ready
    if ! wait_for_services; then
        echo "❌ Services did not start properly"
        rollback
        exit 1
    fi
    
    # Verify deployment
    if ! verify_deployment; then
        echo "❌ Deployment verification failed"
        rollback
        exit 1
    fi
    
    # Cleanup
    cleanup
    
    echo ""
    echo "✅ Deployment completed successfully!"
    echo ""
    echo "📊 Service Status:"
    $SUDO docker-compose -f "$COMPOSE_FILE" ps
    echo ""
    echo "🔗 Services are available at:"
    echo "   - Frontend: http://$(hostname -I | awk '{print $1}'):3000"
    echo "   - Backend: http://$(hostname -I | awk '{print $1}'):3001"
    echo ""
}

# Run main function
main
