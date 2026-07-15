#!/bin/bash

# ============================================
# ARSIP SURAT DIGITAL ENTERPRISE
# Database Backup Script
# ============================================
# Usage: bash tools/backup-database.sh [environment]
# Example: bash tools/backup-database.sh production
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Config
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="storage/backup"
ENV=${1:-development}
BACKUP_FILE="${BACKUP_DIR}/backup_${ENV}_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

echo -e "${BLUE}=========================================="
echo "  ARSIP SURAT DIGITAL - DATABASE BACKUP"
echo "==========================================${NC}"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Detect database type
if [ -f "src/database/arsip_surat.sqlite" ]; then
    DB_TYPE="sqlite"
    DB_PATH="src/database/arsip_surat.sqlite"
elif [ -n "$DATABASE_URL" ]; then
    DB_TYPE="postgresql"
else
    echo -e "${RED}❌ Database tidak ditemukan!${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Tipe Database: ${DB_TYPE}${NC}"
echo -e "${YELLOW}🌍 Environment: ${ENV}${NC}"
echo ""

# Perform backup
case $DB_TYPE in
    sqlite)
        echo -e "${BLUE}🔄 Mem-backup SQLite database...${NC}"
        
        if [ -f "$DB_PATH" ]; then
            sqlite3 "$DB_PATH" .dump | gzip > "$BACKUP_FILE"
            
            if [ $? -eq 0 ]; then
                SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
                echo -e "${GREEN}✅ Backup berhasil!${NC}"
                echo -e "   📁 File: ${BACKUP_FILE}"
                echo -e "   📏 Size: ${SIZE}"
            else
                echo -e "${RED}❌ Backup gagal!${NC}"
                exit 1
            fi
        else
            echo -e "${RED}❌ File database SQLite tidak ditemukan di: ${DB_PATH}${NC}"
            exit 1
        fi
        ;;
    
    postgresql)
        echo -e "${BLUE}🔄 Mem-backup PostgreSQL database...${NC}"
        
        pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"
        
        if [ $? -eq 0 ]; then
            SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
            echo -e "${GREEN}✅ Backup berhasil!${NC}"
            echo -e "   📁 File: ${BACKUP_FILE}"
            echo -e "   📏 Size: ${SIZE}"
        else
            echo -e "${RED}❌ Backup gagal!${NC}"
            exit 1
        fi
        ;;
esac

# Clean old backups
echo ""
echo -e "${BLUE}🧹 Membersihkan backup lama (>${RETENTION_DAYS} hari)...${NC}"

OLD_BACKUPS=$(find "$BACKUP_DIR" -name "backup_${ENV}_*.sql.gz" -mtime +$RETENTION_DAYS 2>/dev/null | wc -l)

if [ $OLD_BACKUPS -gt 0 ]; then
    find "$BACKUP_DIR" -name "backup_${ENV}_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    echo -e "${GREEN}✅ ${OLD_BACKUPS} file backup lama dihapus${NC}"
else
    echo -e "${YELLOW}ℹ️  Tidak ada backup lama yang perlu dihapus${NC}"
fi

# List recent backups
echo ""
echo -e "${BLUE}📋 5 Backup Terbaru:${NC}"
ls -1t "$BACKUP_DIR"/backup_${ENV}_*.sql.gz 2>/dev/null | head -5 | while read file; do
    echo "   📄 $(basename "$file") ($(du -h "$file" | cut -f1))"
done

echo ""
echo -e "${GREEN}=========================================="
echo "  ✅ BACKUP SELESAI"
echo "==========================================${NC}"
