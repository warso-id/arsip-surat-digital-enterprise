#!/bin/bash

# ==================== SETUP SCRIPT ====================
# Arsip Surat Digital Enterprise
# Automated setup for development environment

set -e

echo "========================================"
echo "  ARSIP SURAT DIGITAL ENTERPRISE SETUP"
echo "  Version: 2.1.0"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Node.js
check_node() {
    echo -e "${BLUE}[1/6] Checking Node.js...${NC}"
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 16 ]; then
            echo -e "${GREEN}  ✓ Node.js $(node -v) detected${NC}"
        else
            echo -e "${RED}  ✗ Node.js version must be >= 16. Current: $(node -v)${NC}"
            exit 1
        fi
    else
        echo -e "${RED}  ✗ Node.js not found. Please install Node.js >= 16${NC}"
        exit 1
    fi
}

# Check npm
check_npm() {
    echo -e "${BLUE}[2/6] Checking npm...${NC}"
    if command -v npm &> /dev/null; then
        echo -e "${GREEN}  ✓ npm $(npm -v) detected${NC}"
    else
        echo -e "${RED}  ✗ npm not found${NC}"
        exit 1
    fi
}

# Create .env file
setup_env() {
    echo -e "${BLUE}[3/6] Setting up environment...${NC}"
    if [ ! -f .env ]; then
        cp .env.example .env
        echo -e "${GREEN}  ✓ .env file created from .env.example${NC}"
        echo -e "${YELLOW}  ⚠ Please edit .env file with your configuration${NC}"
    else
        echo -e "${YELLOW}  ⚠ .env file already exists, skipping...${NC}"
    fi
}

# Install dependencies
install_deps() {
    echo -e "${BLUE}[4/6] Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}  ✓ Dependencies installed${NC}"
}

# Setup database
setup_db() {
    echo -e "${BLUE}[5/6] Setting up database...${NC}"
    
    # Create directories
    mkdir -p src/storage/app/surat/masuk
    mkdir -p src/storage/app/surat/keluar
    mkdir -p src/storage/app/lampiran
    mkdir -p src/storage/app/temp
    mkdir -p src/storage/logs
    mkdir -p src/storage/backup
    mkdir -p src/storage/cache
    
    # Create .gitkeep files
    touch src/storage/app/surat/masuk/.gitkeep
    touch src/storage/app/surat/keluar/.gitkeep
    touch src/storage/app/lampiran/.gitkeep
    touch src/storage/app/temp/.gitkeep
    touch src/storage/logs/.gitkeep
    touch src/storage/backup/.gitkeep
    touch src/storage/cache/.gitkeep
    
    # Run migrations
    echo "  Running database migrations..."
    npm run migrate
    echo -e "${GREEN}  ✓ Database migrated${NC}"
    
    # Run seeders
    echo "  Seeding default data..."
    npm run seed
    echo -e "${GREEN}  ✓ Default data seeded${NC}"
}

# Display success message
show_success() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  SETUP COMPLETED SUCCESSFULLY!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "  ${BLUE}Start development server:${NC}"
    echo -e "    npm run dev"
    echo ""
    echo -e "  ${BLUE}Default login credentials:${NC}"
    echo -e "    Admin:    admin / admin123"
    echo -e "    Operator: operator / password123"
    echo -e "    Staff:    staff / password123"
    echo ""
    echo -e "  ${BLUE}Access the application:${NC}"
    echo -e "    http://localhost:3000"
    echo ""
}

# Main
main() {
    check_node
    check_npm
    setup_env
    install_deps
    setup_db
    show_success
}

# Run
main "$@"
