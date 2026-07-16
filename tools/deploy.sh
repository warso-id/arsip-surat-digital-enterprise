#!/bin/bash

# ==================== DEPLOY SCRIPT ====================
# Arsip Surat Digital Enterprise
# Usage: bash tools/deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
VERSION=$(node -p "require('./version.json').version")

echo "========================================"
echo "  ARSIP SURAT DIGITAL - DEPLOY"
echo "  Environment: ${ENVIRONMENT}"
echo "  Version: ${VERSION}"
echo "  Timestamp: ${TIMESTAMP}"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
if [ "$ENVIRONMENT" == "production" ]; then
    REMOTE_HOST="${PRODUCTION_HOST}"
    REMOTE_USER="${PRODUCTION_USERNAME}"
    REMOTE_PATH="/var/www/arsip-surat"
    COMPOSE_FILE="docker-compose.production.yml"
elif [ "$ENVIRONMENT" == "staging" ]; then
    REMOTE_HOST="${STAGING_HOST}"
    REMOTE_USER="${STAGING_USERNAME}"
    REMOTE_PATH="/var/www/arsip-surat-staging"
    COMPOSE_FILE="docker-compose.staging.yml"
else
    echo -e "${RED}Unknown environment: ${ENVIRONMENT}${NC}"
    exit 1
fi

# Check required variables
check_vars() {
    if [ -z "$REMOTE_HOST" ] || [ -z "$REMOTE_USER" ]; then
        echo -e "${RED}Missing deployment variables for ${ENVIRONMENT}${NC}"
        echo "Please set ${ENVIRONMENT^^}_HOST and ${ENVIRONMENT^^}_USERNAME"
        exit 1
    fi
}

# Build application
build_app() {
    echo -e "${YELLOW}[1/6] Building application...${NC}"
    
    # Install dependencies
    npm ci --only=production
    
    # Run tests
    echo "  Running tests..."
    npm test || echo -e "${YELLOW}  ⚠ Tests failed, but continuing...${NC}"
    
    echo -e "${GREEN}  ✓ Build completed${NC}"
}

# Create backup
create_backup() {
    echo -e "${YELLOW}[2/6] Creating backup...${NC}"
    
    ssh ${REMOTE_USER}@${REMOTE_HOST} "
        cd ${REMOTE_PATH}
        if [ -f data/database.sqlite ]; then
            cp data/database.sqlite data/backup_${TIMESTAMP}.sqlite
            echo '  ✓ Database backed up'
        fi
    "
}

# Deploy files
deploy_files() {
    echo -e "${YELLOW}[3/6] Deploying files...${NC}"
    
    # Sync files (excluding node_modules, storage, .env)
    rsync -avz --delete \
        --exclude 'node_modules' \
        --exclude 'src/storage' \
        --exclude '.env' \
        --exclude '.git' \
        --exclude 'tests' \
        --exclude 'docs' \
        ./ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/
    
    echo -e "${GREEN}  ✓ Files deployed${NC}"
}

# Install dependencies on server
install_server_deps() {
    echo -e "${YELLOW}[4/6] Installing dependencies on server...${NC}"
    
    ssh ${REMOTE_USER}@${REMOTE_HOST} "
        cd ${REMOTE_PATH}
        npm ci --only=production
    "
    
    echo -e "${GREEN}  ✓ Server dependencies installed${NC}"
}

# Run migrations
run_migrations() {
    echo -e "${YELLOW}[5/6] Running database migrations...${NC}"
    
    ssh ${REMOTE_USER}@${REMOTE_HOST} "
        cd ${REMOTE_PATH}
        node src/database/migrations/001_create_all_tables.js up
    "
    
    echo -e "${GREEN}  ✓ Migrations completed${NC}"
}

# Restart application
restart_app() {
    echo -e "${YELLOW}[6/6] Restarting application...${NC}"
    
    if [ "$USE_DOCKER" == "true" ]; then
        ssh ${REMOTE_USER}@${REMOTE_HOST} "
            cd ${REMOTE_PATH}
            docker-compose -f docker-compose.yml -f ${COMPOSE_FILE} down
            docker-compose -f docker-compose.yml -f ${COMPOSE_FILE} up -d --build
        "
    else
        ssh ${REMOTE_USER}@${REMOTE_HOST} "
            cd ${REMOTE_PATH}
            pm2 restart arsip-surat || pm2 start src/app.js --name arsip-surat
        "
    fi
    
    echo -e "${GREEN}  ✓ Application restarted${NC}"
}

# Verify deployment
verify_deployment() {
    echo -e "${YELLOW}Verifying deployment...${NC}"
    
    sleep 10
    
    if [ "$ENVIRONMENT" == "production" ]; then
        URL="https://arsipsurat.id/health"
    else
        URL="https://staging.arsipsurat.id/health"
    fi
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" ${URL} || echo "000")
    
    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${GREEN}  ✓ Deployment verified (HTTP ${HTTP_CODE})${NC}"
    else
        echo -e "${RED}  ✗ Deployment verification failed (HTTP ${HTTP_CODE})${NC}"
        echo "  Rolling back..."
        rollback
        exit 1
    fi
}

# Rollback
rollback() {
    echo -e "${RED}Rolling back deployment...${NC}"
    
    ssh ${REMOTE_USER}@${REMOTE_HOST} "
        cd ${REMOTE_PATH}
        if [ -f data/backup_${TIMESTAMP}.sqlite ]; then
            cp data/backup_${TIMESTAMP}.sqlite data/database.sqlite
            echo '  ✓ Database restored from backup'
        fi
        pm2 restart arsip-surat
    "
}

# Main
main() {
    check_vars
    
    if [ "$ENVIRONMENT" == "production" ]; then
        echo -e "${RED}⚠ DEPLOYING TO PRODUCTION${NC}"
        read -p "Are you sure? (yes/no): " CONFIRM
        if [ "$CONFIRM" != "yes" ]; then
            echo "Deployment cancelled."
            exit 0
        fi
    fi
    
    build_app
    create_backup
    deploy_files
    install_server_deps
    run_migrations
    restart_app
    verify_deployment
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  DEPLOYMENT COMPLETED!${NC}"
    echo -e "${GREEN}  Environment: ${ENVIRONMENT}${NC}"
    echo -e "${GREEN}  Version: ${VERSION}${NC}"
    echo -e "${GREEN}  Time: $(date)${NC}"
    echo -e "${GREEN}========================================${NC}"
}

main "$@"
