#!/bin/bash

# ============================================
# ARSIP SURAT DIGITAL ENTERPRISE v3.1.0
# WORKFLOW EXECUTION SCRIPT
# ============================================

echo "========================================"
echo "  ARSIP SURAT DIGITAL ENTERPRISE v3.1.0"
echo "  WORKFLOW EXECUTION"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
WEB_APP_URL="https://script.google.com/macros/s/AKfycbzzmttzSRYsM7KodsEdFqHRdwBs2kY7VTzFPOpsiab3p3v-6CBl-eKIuUI0Vhqd0opYtA/exec"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="Admin123!"
ADMIN_EMAIL="admin@instansi.id"

# Function to make API calls
api_call() {
    local method=$1
    local action=$2
    local data=$3
    local token=$4
    
    if [ "$method" = "GET" ]; then
        curl -s "${WEB_APP_URL}?action=${action}&token=${token}"
    else
        curl -s -X POST "${WEB_APP_URL}" \
            -H "Content-Type: application/json" \
            -d "${data}"
    fi
}

echo -e "${BLUE}[STEP 1/10]${NC} Checking system connectivity..."
PING_RESPONSE=$(api_call "GET" "ping" "" "")
echo "Response: $PING_RESPONSE"
if echo "$PING_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ System is online${NC}"
else
    echo -e "${RED}❌ System is offline. Please check WEB_APP_URL${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}[STEP 2/10]${NC} Checking setup status..."
SETUP_CHECK=$(api_call "GET" "checkSetup" "" "")
echo "Response: $SETUP_CHECK"
if echo "$SETUP_CHECK" | grep -q '"isSetup":true'; then
    echo -e "${YELLOW}⚠️  System already setup. Skipping setup...${NC}"
    SKIP_SETUP=true
else
    echo -e "${YELLOW}📝 System not setup. Will run setup...${NC}"
    SKIP_SETUP=false
fi
echo ""

if [ "$SKIP_SETUP" = false ]; then
    echo -e "${BLUE}[STEP 3/10]${NC} Generating folder structure..."
    FOLDER_RESPONSE=$(api_call "POST" "generateFolders" '{"action":"generateFolders"}' "")
    echo "Response: $FOLDER_RESPONSE"
    if echo "$FOLDER_RESPONSE" | grep -q "success"; then
        echo -e "${GREEN}✅ Folders generated successfully${NC}"
    else
        echo -e "${RED}❌ Folder generation failed${NC}"
    fi
    echo ""

    echo -e "${BLUE}[STEP 4/10]${NC} Running system setup..."
    SETUP_DATA=$(cat <<EOF
{
    "action": "setup",
    "admin": {
        "username": "$ADMIN_USERNAME",
        "password": "$ADMIN_PASSWORD",
        "email": "$ADMIN_EMAIL",
        "namaLengkap": "Administrator",
        "nip": "",
        "jabatan": "Administrator Sistem",
        "unitKerja": "TI"
    },
    "instansi": {
        "nama": "Instansi Pemerintah",
        "alamat": "Jl. Contoh No. 123",
        "telepon": "021-12345678",
        "email": "info@instansi.id",
        "website": "https://instansi.id"
    }
}
EOF
)
    SETUP_RESPONSE=$(api_call "POST" "setup" "$SETUP_DATA" "")
    echo "Response: $SETUP_RESPONSE"
    if echo "$SETUP_RESPONSE" | grep -q "success"; then
        echo -e "${GREEN}✅ System setup completed${NC}"
    else
        echo -e "${RED}❌ Setup failed${NC}"
    fi
    echo ""
fi

echo -e "${BLUE}[STEP 5/10]${NC} Testing login..."
LOGIN_DATA="{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}"
LOGIN_RESPONSE=$(api_call "GET" "login" "" "")
# For login, we need to pass credentials as params
LOGIN_RESPONSE=$(curl -s "${WEB_APP_URL}?action=login&username=${ADMIN_USERNAME}&password=${ADMIN_PASSWORD}")
echo "Response: $LOGIN_RESPONSE"
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ Login successful. Token obtained.${NC}"
    echo "Token: ${TOKEN:0:20}..."
else
    echo -e "${RED}❌ Login failed${NC}"
fi
echo ""

if [ -n "$TOKEN" ]; then
    echo -e "${BLUE}[STEP 6/10]${NC} Testing dashboard..."
    DASHBOARD_RESPONSE=$(api_call "GET" "dashboard.stats" "" "$TOKEN")
    echo "Response: $DASHBOARD_RESPONSE"
    if echo "$DASHBOARD_RESPONSE" | grep -q "success"; then
        echo -e "${GREEN}✅ Dashboard accessible${NC}"
    else
        echo -e "${RED}❌ Dashboard failed${NC}"
    fi
    echo ""

    echo -e "${BLUE}[STEP 7/10]${NC} Testing surat masuk..."
    SURAT_MASUK_RESPONSE=$(api_call "GET" "suratMasuk.list" "" "$TOKEN")
    echo "Response: $SURAT_MASUK_RESPONSE"
    if echo "$SURAT_MASUK_RESPONSE" | grep -q "success"; then
        echo -e "${GREEN}✅ Surat Masuk module working${NC}"
    else
        echo -e "${RED}❌ Surat Masuk module failed${NC}"
    fi
    echo ""

    echo -e "${BLUE}[STEP 8/10]${NC} Testing surat keluar..."
    SURAT_KELUAR_RESPONSE=$(api_call "GET" "suratKeluar.list" "" "$TOKEN")
    echo "Response: $SURAT_KELUAR_RESPONSE"
    if echo "$SURAT_KELUAR_RESPONSE" | grep -q "success"; then
        echo -e "${GREEN}✅ Surat Keluar module working${NC}"
    else
        echo -e "${RED}❌ Surat Keluar module failed${NC}"
    fi
    echo ""

    echo -e "${BLUE}[STEP 9/10]${NC} Testing system status..."
    SYSTEM_RESPONSE=$(api_call "GET" "system.status" "" "$TOKEN")
    echo "Response: $SYSTEM_RESPONSE"
    if echo "$SYSTEM_RESPONSE" | grep -q "success"; then
        echo -e "${GREEN}✅ System status OK${NC}"
    else
        echo -e "${RED}❌ System status check failed${NC}"
    fi
    echo ""

    echo -e "${BLUE}[STEP 10/10]${NC} Testing blockchain..."
    BLOCKCHAIN_RESPONSE=$(api_call "GET" "blockchain.getStats" "" "$TOKEN")
    echo "Response: $BLOCKCHAIN_RESPONSE"
    if echo "$BLOCKCHAIN_RESPONSE" | grep -q "success"; then
        echo -e "${GREEN}✅ Blockchain module working${NC}"
    else
        echo -e "${RED}❌ Blockchain module failed${NC}"
    fi
    echo ""
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  WORKFLOW EXECUTION COMPLETED!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Summary:"
echo "  - System URL: $WEB_APP_URL"
echo "  - Admin Username: $ADMIN_USERNAME"
echo "  - Admin Password: $ADMIN_PASSWORD"
echo ""
echo "Next Steps:"
echo "  1. Run 'npm install && npm run dev' for frontend"
echo "  2. Open http://localhost:3000 in browser"
echo "  3. Login with admin credentials"
echo ""
