#!/bin/bash

# Backup Script for Arsip Surat Digital
# Usage: ./backup.sh [backup_type]

set -e

# Configuration
BACKUP_DIR="${BACKUP_PATH:-./backups}"
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USERNAME:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_DATABASE:-arsip_surat}"
UPLOAD_DIR="./uploads"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="arsip_surat_backup_${TIMESTAMP}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "========================================="
echo "Arsip Surat Digital - Backup Script"
echo "========================================="
echo "Started at: $(date)"
echo "Backup directory: $BACKUP_DIR"
echo "========================================="

# Function: Backup database
backup_database() {
    echo ""
    echo "1. Backing up database..."
    
    DB_BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}_database.sql.gz"
    
    if [ -z "$DB_PASSWORD" ]; then
        mysqldump -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" | gzip > "$DB_BACKUP_FILE"
    else
        mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" | gzip > "$DB_BACKUP_FILE"
    fi
    
    if [ $? -eq 0 ]; then
        echo "   ✓ Database backup completed: $DB_BACKUP_FILE"
        echo "   Size: $(du -h "$DB_BACKUP_FILE" | cut -f1)"
    else
        echo "   ✗ Database backup failed!"
        exit 1
    fi
}

# Function: Backup files
backup_files() {
    echo ""
    echo "2. Backing up files..."
    
    FILES_BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}_files.tar.gz"
    
    if [ -d "$UPLOAD_DIR" ]; then
        tar -czf "$FILES_BACKUP_FILE" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")"
        
        if [ $? -eq 0 ]; then
            echo "   ✓ Files backup completed: $FILES_BACKUP_FILE"
            echo "   Size: $(du -h "$FILES_BACKUP_FILE" | cut -f1)"
        else
            echo "   ✗ Files backup failed!"
            exit 1
        fi
    else
        echo "   Upload directory not found, skipping files backup"
    fi
}

# Function: Backup configuration
backup_config() {
    echo ""
    echo "3. Backing up configuration..."
    
    CONFIG_BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}_config.tar.gz"
    
    tar -czf "$CONFIG_BACKUP_FILE" .env src/config 2>/dev/null || true
    
    if [ -f "$CONFIG_BACKUP_FILE" ]; then
        echo "   ✓ Configuration backup completed: $CONFIG_BACKUP_FILE"
        echo "   Size: $(du -h "$CONFIG_BACKUP_FILE" | cut -f1)"
    else
        echo "   No configuration files found, skipping"
    fi
}

# Function: Create full backup archive
create_full_backup() {
    echo ""
    echo "4. Creating full backup archive..."
    
    FULL_BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}_full.tar.gz"
    
    tar -czf "$FULL_BACKUP_FILE" \
        -C "$BACKUP_DIR" \
        "${BACKUP_NAME}_database.sql.gz" \
        "${BACKUP_NAME}_files.tar.gz" \
        "${BACKUP_NAME}_config.tar.gz" 2>/dev/null || true
    
    if [ -f "$FULL_BACKUP_FILE" ]; then
        echo "   ✓ Full backup archive created: $FULL_BACKUP_FILE"
        echo "   Size: $(du -h "$FULL_BACKUP_FILE" | cut -f1)"
        
        # Remove individual files
        rm -f "${BACKUP_DIR}/${BACKUP_NAME}_database.sql.gz"
        rm -f "${BACKUP_DIR}/${BACKUP_NAME}_files.tar.gz"
        rm -f "${BACKUP_DIR}/${BACKUP_NAME}_config.tar.gz"
    fi
}

# Function: Clean old backups
clean_old_backups() {
    echo ""
    echo "5. Cleaning old backups (older than $RETENTION_DAYS days)..."
    
    OLD_BACKUPS=$(find "$BACKUP_DIR" -name "arsip_surat_backup_*" -mtime +$RETENTION_DAYS)
    
    if [ -n "$OLD_BACKUPS" ]; then
        echo "$OLD_BACKUPS" | while read -r file; do
            echo "   Deleting: $(basename "$file")"
            rm -f "$file"
        done
        echo "   ✓ Old backups cleaned"
    else
        echo "   No old backups to clean"
    fi
}

# Function: Create backup manifest
create_manifest() {
    echo ""
    echo "6. Creating backup manifest..."
    
    MANIFEST_FILE="${BACKUP_DIR}/${BACKUP_NAME}_manifest.txt"
    
    cat > "$MANIFEST_FILE" << EOF
Backup Manifest
===============
Date: $(date)
Backup Name: ${BACKUP_NAME}
Database: ${DB_NAME}
Files: ${UPLOAD_DIR}

Files Included:
$(find "$BACKUP_DIR" -name "${BACKUP_NAME}*" -exec basename {} \;)

Backup Size: $(du -sh "$BACKUP_DIR/${BACKUP_NAME}"* 2>/dev/null | awk '{print $1}')

This backup was created by Arsip Surat Digital Backup Script
EOF
    
    echo "   ✓ Manifest created: $MANIFEST_FILE"
}

# Function: Send notification
send_notification() {
    if [ -n "$NOTIFICATION_WEBHOOK" ]; then
        echo ""
        echo "7. Sending notification..."
        
        curl -X POST "$NOTIFICATION_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{
                \"text\": \"✅ Backup Arsip Surat Digital selesai\n📅 Tanggal: $(date)\n📁 File: ${BACKUP_NAME}_full.tar.gz\n💾 Ukuran: $(du -h "${BACKUP_DIR}/${BACKUP_NAME}_full.tar.gz" 2>/dev/null | cut -f1)\"
            }" 2>/dev/null || true
        
        echo "   ✓ Notification sent"
    fi
}

# Main backup process
main() {
    echo ""
    echo "Starting backup process..."
    
    case "${1:-full}" in
        "database")
            backup_database
            ;;
        "files")
            backup_files
            ;;
        "config")
            backup_config
            ;;
        "full")
            backup_database
            backup_files
            backup_config
            create_full_backup
            ;;
        *)
            echo "Usage: $0 [database|files|config|full]"
            exit 1
            ;;
    esac
    
    clean_old_backups
    create_manifest
    send_notification
    
    echo ""
    echo "========================================="
    echo "Backup completed successfully!"
    echo "Finished at: $(date)"
    echo "========================================="
}

# Run main
main "$@"
