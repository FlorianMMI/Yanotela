#!/bin/bash
# Development Health Check Script

set -e

ENVIRONMENT=${1:-"dev"}

# Development environment configuration
COMPOSE_FILE="docker-compose.dev.yml"
BASE_URL="http://13.39.48.72"

echo "🏥 Starting health checks for $ENVIRONMENT environment..."

# Function to check service health
check_service() {
    local service_name=$1
    local port=$2
    local endpoint=$3
    local max_attempts=30
    local attempt=1

    echo "Checking $service_name on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s -m 10 "http://$HOST:$port$endpoint" > /dev/null 2>&1; then
            echo "✅ $service_name is healthy (attempt $attempt)"
            return 0
        fi
        
        echo "⏳ $service_name not ready yet (attempt $attempt/$max_attempts)..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service_name failed health check after $max_attempts attempts"
    return 1
}

# Function to check Docker containers
check_containers() {
    echo "🐳 Checking Docker containers..."
    
    if ! docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        echo "❌ Some containers are not running"
        docker-compose -f "$COMPOSE_FILE" ps
        return 1
    fi
    
    echo "✅ All containers are running"
    return 0
}

# Function to check database connectivity
check_database() {
    echo "🗄️ Checking database connectivity..."
    
    local db_container
    if [ "$ENVIRONMENT" = "preprod" ]; then
        db_container="yanotela-db-preprod"
    else
        db_container="yanotela-db-prod"
    fi
    
    if docker exec "$db_container" pg_isready > /dev/null 2>&1; then
        echo "✅ Database is ready"
        return 0
    else
        echo "❌ Database is not responding"
        return 1
    fi
}

# Function to check Redis connectivity
check_redis() {
    echo "🔴 Checking Redis connectivity..."
    
    local redis_container
    if [ "$ENVIRONMENT" = "preprod" ]; then
        redis_container="yanotela-redis-preprod"
    else
        redis_container="yanotela-redis-prod"
    fi
    
    if docker exec "$redis_container" redis-cli ping | grep -q "PONG"; then
        echo "✅ Redis is ready"
        return 0
    else
        echo "❌ Redis is not responding"
        return 1
    fi
}

# Main health check routine
main() {
    local exit_code=0
    
    echo "🚀 Yanotela Health Check - $ENVIRONMENT Environment"
    echo "=================================================="
    
    # Check containers first
    if ! check_containers; then
        exit_code=1
    fi
    
    # Check database
    if ! check_database; then
        exit_code=1
    fi
    
    # Check Redis
    if ! check_redis; then
        exit_code=1
    fi
    
    # Check backend API
    if ! check_service "Backend API" "$BACKEND_PORT" "/health"; then
        # Try alternative health endpoint
        if ! check_service "Backend API (alt)" "$BACKEND_PORT" "/"; then
            exit_code=1
        fi
    fi
    
    # Check frontend
    if ! check_service "Frontend" "$FRONTEND_PORT" "/"; then
        exit_code=1
    fi
    
    if [ $exit_code -eq 0 ]; then
        echo "🎉 All health checks passed! $ENVIRONMENT environment is healthy."
    else
        echo "🚨 Some health checks failed! Please investigate."
    fi
    
    return $exit_code
}

# Run health checks
main "$@"
