#!/bin/bash

# Initial setup script for Arsip Surat Digital
set -e

echo "========================================="
echo "Arsip Surat Digital - Setup Script"
echo "========================================="

# Check Node.js
echo ""
echo "1. Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi
echo "   Node.js version: $(node -v)"

# Check npm
echo ""
echo "2. Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "npm is not installed."
    exit 1
fi
echo "   npm version: $(npm -v)"

# Check MySQL
echo ""
echo "3. Checking MySQL..."
if command -v mysql &> /dev/null; then
    echo "   MySQL is available"
else
    echo "   MySQL client not found (optional for local development)"
fi

# Setup environment file
echo ""
echo "4. Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "   Created .env file from .env.example"
    echo "   Please edit .env with your configuration"
else
    echo "   .env file already exists"
fi

# Install dependencies
echo ""
echo "5. Installing dependencies..."
npm install

# Create directories
echo ""
echo "6. Creating required directories..."
mkdir -p storage/app storage/logs uploads backups public/dist

# Run migrations
echo ""
echo "7. Running database migrations..."
read -p "   Run migrations now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run migrate
fi

# Run seeders
echo ""
echo "8. Running database seeders..."
read -p "   Run seeders now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run seed
fi

echo ""
echo "========================================="
echo "Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Run 'npm run dev' to start development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "Default login:"
echo "   Email: superadmin@arsipsurat.com"
echo "   Password: SuperAdmin123!"
echo "========================================="
