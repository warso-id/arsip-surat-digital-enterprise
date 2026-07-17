#!/bin/bash
# setup.sh - Enterprise Setup Script

echo "========================================="
echo "  Arsip Surat Digital Enterprise Setup   "
echo "  Version 2026.1                         "
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Node.js
echo -e "${BLUE}[1/6] Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js found: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

# Check NPM
echo -e "${BLUE}[2/6] Checking NPM...${NC}"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ NPM found: v$NPM_VERSION${NC}"
else
    echo -e "${RED}✗ NPM not found${NC}"
    exit 1
fi

# Create directories
echo -e "${BLUE}[3/6] Creating directory structure...${NC}"
mkdir -p src/public/uploads
mkdir -p src/storage/app/surat/masuk
mkdir -p src/storage/app/surat/keluar
mkdir -p src/storage/app/lampiran
mkdir -p src/storage/app/temp
mkdir -p src/storage/logs
mkdir -p src/storage/backup

echo -e "${GREEN}✓ Directory structure created${NC}"

# Copy environment file
echo -e "${BLUE}[4/6] Setting up environment...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created from .env.example${NC}"
    echo -e "${YELLOW}⚠ Please edit .env file with your configuration${NC}"
else
    echo -e "${YELLOW}⚠ .env file already exists, skipping...${NC}"
fi

# Install dependencies
echo -e "${BLUE}[5/6] Installing dependencies...${NC}"
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi

# Run database migrations
echo -e "${BLUE}[6/6] Running database migrations...${NC}"
node src/database/migrations/run-all.js

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database migrations completed${NC}"
else
    echo -e "${YELLOW}⚠ Database migrations may have issues (check Google Apps Script connection)${NC}"
fi

echo ""
echo -e "${GREEN}========================================="
echo "  Setup Complete!                        "
echo "========================================="
echo ""
echo "  Next steps:"
echo "  1. Edit .env file with your configuration"
echo "  2. Run: npm run dev"
echo "  3. Open http://localhost:3000"
echo ""
echo "  Default login:"
echo "  Email: admin@enterprise.com"
echo "  Password: admin123"
echo ""
echo -e "=========================================${NC}"
