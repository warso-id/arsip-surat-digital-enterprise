#!/bin/bash
# backup.sh - Database Backup Script

BACKUP_DIR="src/storage/backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.json"
GAS_URL="https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec"
TOKEN=$(grep AUTH_TOKEN .env | cut -d '=' -f2)

echo "Creating backup..."
echo "Timestamp: ${TIMESTAMP}"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# Get all data from Google Apps Script
curl -X POST "$GAS_URL" \
    -H "Content-Type: application/json" \
    -d "{\"action\":\"backup_all\",\"token\":\"${TOKEN}\"}" \
    -o "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

echo "Backup created: ${BACKUP_FILE}.gz"

# Clean old backups (keep last 30 days)
find "$BACKUP_DIR" -name "backup_*.json.gz" -mtime +30 -delete

echo "Old backups cleaned"
echo "Backup complete!"
