FROM node:22-alpine

# Installation des dépendances système pour bcrypt
RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package*.json ./

# Installation et rebuild des modules natifs
RUN npm ci --only=production && npm rebuild bcrypt --build-from-source

# Copier le code source (node_modules exclus par .dockerignore)
COPY . .

# Générer le client Prisma
RUN npx prisma generate
EXPOSE 3001
CMD ["npm", "start"]
