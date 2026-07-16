# ==================== DOCKERFILE ====================
# Arsip Surat Digital Enterprise
# Multi-stage build for optimized image

# ==================== STAGE 1: BUILD ====================
FROM node:18-alpine AS build

LABEL maintainer="Arsip Surat Digital Team <developer@arsipsurat.id>"
LABEL description="Arsip Surat Digital Enterprise"
LABEL version="2.1.0"

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite-dev \
    git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application files
COPY . .

# Remove development files
RUN rm -rf \
    .git \
    .github \
    tests \
    docs \
    *.md \
    .gitignore \
    .eslintrc.json \
    .prettierrc \
    .editorconfig

# ==================== STAGE 2: PRODUCTION ====================
FROM node:18-alpine AS production

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    sqlite-libs \
    tini \
    curl \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

# Copy from build stage
COPY --from=build --chown=nodejs:nodejs /app /app

# Create necessary directories
RUN mkdir -p \
    /app/data \
    /app/src/storage/app/surat/masuk \
    /app/src/storage/app/surat/keluar \
    /app/src/storage/app/lampiran \
    /app/src/storage/app/template \
    /app/src/storage/app/temp \
    /app/src/storage/logs \
    /app/src/storage/backup \
    /app/src/storage/cache \
    && chown -R nodejs:nodejs /app

# Set environment
ENV NODE_ENV=production
ENV APP_PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use tini as init
ENTRYPOINT ["/sbin/tini", "--"]

# Switch to non-root user
USER nodejs

# Start application
CMD ["node", "src/app.js"]

# ==================== STAGE 3: DEVELOPMENT ====================
FROM build AS development

WORKDIR /app

# Install development dependencies
RUN npm install

# Install nodemon globally
RUN npm install -g nodemon

# Expose port
EXPOSE 3000

# Start in development mode
CMD ["npm", "run", "dev"]
