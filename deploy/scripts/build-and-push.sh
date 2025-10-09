#!/bin/bash
# Script to build and push Docker images to Docker Hub
# Usage: ./build-and-push.sh [tag] [dockerhub_username]

set -e

# Configuration
TAG=${1:-"latest"}
DOCKER_USERNAME=${2:-"yourusername"}
DOCKER_REPO_FRONTEND="${DOCKER_USERNAME}/yanotela-frontend"
DOCKER_REPO_BACKEND="${DOCKER_USERNAME}/yanotela-backend"
DOCKER_REPO_DB="${DOCKER_USERNAME}/yanotela-db"

echo "🐳 Building and pushing Docker images to Docker Hub"
echo "📋 Configuration:"
echo "   - Tag: $TAG"
echo "   - Docker Hub Username: $DOCKER_USERNAME"
echo "   - Frontend Image: $DOCKER_REPO_FRONTEND:$TAG"
echo "   - Backend Image: $DOCKER_REPO_BACKEND:$TAG"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    exit 1
fi

# Check if logged in to Docker Hub
echo "🔑 Checking Docker Hub authentication..."
if ! docker info | grep -q "Username"; then
    echo "⚠️  Not logged in to Docker Hub"
    echo "Please run: docker login"
    exit 1
fi

# Build and push frontend
echo ""
echo "🏗️  Building Frontend image..."
docker build -t "$DOCKER_REPO_FRONTEND:$TAG" \
    -t "$DOCKER_REPO_FRONTEND:latest" \
    --platform linux/amd64 \
    ./Client

echo "📤 Pushing Frontend image to Docker Hub..."
docker push "$DOCKER_REPO_FRONTEND:$TAG"
docker push "$DOCKER_REPO_FRONTEND:latest"

# Build and push backend
echo ""
echo "🏗️  Building Backend image..."
docker build -t "$DOCKER_REPO_BACKEND:$TAG" \
    -t "$DOCKER_REPO_BACKEND:latest" \
    --platform linux/amd64 \
    ./Server

echo "📤 Pushing Backend image to Docker Hub..."
docker push "$DOCKER_REPO_BACKEND:$TAG"
docker push "$DOCKER_REPO_BACKEND:latest"

# Display image sizes
echo ""
echo "📊 Image sizes:"
docker images | grep "yanotela-" | head -4

echo ""
echo "✅ All images have been successfully pushed to Docker Hub!"
echo ""
echo "📋 Summary:"
echo "   Frontend: $DOCKER_REPO_FRONTEND:$TAG"
echo "   Backend: $DOCKER_REPO_BACKEND:$TAG"
echo ""
echo "🔗 View your images at:"
echo "   - https://hub.docker.com/r/$DOCKER_USERNAME/yanotela-frontend"
echo "   - https://hub.docker.com/r/$DOCKER_USERNAME/yanotela-backend"
echo ""
echo "🚀 Next steps:"
echo "   1. Configure your EC2 instance"
echo "   2. Copy docker-compose.prod.yml to EC2"
echo "   3. Run: docker-compose -f docker-compose.prod.yml pull"
echo "   4. Run: docker-compose -f docker-compose.prod.yml up -d"
