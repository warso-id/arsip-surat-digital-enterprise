#!/bin/bash

# ============================================
# ARSIP SURAT DIGITAL ENTERPRISE
# Seed Demo Data Script
# ============================================
# Usage: bash tools/seed-demo-data.sh
# ============================================

echo "=========================================="
echo "  SEED DEMO DATA"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js tidak ditemukan! Install Node.js terlebih dahulu."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ NPM tidak ditemukan!"
    exit 1
fi

# Confirm action
read -p "⚠️  Ini akan menghapus data yang ada dan mengisi dengan data demo. Lanjutkan? (y/N): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "❌ Operasi dibatalkan."
    exit 0
fi

echo ""
echo "🔄 Menjalankan database rollback..."
npm run db:rollback

echo "🔄 Menjalankan database migration..."
npm run db:migrate

echo "🔄 Menjalankan database seeder..."
npm run db:seed

echo ""
echo "✅ Demo data berhasil di-generate!"
echo ""
echo "📋 Data Demo:"
echo "   - 4 Roles (Super Admin, Admin, Staff, Kabag)"
echo "   - 10 Kategori Surat"
echo "   - 5 Instansi"
echo "   - 5 Pengguna"
echo "   - 5 Surat (masuk & keluar)"
echo ""
echo "🔑 Login Info:"
echo "   Email: admin@arsipsurat.id"
echo "   Password: password123"
echo ""
echo "=========================================="
