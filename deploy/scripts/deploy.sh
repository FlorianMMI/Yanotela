#!/bin/bash
# Deployment Script pour Yanotela

set -e

ENVIRONMENT=${1:-"prod"}
FORCE_DEPLOY=${2:-"false"}

if [ "$ENVIRONMENT" = "preprod" ]; then
    COMPOSE_FILE="docker-compose.preprod.yml"
    ENV_FILE=".env.preprod"
    FRONTEND_PORT=8080
    BACKEND_PORT=8081
else
    COMPOSE_FILE="docker-compose.prod.yml"
    ENV_FILE=".env.prod"
    FRONTEND_PORT=80
    BACKEND_PORT=3001
fi

echo "🚀 Starting deployment for $ENVIRONMENT environment..."

# Function to create backup
create_backup() {
    echo "📦 Creating backup..."

    local backup_dir="backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"

    # Backup current environment
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "$backup_dir/"
    fi

    # Backup current container status
    docker-compose -f "$COMPOSE_FILE" ps > "$backup_dir/services_status.txt" 2>/dev/null || true

    # Create symlink to latest backup
    rm -f backup
    ln -sf "$backup_dir" backup

    echo "✅ Backup created in $backup_dir"
}

# Function to deploy
deploy() {
    echo "🐳 Pulling latest images..."
    docker-compose -f "$COMPOSE_FILE" pull

    echo "🛑 Stopping current services..."
    docker-compose -f "$COMPOSE_FILE" down

    echo "🧹 Cleaning up unused resources..."
    docker system prune -f --volumes || true

    echo "🚀 Starting new services..."
    docker-compose -f "$COMPOSE_FILE" up -d

    echo "⏳ Waiting for services to be ready..."
    sleep 30
}

# Function to verify deployment
verify_deployment() {
    echo "🏥 Verifying deployment..."

    # Check if containers are running
    if ! docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        echo "❌ Some containers are not running!"
        docker-compose -f "$COMPOSE_FILE" ps
        return 1
    fi

    # Run health checks
    if [ -f "scripts/health-check.sh" ]; then
        chmod +x scripts/health-check.sh
        if ./scripts/health-check.sh "$ENVIRONMENT"; then
            echo "✅ Deployment verification successful!"
            return 0
        else
            echo "❌ Health checks failed!"
            return 1
        fi
    else
        echo "⚠️ Health check script not found, skipping detailed verification"

        # Basic connectivity test
        local max_attempts=10
        local attempt=1

        while [ $attempt -le $max_attempts ]; do
            if curl -f -s -m 5 "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
                echo "✅ Frontend is responding"
                return 0
            fi

            echo "⏳ Frontend not ready yet (attempt $attempt/$max_attempts)..."
            sleep 5
            attempt=$((attempt + 1))
        done

        echo "❌ Frontend not responding after $max_attempts attempts"
        return 1
    fi
}

# Function to rollback on failure
rollback_on_failure() {
    echo "🔄 Deployment failed, attempting rollback..."

    if [ -f "scripts/rollback.sh" ]; then
        chmod +x scripts/rollback.sh
        ./scripts/rollback.sh "$ENVIRONMENT"
    else
        echo "⚠️ Rollback script not found, manual intervention required"
        docker-compose -f "$COMPOSE_FILE" down
        if [ -d "backup" ]; then
            cp "backup/$ENV_FILE" "$ENV_FILE" 2>/dev/null || true
            docker-compose -f "$COMPOSE_FILE" up -d
        fi
    fi
}

# Function to cleanup old resources
cleanup() {
    echo "🧹 Cleaning up old resources..."

    # Remove old images (keep last 3 versions)
    docker image prune -f

    # Remove old backups (keep last 5)
    find . -maxdepth 1 -name "backup_*" -type d | sort -r | tail -n +6 | xargs rm -rf 2>/dev/null || true

    echo "✅ Cleanup completed"
}

# Main deployment routine
main() {
    echo "🚀 Yanotela Deployment - $ENVIRONMENT Environment"
    echo "==============================================="

    # Pre-deployment checks
    if [ ! -f "$COMPOSE_FILE" ]; then
        echo "❌ Error: $COMPOSE_FILE not found"
        exit 1
    fi

    if [ ! -f "$ENV_FILE" ]; then
        echo "❌ Error: $ENV_FILE not found"
        exit 1
    fi

    # Show current status
    echo "📊 Current status:"
    docker-compose -f "$COMPOSE_FILE" ps || echo "No services currently running"
    echo ""

    # Create backup
    create_backup

    # Deploy
    if deploy && verify_deployment; then
        echo "🎉 Deployment successful!"
        cleanup

        # Show final status
        echo ""
        echo "📊 Final status:"
        docker-compose -f "$COMPOSE_FILE" ps

        echo ""
        echo "🔗 Access your application:"
        echo "• Frontend: http://localhost:$FRONTEND_PORT"
        echo "• Backend: http://localhost:$BACKEND_PORT"

    else
        echo "🚨 Deployment failed!"

        if [ "$FORCE_DEPLOY" != "true" ]; then
            rollback_on_failure
        else
            echo "⚠️ Force deploy enabled, skipping rollback"
        fi

        exit 1
    fi
}

# Help message
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [ENVIRONMENT] [FORCE_DEPLOY]"
    echo ""
    echo "ENVIRONMENT: prod (default) or preprod"
    echo "FORCE_DEPLOY: true to skip rollback on failure (default: false)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Deploy to production"
    echo "  $0 preprod            # Deploy to preprod"
    echo "  $0 prod true          # Deploy to production without rollback"
    exit 0
fi

# Run deployment
main "$@"
