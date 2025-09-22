#!/bin/bash

echo "🚀 Démarrage de l'application Yanotela..."

# Installer les dépendances et générer Prisma côté serveur
echo "📦 Installation des dépendances serveur..."
cd Server && npm install && npx prisma generate

# Démarrer le serveur en arrière-plan
echo "🔧 Démarrage du serveur..."
node index.js &
SERVER_PID=$!

# Revenir à la racine et aller dans Client
cd ../Client

# Installer les dépendances côté client
echo "📦 Installation des dépendances client..."
npm install

# Démarrer le client
echo "🌐 Démarrage du client..."
npm run dev &
CLIENT_PID=$!

echo "✅ Application démarrée !"
echo "🔧 Serveur PID: $SERVER_PID"
echo "🌐 Client PID: $CLIENT_PID"
echo "Pour arrêter l'application, utilisez Ctrl+C"
echo "Yanotela est prêt à être utilisé sur les ports 3000 & 3001 !"

# Attendre que les deux processus se terminent
wait $CLIENT_PID $SERVER_PID