# Multi-stage build for Next.js client
FROM node:20-alpine AS base

# Add metadata labels
LABEL maintainer="Yanotela Team"
LABEL version="1.0"
LABEL description="Yanotela Frontend - Next.js Application"

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Vérifier que le build a créé les fichiers standalone
RUN ls -la .next/standalone || echo "ERROR: No standalone output found!"

# Production image
FROM base AS runner
WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone server
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_PUBLIC_WS_URL=ws://13.36.209.205:3001
ENV NEXT_PUBLIC_SOCKET_URL=http://13.36.209.205:3002
ENV NEXT_PUBLIC_API_URL=http://13.36.209.205:3001

# Vérifier que server.js existe avant de le lancer
CMD ["sh", "-c", "ls -la server.js && node server.js"]
