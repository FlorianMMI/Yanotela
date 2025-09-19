#!/bin/bash

# Installer les dépendances côté client
cd Client && npm install && npm run dev &
CLIENT_PID=$!

# Attendre que les deux process se terminent
wait $CLIENT_PID

# Installer les dépendances et générer Prisma côté serveur
cd .. && cd /Server && npm install && npx prisma generate && nodemon server.js &
SERVER_PID=$!


wait $SERVER_PID
