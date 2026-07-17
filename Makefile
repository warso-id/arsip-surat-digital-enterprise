# ============================================================
# ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
# Makefile - Build Automation
# ============================================================

.PHONY: help install dev build test lint format clean deploy docker health-check

# Default target
help:
	@echo "============================================"
	@echo "  Arsip Surat Digital Enterprise v3.0.0"
	@echo "  Available Commands:"
	@echo "============================================"
	@echo ""
	@echo "  make install      - Install dependencies"
	@echo "  make dev          - Start development server"
	@echo "  make build        - Build for production"
	@echo "  make test         - Run all tests"
	@echo "  make test-unit    - Run unit tests"
	@echo "  make test-e2e     - Run E2E tests"
	@echo "  make lint         - Run linters"
	@echo "  make format       - Format code"
	@echo "  make clean        - Clean build files"
	@echo "  make deploy       - Deploy to server"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-run   - Run Docker container"
	@echo "  make health-check - Run health checks"
	@echo ""

# ==================== INSTALL ====================
install:
	@echo "📦 Installing dependencies..."
	npm ci
	@echo "✅ Dependencies installed"

install-dev:
	@echo "📦 Installing dev dependencies..."
	npm install
	@echo "✅ Dev dependencies installed"

# ==================== DEVELOPMENT ====================
dev:
	@echo "🚀 Starting development server..."
	npm run dev

dev-build:
	@echo "🔨 Building for development..."
	NODE_ENV=development npx webpack --config webpack.config.js --mode development

# ==================== BUILD ====================
build:
	@echo "🔨 Building for production..."
	NODE_ENV=production npx webpack --config webpack.config.js --mode production
	@echo "✅ Build complete: dist/"

build-analyze:
	@echo "📊 Analyzing bundle..."
	NODE_ENV=production npx webpack --config webpack.config.js --mode production --profile --json > stats.json
	npx webpack-bundle-analyzer stats.json

# ==================== TESTING ====================
test:
	@echo "🧪 Running all tests..."
	npm test

test-unit:
	@echo "🧪 Running unit tests..."
	npm run test:unit

test-unit-watch:
	@echo "🧪 Running unit tests (watch mode)..."
	npm run test:unit -- --watch

test-integration:
	@echo "🧪 Running integration tests..."
	npm run test:integration

test-e2e:
	@echo "🧪 Running E2E tests..."
	npm run test:e2e

test-e2e-open:
	@echo "🧪 Opening Cypress..."
	npx cypress open

test-coverage:
	@echo "📊 Generating coverage report..."
	npm run test:coverage
	@echo "✅ Coverage report: coverage/index.html"

# ==================== LINTING ====================
lint:
	@echo "🔍 Linting JavaScript..."
	npx eslint 'src/public/js/**/*.js' --fix
	@echo "🔍 Linting CSS..."
	npx stylelint 'src/public/css/**/*.css' --fix
	@echo "✅ Linting complete"

lint-js:
	@echo "🔍 Linting JavaScript..."
	npx eslint 'src/public/js/**/*.js' --fix

lint-css:
	@echo "🔍 Linting CSS..."
	npx stylelint 'src/public/css/**/*.css' --fix

# ==================== FORMATTING ====================
format:
	@echo "✨ Formatting code..."
	npx prettier --write '**/*.{js,json,css,html,md}'
	@echo "✅ Formatting complete"

format-check:
	@echo "🔍 Checking formatting..."
	npx prettier --check '**/*.{js,json,css,html,md}'

# ==================== CLEANING ====================
clean:
	@echo "🧹 Cleaning..."
	rm -rf dist/
	rm -rf build/
	rm -rf coverage/
	rm -rf .nyc_output/
	rm -rf node_modules/.cache/
	rm -f stats.json
	@echo "✅ Cleaned"

clean-all: clean
	@echo "🧹 Cleaning all..."
	rm -rf node_modules/
	rm -f package-lock.json
	@echo "✅ All cleaned"

# ==================== DEPLOYMENT ====================
deploy:
	@echo "🚀 Deploying..."
	./scripts/deploy.sh

deploy-server:
	@echo "🚀 Deploying to server..."
	./scripts/deploy.sh server

deploy-docker:
	@echo "🚀 Deploying with Docker..."
	./scripts/deploy.sh docker

deploy-github:
	@echo "🚀 Deploying to GitHub Pages..."
	./scripts/deploy.sh github

# ==================== DOCKER ====================
docker-build:
	@echo "🐳 Building Docker image..."
	docker build -t arsip-surat-enterprise:latest -t arsip-surat-enterprise:3.0.0 .

docker-run:
	@echo "🐳 Running Docker container..."
	docker-compose -f docker-production.yml up -d

docker-stop:
	@echo "🐳 Stopping Docker container..."
	docker-compose -f docker-production.yml down

docker-logs:
	@echo "📋 Docker logs..."
	docker-compose -f docker-production.yml logs -f

docker-clean:
	@echo "🧹 Cleaning Docker..."
	docker-compose -f docker-production.yml down -v
	docker system prune -f

# ==================== HEALTH CHECK ====================
health-check:
	@echo "🏥 Running health check..."
	./scripts/health-check.sh

# ==================== BACKUP ====================
backup:
	@echo "💾 Creating backup..."
	./scripts/backup.sh

# ==================== VERSION ====================
version:
	@echo "📋 Arsip Surat Digital Enterprise v3.0.0"
	@node -e "console.log(JSON.parse(require('fs').readFileSync('VERSION.json','utf8')))"

# ==================== UTILITIES ====================
count-lines:
	@echo "📊 Counting lines of code..."
	@find . -name '*.js' -o -name '*.css' -o -name '*.html' | grep -v node_modules | grep -v dist | xargs wc -l

count-files:
	@echo "📊 Counting files..."
	@find . -type f | grep -v node_modules | grep -v dist | grep -v .git | wc -l

tree:
	@echo "📁 Project structure:"
	@tree -I 'node_modules|dist|backups|coverage|.git' -L 3

# ==================== RELEASE ====================
release:
	@echo "🚀 Creating release..."
	@make clean
	@make test
	@make lint
	@make build
	@echo "✅ Release ready: dist/"
