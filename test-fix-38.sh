#!/bin/bash

# Script de test local avant déploiement
# À exécuter pour vérifier que les corrections fonctionnent

set -e

echo "🧪 Test des corrections pour l'erreur Build #38"
echo "================================================"

# Couleurs pour les outputs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Vérifier que les fichiers nécessaires existent
echo ""
echo "📁 Vérification des fichiers..."

if [ ! -f ".env.dev.example" ]; then
    echo -e "${RED}❌ .env.dev.example manquant${NC}"
    exit 1
fi

if [ ! -f "docker-compose.dev.yml" ]; then
    echo -e "${RED}❌ docker-compose.dev.yml manquant${NC}"
    exit 1
fi

if [ ! -f ".env.dev" ]; then
    echo -e "${YELLOW}⚠️  .env.dev manquant, création depuis l'exemple...${NC}"
    cp .env.dev.example .env.dev
fi

echo -e "${GREEN}✅ Tous les fichiers sont présents${NC}"

# 2. Nettoyer les containers existants
echo ""
echo "🧹 Nettoyage des containers existants..."
docker compose -f docker-compose.dev.yml down -v 2>/dev/null || true
echo -e "${GREEN}✅ Nettoyage terminé${NC}"

# 3. Build des images
echo ""
echo "🔨 Build des images Docker..."
docker compose -f docker-compose.dev.yml build --no-cache

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build réussi${NC}"
else
    echo -e "${RED}❌ Échec du build${NC}"
    exit 1
fi

# 4. Démarrage des services
echo ""
echo "🚀 Démarrage des services..."
docker compose -f docker-compose.dev.yml up -d

# 5. Attendre que les services soient healthy
echo ""
echo "⏳ Attente que les services soient healthy..."
echo "   (cela peut prendre jusqu'à 2 minutes)"

MAX_WAIT=120
ELAPSED=0
INTERVAL=5

while [ $ELAPSED -lt $MAX_WAIT ]; do
    BACKEND_STATUS=$(docker inspect yanotela-backend-dev --format='{{.State.Health.Status}}' 2>/dev/null || echo "starting")
    FRONTEND_STATUS=$(docker inspect yanotela-frontend-dev --format='{{.State.Health.Status}}' 2>/dev/null || echo "starting")
    
    echo "   Backend: $BACKEND_STATUS | Frontend: $FRONTEND_STATUS"
    
    if [ "$BACKEND_STATUS" = "healthy" ] && [ "$FRONTEND_STATUS" = "healthy" ]; then
        echo -e "${GREEN}✅ Tous les services sont healthy !${NC}"
        break
    fi
    
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo -e "${RED}❌ Timeout : les services n'ont pas démarré à temps${NC}"
    echo ""
    echo "Logs du backend:"
    docker compose -f docker-compose.dev.yml logs --tail=50 backend-dev
    echo ""
    echo "Logs du frontend:"
    docker compose -f docker-compose.dev.yml logs --tail=50 frontend-dev
    exit 1
fi

# 6. Tester les endpoints
echo ""
echo "🔍 Test des endpoints..."

# Test backend health
if curl -f -s -m 10 http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✅ Backend /health répond${NC}"
else
    echo -e "${RED}❌ Backend /health ne répond pas${NC}"
    docker compose -f docker-compose.dev.yml logs backend-dev
    exit 1
fi

# Test frontend
if curl -f -s -m 10 http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Frontend répond${NC}"
else
    echo -e "${RED}❌ Frontend ne répond pas${NC}"
    docker compose -f docker-compose.dev.yml logs frontend-dev
    exit 1
fi

# Test backend API
if curl -f -s -m 10 http://localhost:3001 > /dev/null; then
    echo -e "${GREEN}✅ Backend API répond${NC}"
else
    echo -e "${RED}❌ Backend API ne répond pas${NC}"
    docker compose -f docker-compose.dev.yml logs backend-dev
    exit 1
fi

# 7. Afficher le statut des containers
echo ""
echo "📊 Statut des containers:"
docker compose -f docker-compose.dev.yml ps

# 8. Résumé
echo ""
echo "================================================"
echo -e "${GREEN}✅ TOUS LES TESTS SONT PASSÉS !${NC}"
echo ""
echo "Les corrections fonctionnent correctement."
echo "Vous pouvez maintenant pousser sur GitHub :"
echo ""
echo "  git add ."
echo "  git commit -m 'fix: Ajouter health checks Docker et améliorer le déploiement CI/CD (#38)'"
echo "  git push origin Develop"
echo ""
echo "Pour arrêter les services :"
echo "  docker compose -f docker-compose.dev.yml down"
echo ""
echo "Pour voir les logs :"
echo "  docker compose -f docker-compose.dev.yml logs -f"
echo "================================================"
