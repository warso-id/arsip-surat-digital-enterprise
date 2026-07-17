#!/bin/bash
# deploy.sh - Enterprise Deployment Script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT=${1:-production}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOY_DIR="deploy_${TIMESTAMP}"
BACKUP_DIR="src/storage/backup"

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  Arsip Surat Digital Enterprise Deploy  ${NC}"
echo -e "${BLUE}  Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Check environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo -e "${RED}Error: Environment must be 'staging' or 'production'${NC}"
    exit 1
fi

# 1. Run tests
echo -e "${BLUE}[1/8] Running tests...${NC}"
npm test
if [ $? -ne 0 ]; then
    echo -e "${RED}Tests failed. Aborting deployment.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Tests passed${NC}"

# 2. Lint code
echo -e "${BLUE}[2/8] Linting code...${NC}"
npm run lint -- --quiet
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠ Lint warnings found${NC}"
fi
echo -e "${GREEN}✓ Lint complete${NC}"

# 3. Backup database
echo -e "${BLUE}[3/8] Creating backup...${NC}"
bash tools/backup.sh
echo -e "${GREEN}✓ Backup created${NC}"

# 4. Install dependencies
echo -e "${BLUE}[4/8] Installing dependencies...${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
    npm ci --production
else
    npm ci
fi
echo -e "${GREEN}✓ Dependencies installed${NC}"

# 5. Build application
echo -e "${BLUE}[5/8] Building application...${NC}"
npm run build
echo -e "${GREEN}✓ Build complete${NC}"

# 6. Run database migrations
echo -e "${BLUE}[6/8] Running database migrations...${NC}"
node src/database/migrations/run-all.js
echo -e "${GREEN}✓ Migrations complete${NC}"

# 7. Optimize assets
echo -e "${BLUE}[7/8] Optimizing assets...${NC}"
# Minify images
if command -v imagemin &> /dev/null; then
    npx imagemin dist/images/* --out-dir=dist/images/
fi
# Compress files
if command -v gzip &> /dev/null; then
    find dist -type f \( -name "*.html" -o -name "*.css" -o -name "*.js" \) -exec gzip -k -f {} \;
fi
echo -e "${GREEN}✓ Assets optimized${NC}"

# 8. Deploy
echo -e "${BLUE}[8/8] Deploying to ${ENVIRONMENT}...${NC}"

case $ENVIRONMENT in
    "staging")
        # Deploy to staging server
        netlify deploy --dir=dist --alias=staging
        ;;
    "production")
        # Deploy to production server
        netlify deploy --prod --dir=dist
        
        # Create release tag
        VERSION=$(node -p "require('./package.json').version")
        git tag -a "v${VERSION}" -m "Release v${VERSION}"
        git push origin "v${VERSION}"
        ;;
esac

echo -e "${GREEN}✓ Deployment complete${NC}"
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  Deployment Successful!                ${NC}"
echo -e "${GREEN}  Environment: ${ENVIRONMENT}           ${NC}"
echo -e "${GREEN}  Timestamp: ${TIMESTAMP}               ${NC}"
echo -e "${GREEN}=========================================${NC}"
