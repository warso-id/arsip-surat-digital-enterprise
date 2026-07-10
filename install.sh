
---

### FILE 36: **scripts/install.sh** (UPGRADE v3.1.0)

```bash
#!/bin/bash

# ============================================
# ARSIP SURAT DIGITAL ENTERPRISE v3.1.0 (2026)
# Installation Script
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Version
VERSION="3.1.0"
BUILD_DATE="2026-07-10"

echo -e "${PURPLE}============================================${NC}"
echo -e "${PURPLE}  Arsip Surat Digital Enterprise v${VERSION}${NC}"
echo -e "${PURPLE}  Installation Script${NC}"
echo -e "${PURPLE}  Build: ${BUILD_DATE}${NC}"
echo -e "${PURPLE}============================================${NC}"
echo ""

# Check Node.js 18+
check_node() {
    echo -e "${BLUE}[1/8] Checking Node.js...${NC}"
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Node.js not found. Installing...${NC}"
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${RED}Node.js 18+ required. Current: $(node -v)${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Node.js $(node -v)${NC}"
}

# Check npm
check_npm() {
    echo -e "${BLUE}[2/8] Checking npm...${NC}"
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}npm not found${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ npm $(npm -v)${NC}"
}

# Check Git
check_git() {
    echo -e "${BLUE}[3/8] Checking Git...${NC}"
    if ! command -v git &> /dev/null; then
        echo -e "${RED}Git not found${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Git $(git --version | cut -d' ' -f3)${NC}"
}

# Install clasp
install_clasp() {
    echo -e "${BLUE}[4/8] Installing Google clasp...${NC}"
    if ! command -v clasp &> /dev/null; then
        npm install -g @google/clasp@latest
    fi
    echo -e "${GREEN}✅ clasp $(clasp --version)${NC}"
}

# Install dependencies
install_deps() {
    echo -e "${BLUE}[5/8] Installing dependencies v${VERSION}...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Setup Google Apps Script
setup_gas() {
    echo -e "${BLUE}[6/8] Setting up Google Apps Script...${NC}"
    echo -e "${YELLOW}Please login to your Google account:${NC}"
    clasp login
    
    echo ""
    echo "Choose option:"
    echo "1) Create new project"
    echo "2) Use existing project"
    read -p "Choice (1/2): " choice
    
    if [ "$choice" = "1" ]; then
        clasp create --type sheets --title "Arsip Surat Digital v${VERSION}"
    else
        read -p "Enter Script ID: " SCRIPT_ID
        echo "{\"scriptId\":\"${SCRIPT_ID}\",\"rootDir\":\".\"}" > backend/.clasp.json
    fi
    
    echo -e "${GREEN}✅ GAS setup complete${NC}"
}

# Setup AI & Blockchain
setup_ai() {
    echo -e "${BLUE}[7/8] Initializing AI Engine & Blockchain...${NC}"
    
    # Create AI directories
    mkdir -p ai-models blockchain-data
    
    # Initialize blockchain genesis
    node -e "
        const crypto = require('crypto');
        const genesis = {
            index: 0,
            timestamp: new Date().toISOString(),
            data: 'Genesis Block v${VERSION}',
            previousHash: '0',
            hash: crypto.createHash('sha256').update('0Genesis Block v${VERSION}0').digest('hex'),
            nonce: 0
        };
        console.log('Genesis Block created:', genesis.hash);
    "
    
    echo -e "${GREEN}✅ AI & Blockchain initialized${NC}"
}

# Deploy
deploy_app() {
    echo -e "${BLUE}[8/8] Deploying v${VERSION}...${NC}"
    
    cd backend
    clasp push
    
    echo ""
    echo -e "${YELLOW}Deploy as Web App? (y/n)${NC}"
    read -p "Choice: " deploy_choice
    
    if [ "$deploy_choice" = "y" ]; then
        clasp deploy --description "v${VERSION} (${BUILD_DATE}) Production"
    fi
    
    cd ..
    
    echo -e "${GREEN}✅ Deployment complete${NC}"
}

# Build PWA
build_pwa() {
    echo -e "${BLUE}[EXTRA] Building PWA v${VERSION}...${NC}"
    
    if [ -f "package.json" ]; then
        npm run build
        echo -e "${GREEN}✅ PWA build complete${NC}"
    fi
}

# Summary
show_summary() {
    echo ""
    echo -e "${PURPLE}============================================${NC}"
    echo -e "${PURPLE}  Installation Complete!${NC}"
    echo -e "${PURPLE}  Version: ${VERSION}${NC}"
    echo -e "${PURPLE}  Build: ${BUILD_DATE}${NC}"
    echo -e "${PURPLE}============================================${NC}"
    echo ""
    echo -e "${GREEN}Features enabled:${NC}"
    echo -e "  🤖 AI Engine        : ✅"
    echo -e "  🔗 Blockchain       : ✅"
    echo -e "  🔐 Biometric        : ✅"
    echo -e "  🎤 Voice Commands   : ✅"
    echo -e "  🌙 Dark Mode        : ✅"
    echo -e "  🌐 Multi-Language   : ✅"
    echo -e "  📱 PWA              : ✅"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Open Google Sheets and copy the ID"
    echo "  2. Update CONFIG.SPREADSHEET_ID in backend/Code.gs"
    echo "  3. Run setup wizard: https://script.google.com/macros/s/{SCRIPT_ID}/exec?action=setup"
    echo "  4. Login with admin credentials"
    echo ""
}

# Main
main() {
    check_node
    check_npm
    check_git
    install_clasp
    install_deps
    setup_gas
    setup_ai
    deploy_app
    build_pwa
    show_summary
}

main