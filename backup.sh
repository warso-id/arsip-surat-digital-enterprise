#!/bin/bash

# ============================================
# ARSIP SURAT DIGITAL ENTERPRISE v3.1.0 (2026)
# Backup Script with Blockchain Verification
# ============================================

VERSION="3.1.0"
BACKUP_DIR="./backups"
LOG_FILE="./logs/backup-$(date +%Y%m%d).log"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR" "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [v${VERSION}] $1" | tee -a "$LOG_FILE"
}

# Backup Google Sheets
backup_sheets() {
    log "📊 Starting Google Sheets backup..."
    
    # GANTI: Script ID Anda
    SCRIPT_ID="${SCRIPT_ID:-YOUR_SCRIPT_ID}"
    BACKUP_URL="https://script.google.com/macros/s/${SCRIPT_ID}/exec?action=backup.create"
    
    RESPONSE=$(curl -s -X POST "$BACKUP_URL")
    
    if echo "$RESPONSE" | grep -q '"status":"success"'; then
        log "✅ Sheets backup successful"
        echo "$RESPONSE" > "$BACKUP_DIR/sheets-$(date +%Y%m%d-%H%M%S).json"
    else
        log "❌ Sheets backup failed"
    fi
}

# Backup Blockchain
backup_blockchain() {
    log "🔗 Backing up blockchain data..."
    
    SCRIPT_ID="${SCRIPT_ID:-YOUR_SCRIPT_ID}"
    BC_URL="https://script.google.com/macros/s/${SCRIPT_ID}/exec?action=blockchain.getChain"
    
    RESPONSE=$(curl -s -H "Authorization: Bearer ${API_TOKEN}" "$BC_URL")
    
    if echo "$RESPONSE" | grep -q '"status":"success"'; then
        echo "$RESPONSE" > "$BACKUP_DIR/blockchain-$(date +%Y%m%d-%H%M%S).json"
        log "✅ Blockchain backup successful"
    else
        log "❌ Blockchain backup failed"
    fi
}

# Backup AI Models
backup_ai() {
    log "🤖 Backing up AI data..."
    
    if [ -d "ai-models" ]; then
        tar -czf "$BACKUP_DIR/ai-models-$(date +%Y%m%d-%H%M%S).tar.gz" ai-models/
        log "✅ AI models backed up"
    fi
}

# Verify Blockchain Integrity
verify_blockchain() {
    log "🔍 Verifying blockchain integrity..."
    
    SCRIPT_ID="${SCRIPT_ID:-YOUR_SCRIPT_ID}"
    VERIFY_URL="https://script.google.com/macros/s/${SCRIPT_ID}/exec?action=blockchain.verifyChain"
    
    RESPONSE=$(curl -s -H "Authorization: Bearer ${API_TOKEN}" "$VERIFY_URL")
    
    if echo "$RESPONSE" | grep -q '"isValid":true'; then
        log "✅ Blockchain integrity verified"
    else
        log "⚠️ Blockchain integrity check failed!"
    fi
}

# Clean old backups
clean_old() {
    log "🧹 Cleaning backups older than ${RETENTION_DAYS} days..."
    find "$BACKUP_DIR" -name "*.json" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
    log "✅ Cleanup complete"
}

# Main
main() {
    log "🚀 Starting backup v${VERSION}"
    
    backup_sheets
    backup_blockchain
    backup_ai
    verify_blockchain
    clean_old
    
    log "✅ Backup v${VERSION} complete"
}

main