FROM node:18-alpine

# Métadonnées
LABEL maintainer="Yanotela Team"
LABEL description="Serveur WebSocket Yjs pour collaboration temps réel"

# Définir le répertoire de travail
WORKDIR /app

# Copier package.json pour installer y-websocket
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le serveur
COPY server.js ./
COPY persistence.js ./

# Créer le dossier de persistence
RUN mkdir -p /data/yjs-persistence

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S yjs && \
    adduser -S yjs -u 1001 && \
    chown -R yjs:yjs /app /data

# Passer à l'utilisateur non-root
USER yjs

# Exposition du port WebSocket
EXPOSE 1234

# Variables d'environnement par défaut
ENV HOST=0.0.0.0
ENV PORT=1234
ENV YPERSISTENCE=/data/yjs-persistence

# Commande de démarrage
CMD ["node", "server.js"]