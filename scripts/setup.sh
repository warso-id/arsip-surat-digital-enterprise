#!/bin/bash

# ============================================
# ARSIP SURAT DIGITAL ENTERPRISE v3.1.0
# SETUP SCRIPT
# ============================================

set -e

echo "========================================="
echo "  ARSIP SURAT DIGITAL ENTERPRISE v3.1.0"
echo "  SETUP SCRIPT"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check Node.js
echo -e "${BLUE}[1/6]${NC} Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js ${NODE_VERSION} found${NC}"
else
    echo -e "${RED}❌ Node.js is required. Please install Node.js 18+${NC}"
    exit 1
fi

# Check npm
echo -e "${BLUE}[2/6]${NC} Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✅ npm ${NPM_VERSION} found${NC}"
else
    echo -e "${RED}❌ npm is required. Please install npm${NC}"
    exit 1
fi

# Install dependencies
echo -e "${BLUE}[3/6]${NC} Installing dependencies..."
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Generate icons
echo -e "${BLUE}[4/6]${NC} Generating PWA icons..."
node scripts/generate-icons.js
echo -e "${GREEN}✅ Icons generated${NC}"

# Create .env file if not exists
echo -e "${BLUE}[5/6]${NC} Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠️  .env file created from .env.example${NC}"
    echo -e "${YELLOW}   Please update VITE_API_BASE_URL with your Google Apps Script URL${NC}"
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

# Build check
echo -e "${BLUE}[6/6]${NC} Running build check..."
npm run build
echo -e "${GREEN}✅ Build successful${NC}"

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  SETUP COMPLETED SUCCESSFULLY!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Update .env with your Google Apps Script URL"
echo "  2. Run 'npm run dev' to start development server"
echo "  3. Run './workflow-execute.sh' to setup backend"
echo ""
echo "Default login:"
echo "  Username: admin"
echo "  Password: Admin123!"
echo ""
