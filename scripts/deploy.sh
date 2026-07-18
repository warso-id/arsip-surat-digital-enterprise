#!/bin/bash

# Deployment script for Arsip Surat Digital
set -e

echo "========================================="
echo "Arsip Surat Digital - Deployment Script"
echo "========================================="

# Load environment
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration
APP_DIR="/opt/arsip-surat"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "Starting deployment at $(date)"

# 1. Create backup before deployment
echo ""
echo "1. Creating pre-deployment backup..."
./tools/backup.sh full

# 2. Pull latest changes
echo ""
echo "2. Pulling latest changes..."
git pull origin main

# 3. Install dependencies
echo ""
echo "3. Installing dependencies..."
npm ci --production

# 4. Run migrations
echo ""
echo "4. Running database migrations..."
npm run migrate

# 5. Build assets
echo ""
echo "5. Building assets..."
npm run build

# 6. Restart application
echo ""
echo "6. Restarting application..."
if command -v pm2 &> /dev/null; then
    pm2 reload ecosystem.config.js --env production
else
    echo "PM2 not found, starting with Node..."
    npm start &
fi

# 7. Clean up
echo ""
echo "7. Cleaning up..."
npm cache clean --force

echo ""
echo "========================================="
echo "Deployment completed successfully!"
echo "Finished at: $(date)"
echo "========================================="
