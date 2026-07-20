.PHONY: help install dev start build test clean docker-up docker-down migrate seed

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm install

dev: ## Start development server
	npm run dev

start: ## Start production server
	npm start

build: ## Build assets
	npm run build

test: ## Run tests
	npm test

test-coverage: ## Run tests with coverage
	npm test -- --coverage

lint: ## Run linter
	npm run lint

clean: ## Clean build files
	rm -rf dist build coverage

docker-up: ## Start Docker containers
	docker-compose up -d

docker-down: ## Stop Docker containers
	docker-compose down

docker-build: ## Build Docker images
	docker-compose build

docker-logs: ## View Docker logs
	docker-compose logs -f

migrate: ## Run database migrations
	npm run migrate

migrate-rollback: ## Rollback database migrations
	node src/database/migrations/rollback.js

seed: ## Run database seeders
	npm run seed

backup: ## Create database backup
	./tools/backup.sh full

restore: ## Restore database from backup
	@echo "Usage: make restore FILE=backup_file.tar.gz"
	./tools/backup.sh restore $(FILE)

db-shell: ## Open database shell
	docker-compose exec mysql mysql -u arsip_user -p arsip_surat

redis-shell: ## Open Redis shell
	docker-compose exec redis redis-cli -a $(REDIS_PASSWORD)

app-shell: ## Open app shell
	docker-compose exec app sh

logs: ## View application logs
	tail -f storage/logs/combined.log

error-logs: ## View error logs
	tail -f storage/logs/error.log

reset: ## Reset everything (clean, migrate, seed)
	make clean
	make migrate
	make seed

deploy: ## Deploy to production
	git pull origin main
	npm ci --production
	npm run migrate
	pm2 restart ecosystem.config.js --env production

setup: ## Initial setup
	cp .env.example .env
	npm install
	npm run migrate
	npm run seed
	@echo "Setup complete! Edit .env file with your configuration."
