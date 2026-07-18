#!/bin/sh
set -e

echo "Starting Arsip Surat Digital Entrypoint..."

# Wait for MySQL
echo "Waiting for MySQL to be ready..."
while ! mysqladmin ping -h"$DB_HOST" -u"$DB_USERNAME" -p"$DB_PASSWORD" --silent; do
    sleep 2
done
echo "MySQL is ready!"

# Wait for Redis
echo "Waiting for Redis to be ready..."
while ! redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" ping; do
    sleep 2
done
echo "Redis is ready!"

# Run migrations
echo "Running database migrations..."
npm run migrate

# Run seeders (only in development)
if [ "$NODE_ENV" = "development" ]; then
    echo "Running database seeders..."
    npm run seed
fi

# Start application
echo "Starting application..."
exec "$@"
