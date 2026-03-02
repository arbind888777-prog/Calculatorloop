# Multi-stage Dockerfile for Next.js optimized for Google Cloud Run
# Builds the app, then runs it in a minimal runtime image

FROM node:18-alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files first for better caching
COPY package*.json ./

# Copy Prisma schema before npm install
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --legacy-peer-deps --prefer-offline --no-audit || npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build with environment set for standalone
ENV NEXT_OUTPUT=standalone
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the Next.js application
RUN npm run build

# Production runtime stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080

# Copy Prisma schema (for runtime if needed)
COPY --from=builder /app/prisma ./prisma/

# Copy public folder
COPY --from=builder /app/public ./public/

# Copy Next.js standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static/

# Create non-root user for better security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

EXPOSE 8080

# Start server - Cloud Run will pass PORT via environment variable
CMD ["node", "server.js"]
