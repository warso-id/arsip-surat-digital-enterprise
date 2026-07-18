#!/bin/bash

# Clean old log files
LOG_DIR="./storage/logs"
RETENTION_DAYS=30

echo "Cleaning log files older than $RETENTION_DAYS days..."

find "$LOG_DIR" -name "*.log" -mtime +$RETENTION_DAYS -delete
find "$LOG_DIR" -name "*.gz" -delete

echo "Log files cleaned successfully"
