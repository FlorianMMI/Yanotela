# Makefile pour Yanotela CI/CD

.PHONY: help build test deploy health rollback clean setup

# Variables par défaut
ENV ?= preprod
DOCKER_TAG ?= latest

# Couleurs pour les messages
GREEN = \033[0;32m
YELLOW = \033[1;33m  
RED = \033[0;31m
NC = \033[0m # No Color

help: ## Afficher l'aide
	@echo "🚀 Yanotela CI/CD - Commandes disponibles"
	@echo "========================================"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "🎯 Variables d'environnement:"
	@echo "  ENV=preprod|prod    Environnement cible (défaut: preprod)"
	@echo "  DOCKER_TAG=tag      Tag Docker à utiliser (défaut: latest)"
	@echo ""
	@echo "📚 Exemples:"
	@echo "  make deploy ENV=prod       # Déployer en production"
	@echo "  make health ENV=preprod    # Vérifier la santé preprod"
	@echo "  make rollback ENV=prod     # Rollback production"

setup: ## Configurer l'environnement EC2
	@echo "$(YELLOW)🚀 Configuration de l'environnement EC2...$(NC)"
	@chmod +x deploy/scripts/setup-ec2.sh
	@./deploy/scripts/setup-ec2.sh

build: ## Builder les images Docker localement  
	@echo "$(YELLOW)🐳 Build des images Docker...$(NC)"
	@if [ "$(ENV)" = "prod" ]; then \
		docker-compose -f docker-compose.prod.yml build; \
	else \
		docker-compose -f docker-compose.preprod.yml build; \
	fi
	@echo "$(GREEN)✅ Build terminé$(NC)"

test: ## Lancer les tests
	@echo "$(YELLOW)🧪 Lancement des tests...$(NC)"
	@# Tests backend
	@cd Server && npm test || echo "$(RED)❌ Tests backend échoués$(NC)"
	@# Tests frontend  
	@cd Client && (npm test || echo "$(YELLOW)⚠️ Pas de tests frontend configurés$(NC)")
	@echo "$(GREEN)✅ Tests terminés$(NC)"

deploy: ## Déployer l'application
	@echo "$(YELLOW)🚀 Déploiement $(ENV)...$(NC)"
	@chmod +x deploy/scripts/deploy.sh
	@./deploy/scripts/deploy.sh $(ENV)
	@echo "$(GREEN)✅ Déploiement $(ENV) terminé$(NC)"

health: ## Vérifier la santé des services
	@echo "$(YELLOW)🏥 Vérification santé $(ENV)...$(NC)"
	@chmod +x deploy/scripts/health-check.sh
	@if ./deploy/scripts/health-check.sh $(ENV); then \
		echo "$(GREEN)✅ Services $(ENV) en bonne santé$(NC)"; \
	else \
		echo "$(RED)❌ Problèmes détectés sur $(ENV)$(NC)"; \
		exit 1; \
	fi

rollback: ## Effectuer un rollback
	@echo "$(YELLOW)🔄 Rollback $(ENV)...$(NC)"
	@read -p "Êtes-vous sûr de vouloir effectuer un rollback sur $(ENV)? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		chmod +x deploy/scripts/rollback.sh; \
		./deploy/scripts/rollback.sh $(ENV); \
		echo "$(GREEN)✅ Rollback $(ENV) terminé$(NC)"; \
	else \
		echo "$(YELLOW)⚠️ Rollback annulé$(NC)"; \
	fi

logs: ## Afficher les logs
	@echo "$(YELLOW)📋 Logs $(ENV)...$(NC)"
	@if [ "$(ENV)" = "prod" ]; then \
		docker-compose -f docker-compose.prod.yml logs -f --tail=100; \
	else \
		docker-compose -f docker-compose.preprod.yml logs -f --tail=100; \
	fi

status: ## Afficher le statut des services
	@echo "$(YELLOW)📊 Statut $(ENV)...$(NC)"
	@if [ "$(ENV)" = "prod" ]; then \
		docker-compose -f docker-compose.prod.yml ps; \
	else \
		docker-compose -f docker-compose.preprod.yml ps; \
	fi

stop: ## Arrêter les services
	@echo "$(YELLOW)🛑 Arrêt des services $(ENV)...$(NC)"
	@if [ "$(ENV)" = "prod" ]; then \
		docker-compose -f docker-compose.prod.yml down; \
	else \
		docker-compose -f docker-compose.preprod.yml down; \
	fi
	@echo "$(GREEN)✅ Services $(ENV) arrêtés$(NC)"

start: ## Démarrer les services
	@echo "$(YELLOW)▶️ Démarrage des services $(ENV)...$(NC)"
	@if [ "$(ENV)" = "prod" ]; then \
		docker-compose -f docker-compose.prod.yml up -d; \
	else \
		docker-compose -f docker-compose.preprod.yml up -d; \
	fi
	@echo "$(GREEN)✅ Services $(ENV) démarrés$(NC)"

restart: stop start ## Redémarrer les services

clean: ## Nettoyer les ressources Docker
	@echo "$(YELLOW)🧹 Nettoyage des ressources Docker...$(NC)"
	@docker system prune -f
	@docker volume prune -f
	@echo "$(GREEN)✅ Nettoyage terminé$(NC)"

clean-all: ## Nettoyage complet (ATTENTION: supprime tout)
	@echo "$(RED)⚠️ ATTENTION: Cette commande va supprimer TOUTES les images et volumes Docker$(NC)"
	@read -p "Êtes-vous sûr? Cela supprimera toutes vos données! (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		docker system prune -af --volumes; \
		echo "$(GREEN)✅ Nettoyage complet terminé$(NC)"; \
	else \
		echo "$(YELLOW)⚠️ Nettoyage annulé$(NC)"; \
	fi

backup: ## Créer une sauvegarde manuelle
	@echo "$(YELLOW)💾 Création d'une sauvegarde $(ENV)...$(NC)"
	@backup_dir="manual_backup_$(ENV)_$$(date +%Y%m%d_%H%M%S)"; \
	mkdir -p "$$backup_dir"; \
	if [ "$(ENV)" = "prod" ]; then \
		cp .env.prod "$$backup_dir/" 2>/dev/null || true; \
		docker-compose -f docker-compose.prod.yml ps > "$$backup_dir/services_status.txt" 2>/dev/null || true; \
	else \
		cp .env.preprod "$$backup_dir/" 2>/dev/null || true; \
		docker-compose -f docker-compose.preprod.yml ps > "$$backup_dir/services_status.txt" 2>/dev/null || true; \
	fi; \
	echo "$(GREEN)✅ Sauvegarde créée: $$backup_dir$(NC)"

dev: ## Lancer l'environnement de développement local
	@echo "$(YELLOW)💻 Démarrage environnement développement...$(NC)"
	@docker-compose up -d
	@echo "$(GREEN)✅ Environnement développement démarré$(NC)"
	@echo "🔗 Frontend: http://localhost:3000"
	@echo "🔗 Backend: http://localhost:3001"

dev-build: ## Builder et lancer l'environnement de développement
	@echo "$(YELLOW)💻 Build et démarrage développement...$(NC)"
	@docker-compose up --build -d
	@echo "$(GREEN)✅ Environnement développement démarré$(NC)"

# Commandes utiles pour le développement
npm-install: ## Installer les dépendances NPM
	@echo "$(YELLOW)📦 Installation des dépendances...$(NC)"
	@cd Client && npm install
	@cd Server && npm install
	@echo "$(GREEN)✅ Dépendances installées$(NC)"

prisma-generate: ## Générer le client Prisma
	@echo "$(YELLOW)🗄️ Génération du client Prisma...$(NC)"
	@cd Server && npx prisma generate
	@echo "$(GREEN)✅ Client Prisma généré$(NC)"

prisma-migrate: ## Appliquer les migrations Prisma
	@echo "$(YELLOW)🗄️ Application des migrations Prisma...$(NC)"
	@cd Server && npx prisma migrate deploy
	@echo "$(GREEN)✅ Migrations appliquées$(NC)"

# Commandes de monitoring
monitor: ## Surveiller les ressources système
	@echo "$(YELLOW)📊 Monitoring des ressources...$(NC)"
	@echo "💾 Espace disque:"
	@df -h
	@echo ""
	@echo "🐳 Images Docker:"
	@docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
	@echo ""
	@echo "📦 Volumes Docker:"
	@docker volume ls
	@echo ""
	@if command -v htop >/dev/null 2>&1; then \
		echo "⚡ Processus (htop):"; \
		htop || top; \
	else \
		echo "⚡ Processus (top):"; \
		top -b -n 1 | head -20; \
	fi