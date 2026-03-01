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
RUN apk add --no-cache libc6-compat dumb-init

# Copy Prisma schema for runtime (if needed for migrations)
COPY --from=builder /app/prisma ./prisma/

# Copy public assets
COPY --from=builder /app/public ./public/

# Copy Next.js standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static/

# Copy JSON configuration files if they exist
COPY --chown=node:node *.json ./
COPY --chown=node:node *.md ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["/sbin/dumb-init", "--"]
CMD ["node", "server.js"]
