# Multi-stage build for Node.js server
FROM node:20

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and rebuild native modules
RUN npm ci --only=production && \

# Generate Prisma client
RUN npx prisma generate

ENV NODE_ENV=production

# Réduit les permissions du dossier de l'application pour des raisons de sécurité
COPY --chown=nodejs:nodejs . .

USER nodejs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

CMD ["npm", "start"]