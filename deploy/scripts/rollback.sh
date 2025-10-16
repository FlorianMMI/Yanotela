#!/bin/bash
# Development Rollback Script

set -e

ENVIRONMENT=${1:-"dev"}

# Development environment configuration
COMPOSE_FILE="docker-compose.dev.yml"
ENV_FILE=".env.dev"

echo "🔄 Starting rollback for $ENVIRONMENT environment..."

# Function to rollback deployment
rollback_deployment() {
    echo "🛑 Stopping current services..."
    docker-compose -f "$COMPOSE_FILE" down
    
    if [ -d "$BACKUP_DIR" ]; then
        echo "📦 Restoring from backup..."
        
        # Restore environment file if it exists
        if [ -f "$BACKUP_DIR/$ENV_FILE" ]; then
            cp "$BACKUP_DIR/$ENV_FILE" "$ENV_FILE"
            echo "✅ Environment file restored"
        fi
        
        # Pull previous images (if they exist)
        echo "🐳 Pulling previous Docker images..."
        docker-compose -f "$COMPOSE_FILE" pull || echo "⚠️ Could not pull previous images"
        
        # Start services
        echo "🚀 Starting previous version..."
        docker-compose -f "$COMPOSE_FILE" up -d
        
        # Wait for services
        sleep 30
        
        # Run health check
        if ./scripts/health-check.sh "$ENVIRONMENT"; then
            echo "✅ Rollback successful! Previous version is running."
            return 0
        else
            echo "❌ Rollback failed! Services are not healthy."
            return 1
        fi
    else
        echo "❌ No backup found! Cannot rollback."
        echo "🔧 Attempting to restart current services..."
        docker-compose -f "$COMPOSE_FILE" up -d
        return 1
    fi
}

# Function to create emergency backup before rollback
create_emergency_backup() {
    echo "📋 Creating emergency backup before rollback..."
    
    local emergency_backup="emergency_backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$emergency_backup"
    
    # Backup current environment
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "$emergency_backup/"
    fi
    
    # Backup current container status
    docker-compose -f "$COMPOSE_FILE" ps > "$emergency_backup/services_status.txt" 2>/dev/null || true
    
    # Backup logs
    docker-compose -f "$COMPOSE_FILE" logs > "$emergency_backup/services_logs.txt" 2>/dev/null || true
    
    echo "✅ Emergency backup created in $emergency_backup/"
}

# Function to show rollback status
show_status() {
    echo "📊 Current deployment status:"
    echo "================================"
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""
    echo "🔍 Recent logs:"
    docker-compose -f "$COMPOSE_FILE" logs --tail=20
}

# Main rollback routine
main() {
    echo "🔄 Yanotela Rollback - $ENVIRONMENT Environment"
    echo "=============================================="
    
    # Show current status
    show_status
    
    # Create emergency backup
    create_emergency_backup
    
    # Perform rollback
    if rollback_deployment; then
        echo "🎉 Rollback completed successfully!"
        
        # Show final status
        echo ""
        echo "📊 Post-rollback status:"
        show_status
        
        exit 0
    else
        echo "🚨 Rollback failed!"
        
        # Show current status for debugging
        echo ""
        echo "📊 Current status after failed rollback:"
        show_status
        
        exit 1
    fi
}

# Check if we're in the right directory
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Error: $COMPOSE_FILE not found in current directory"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Run rollback
main "$@"
