#!/bin/bash
# Script de setup initial pour EC2

set -e

echo "🚀 Configuration initiale de l'instance EC2 pour Yanotela"
echo "========================================================"

# Vérification des prérequis
check_requirements() {
    echo "🔍 Vérification des prérequis..."
    
    # Vérifier si on est sur EC2/Linux
    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        echo "⚠️ Ce script est conçu pour Linux (EC2). Continuer quand même? (y/N)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Vérifier les commandes nécessaires
    local missing_commands=()
    
    if ! command -v curl >/dev/null 2>&1; then
        missing_commands+=("curl")
    fi
    
    if ! command -v git >/dev/null 2>&1; then
        missing_commands+=("git")
    fi
    
    if [ ${#missing_commands[@]} -ne 0 ]; then
        echo "📦 Installation des outils manquants: ${missing_commands[*]}"
        sudo apt update
        sudo apt install -y "${missing_commands[@]}"
    fi
    
    echo "✅ Prérequis vérifiés"
}

# Installation de Docker
install_docker() {
    echo "🐳 Installation de Docker..."
    
    if command -v docker >/dev/null 2>&1; then
        echo "✅ Docker déjà installé ($(docker --version))"
    else
        # Installation Docker
        sudo apt update
        sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
        
        # Ajouter la clé GPG Docker
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        
        # Ajouter le repository Docker
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        # Installer Docker
        sudo apt update
        sudo apt install -y docker-ce docker-ce-cli containerd.io
        
        echo "✅ Docker installé"
    fi
    
    # Installation Docker Compose
    if command -v docker-compose >/dev/null 2>&1; then
        echo "✅ Docker Compose déjà installé ($(docker-compose --version))"
    else
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        echo "✅ Docker Compose installé"
    fi
    
    # Ajouter l'utilisateur au groupe docker
    if groups $USER | grep -q '\bdocker\b'; then
        echo "✅ Utilisateur déjà dans le groupe docker"
    else
        sudo usermod -aG docker $USER
        echo "✅ Utilisateur ajouté au groupe docker"
        echo "⚠️ Vous devez vous déconnecter et reconnecter pour appliquer les changements"
    fi
}

# Configuration des répertoires
setup_directories() {
    echo "📁 Configuration des répertoires..."
    
    # Répertoires pour les environnements
    mkdir -p ~/yanotela ~/yanotela-preprod
    
    # Répertoires pour les backups
    mkdir -p ~/yanotela/backups ~/yanotela-preprod/backups
    
    # Répertoires pour les logs
    mkdir -p ~/logs/yanotela ~/logs/yanotela-preprod
    
    echo "✅ Répertoires créés"
}

# Configuration du firewall (optionnel)
setup_firewall() {
    echo "🔥 Configuration du firewall (UFW)..."
    
    if command -v ufw >/dev/null 2>&1; then
        # Permettre SSH
        sudo ufw allow 22/tcp
        
        # Permettre les ports de l'application
        sudo ufw allow 80/tcp      # Prod frontend
        sudo ufw allow 3001/tcp    # Prod backend
        sudo ufw allow 8080/tcp    # Preprod frontend
        sudo ufw allow 8081/tcp    # Preprod backend
        
        # Afficher le statut
        sudo ufw --force enable
        sudo ufw status
        
        echo "✅ Firewall configuré"
    else
        echo "⚠️ UFW non installé, configuration manuelle du firewall recommandée"
    fi
}

# Installation d'outils utiles
install_utilities() {
    echo "🛠️ Installation d'outils utiles..."
    
    local utilities=("htop" "tree" "jq" "zip" "unzip")
    
    for util in "${utilities[@]}"; do
        if ! command -v "$util" >/dev/null 2>&1; then
            echo "📦 Installation de $util..."
            sudo apt install -y "$util" || echo "⚠️ Impossible d'installer $util"
        fi
    done
    
    echo "✅ Outils installés"
}

# Configuration des logs avec rotation
setup_logging() {
    echo "📋 Configuration des logs..."
    
    # Configuration logrotate pour les logs Docker
    sudo tee /etc/logrotate.d/yanotela > /dev/null << 'EOF'
/home/*/logs/yanotela*/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
EOF
    
    echo "✅ Configuration des logs terminée"
}

# Vérification finale
final_check() {
    echo "🏥 Vérification finale..."
    
    # Vérifier Docker
    if docker --version >/dev/null 2>&1; then
        echo "✅ Docker fonctionne"
    else
        echo "❌ Problème avec Docker"
        return 1
    fi
    
    # Vérifier Docker Compose
    if docker-compose --version >/dev/null 2>&1; then
        echo "✅ Docker Compose fonctionne"
    else
        echo "❌ Problème avec Docker Compose"
        return 1
    fi
    
    # Vérifier les répertoires
    if [[ -d ~/yanotela && -d ~/yanotela-preprod ]]; then
        echo "✅ Répertoires créés"
    else
        echo "❌ Problème avec les répertoires"
        return 1
    fi
    
    echo "🎉 Configuration terminée avec succès!"
}

# Afficher les prochaines étapes
show_next_steps() {
    echo ""
    echo "🎯 Prochaines étapes:"
    echo "==================="
    echo "1. Configurez vos secrets GitHub (voir deploy/SETUP-GITHUB-SECRETS.md)"
    echo "2. Clonez votre repository: git clone https://github.com/VotreUsername/Yanotela.git ~/yanotela"
    echo "3. Testez le déploiement local: cd ~/yanotela && ./deploy/scripts/deploy.sh preprod"
    echo "4. Poussez sur develop pour déclencher le premier déploiement preprod"
    echo ""
    echo "🔗 Liens utiles:"
    echo "• Documentation: ~/yanotela/deploy/README.md"
    echo "• Scripts: ~/yanotela/deploy/scripts/"
    echo "• Logs: ~/logs/yanotela/"
    echo ""
    
    if groups $USER | grep -q '\bdocker\b'; then
        echo "✅ Vous êtes prêt à déployer!"
    else
        echo "⚠️ N'oubliez pas de vous déconnecter/reconnecter pour appliquer les groupes Docker"
    fi
}

# Fonction principale
main() {
    check_requirements
    install_docker
    setup_directories
    setup_firewall
    install_utilities
    setup_logging
    final_check
    show_next_steps
}

# Help
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Usage: $0 [options]"
    echo ""
    echo "Script de configuration initiale pour EC2"
    echo ""
    echo "Options:"
    echo "  --help, -h     Afficher cette aide"
    echo "  --no-firewall  Ne pas configurer le firewall"
    echo ""
    echo "Ce script va:"
    echo "• Installer Docker et Docker Compose"
    echo "• Créer les répertoires nécessaires" 
    echo "• Configurer le firewall (optionnel)"
    echo "• Installer des outils utiles"
    echo "• Configurer la rotation des logs"
    exit 0
fi

# Vérifier les options
SETUP_FIREWALL=true
if [[ "$1" == "--no-firewall" ]]; then
    SETUP_FIREWALL=false
fi

# Exécuter le setup
if [[ "$SETUP_FIREWALL" == "false" ]]; then
    echo "⚠️ Configuration du firewall désactivée"
    main() {
        check_requirements
        install_docker
        setup_directories
        install_utilities
        setup_logging
        final_check
        show_next_steps
    }
fi

main "$@"