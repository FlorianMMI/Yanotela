# Multi-stage build for Node.js server
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    openssl \
    wget

# Install dependencies
FROM base AS deps
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and rebuild native modules
RUN npm ci --only=production && \
    npm rebuild bcrypt --build-from-source

# Generate Prisma client
RUN npx prisma generate

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy node_modules and generated Prisma client
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nodejs:nodejs /app/prisma ./prisma

# Copy source code
COPY --chown=nodejs:nodejs . .

# Ensure Prisma client is accessible
RUN npx prisma generate

# Create uploads directory if needed
RUN mkdir -p uploads && chown nodejs:nodejs uploads

USER nodejs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('https://yanotela.fr/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

CMD ["npm", "start"]
