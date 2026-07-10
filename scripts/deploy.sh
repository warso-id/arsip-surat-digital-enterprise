#!/bin/bash

# ============================================
# ARSIP SURAT DIGITAL ENTERPRISE v3.1.0
# DEPLOY SCRIPT
# ============================================

set -e

echo "========================================="
echo "  DEPLOY ARSIP SURAT DIGITAL ENTERPRISE"
echo "  v3.1.0"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check environment
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found. Run setup.sh first.${NC}"
    exit 1
fi

# Build
echo -e "${BLUE}[1/3]${NC} Building production..."
npm run build
echo -e "${GREEN}✅ Build completed${NC}"

# Check dist
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed. dist/ directory not found.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Choose deployment method:${NC}"
echo "  1) Firebase Hosting"
echo "  2) Vercel"
echo "  3) Netlify"
echo "  4) GitHub Pages"
echo "  5) Custom Server"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
    1)
        echo -e "${BLUE}[2/3]${NC} Deploying to Firebase..."
        if command -v firebase &> /dev/null; then
            firebase deploy --only hosting
        else
            echo -e "${YELLOW}Installing Firebase CLI...${NC}"
            npm install -g firebase-tools
            firebase login
            firebase init hosting
            firebase deploy --only hosting
        fi
        echo -e "${GREEN}✅ Deployed to Firebase${NC}"
        ;;
    2)
        echo -e "${BLUE}[2/3]${NC} Deploying to Vercel..."
        if command -v vercel &> /dev/null; then
            vercel --prod
        else
            echo -e "${YELLOW}Installing Vercel CLI...${NC}"
            npm install -g vercel
            vercel --prod
        fi
        echo -e "${GREEN}✅ Deployed to Vercel${NC}"
        ;;
    3)
        echo -e "${BLUE}[2/3]${NC} Deploying to Netlify..."
        if command -v netlify &> /dev/null; then
            netlify deploy --prod --dir=dist
        else
            echo -e "${YELLOW}Installing Netlify CLI...${NC}"
            npm install -g netlify-cli
            netlify deploy --prod --dir=dist
        fi
        echo -e "${GREEN}✅ Deployed to Netlify${NC}"
        ;;
    4)
        echo -e "${BLUE}[2/3]${NC} Deploying to GitHub Pages..."
        read -p "Enter GitHub repository URL: " repo_url
        cd dist
        git init
        git add -A
        git commit -m "Deploy Arsip Surat Digital v3.1.0"
        git branch -M main
        git remote add origin "$repo_url"
        git push -f origin main
        cd ..
        echo -e "${GREEN}✅ Deployed to GitHub Pages${NC}"
        ;;
    5)
        echo -e "${BLUE}[2/3]${NC} Preparing for custom server..."
        echo -e "${GREEN}✅ dist/ folder is ready for deployment${NC}"
        echo ""
        echo "Upload the contents of dist/ folder to your server."
        echo "Make sure to configure your server to:"
        echo "  - Serve index.html for all routes (SPA fallback)"
        echo "  - Enable HTTPS"
        echo "  - Set proper cache headers for service worker"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}[3/3]${NC} Post-deployment checks..."
echo "Please verify:"
echo "  ✅ HTTPS is enabled"
echo "  ✅ Service worker is registered"
echo "  ✅ PWA is installable"
echo "  ✅ API connection is working"
echo "  ✅ Offline mode is functional"
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  DEPLOYMENT COMPLETED!${NC}"
echo -e "${GREEN}=========================================${NC}"
