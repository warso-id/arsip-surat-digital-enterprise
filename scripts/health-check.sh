#!/bin/bash

# Health check script
APP_URL="${APP_URL:-http://localhost:3000}"
TIMEOUT=5

echo "Checking application health at $APP_URL..."

response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$APP_URL/health")

if [ "$response" = "200" ]; then
    echo "✓ Application is healthy (HTTP $response)"
    exit 0
else
    echo "✗ Application is not responding (HTTP $response)"
    exit 1
fi
