# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Production
FROM node:18-alpine

LABEL maintainer="Arsip Surat Digital Enterprise Team <developer@arsipsurat.id>"
LABEL description="Sistem Manajemen Arsip Surat Digital untuk Perusahaan & Instansi"
LABEL version="2.0.0"

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy built node modules
COPY --from=builder /app/node_modules ./node_modules

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p storage/app/surat/masuk \
             storage/app/surat/keluar \
             storage/app/lampiran \
             storage/app/temp \
             storage/logs \
             storage/backup && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Use dumb-init to handle signals
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "src/app.js"]
