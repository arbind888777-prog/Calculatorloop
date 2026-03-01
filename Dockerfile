# Multi-stage Dockerfile for Next.js optimized for Google Cloud Run
# Builds the app, then runs it in a minimal runtime image

FROM node:22-alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files first for better caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies with legacy peer deps flag
RUN npm ci --legacy-peer-deps --prefer-offline --no-audit

# Copy source code
COPY . .

# Build the Next.js application using standalone output
ENV NEXT_OUTPUT=standalone
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install runtime dependencies
RUN apk add --no-cache libc6-compat

# Copy Prisma schema for runtime
COPY --from=builder /app/prisma ./prisma/

# Copy public assets
COPY --from=builder /app/public ./public/

# Copy Next.js standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static/

# Copy .env files if needed
COPY --chown=node:node .env* ./

# Create non-root user for security (optional but recommended)
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

EXPOSE 8080

# Cloud Run requires PORT env var and Next.js standalone mode
# For standalone, we run 'node server.js' from the working directory root
CMD ["node", "server.js"]
