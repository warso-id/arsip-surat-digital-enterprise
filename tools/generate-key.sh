#!/bin/bash

# ============================================
# ARSIP SURAT DIGITAL ENTERPRISE
# Generate Application Key Script
# ============================================
# Usage: bash tools/generate-key.sh
# ============================================

echo "=========================================="
echo "  GENERATE APPLICATION KEY"
echo "=========================================="
echo ""

# Generate random key using Node.js
if command -v node &> /dev/null; then
    KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
elif command -v openssl &> /dev/null; then
    KEY=$(openssl rand -hex 32)
else
    echo "❌ Tidak dapat generate key. Install Node.js atau OpenSSL."
    exit 1
fi

echo "🔑 Generated Key:"
echo "   $KEY"
echo ""

# Update .env file if exists
if [ -f ".env" ]; then
    echo "🔄 Mengupdate APP_KEY di .env..."
    
    if grep -q "^APP_KEY=" .env; then
        sed -i.bak "s/^APP_KEY=.*/APP_KEY=$KEY/" .env
    else
        echo "APP_KEY=$KEY" >> .env
    fi
    
    echo "✅ APP_KEY berhasil diupdate di .env"
else
    echo "⚠️  File .env tidak ditemukan. Salin key secara manual."
    echo ""
    echo "   APP_KEY=$KEY"
fi

echo ""
echo "=========================================="
