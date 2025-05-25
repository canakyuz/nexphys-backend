# Makefile'a ek komutlar

##@ Advanced Seeding
seed-all: ## Seed all schemas (public + all tenants)
	make seed-public-local && make seed-tenants-local

seed-tenants-local: ## Seed all tenant schemas locally
	DB_HOST=localhost DB_PORT=5432 npm run seed:tenant

seed-specific-tenant: ## Seed specific tenant (TENANT=domain)
	@if [ -z "$(TENANT)" ]; then echo "❌ TENANT is required. Usage: make seed-specific-tenant TENANT=fitmax-gym"; exit 1; fi
	DB_HOST=localhost DB_PORT=5432 npm run seed:tenant $(TENANT)

##@ Tenant Demo Setup
demo-setup: ## Complete demo setup with all tenant types
	@echo "🚀 Setting up NexFit multi-tenant demo..."
	make start
	@sleep 10
	make migrate-public-local
	make seed-public-local
	make seed-tenants-local
	@echo "✅ Demo setup complete!"
	@echo ""
	@echo "🏢 Available Tenants:"
	@echo "  • FitMax Gym (GYM): fitmax-gym"
	@echo "  • Zen Yoga Studio (STUDIO): zen-yoga" 
	@echo "  • Elite Personal Training (PERSONAL_TRAINER): elite-pt"
	@echo "  • TechCorp Wellness (ENTERPRISE): techcorp-wellness"
	@echo ""
	@echo "🌐 Test endpoints:"
	@echo "  curl http://localhost:3000/api/v1/tenants"
	@echo "  curl -H 'X-Tenant-Domain: fitmax-gym' http://localhost:3000/api/v1/auth/login"

##@ Quick Tests
test-tenants: ## Test all tenant endpoints
	@echo "🧪 Testing tenant endpoints..."
	@curl -s http://localhost:3000/api/v1/tenants | jq .
	@echo "\n"

test-gym-auth: ## Test gym authentication
	@echo "🧪 Testing gym authentication..."
	@curl -s -X POST http://localhost:3000/api/v1/auth/login \
		-H "Content-Type: application/json" \
		-H "X-Tenant-Domain: fitmax-gym" \
		-d '{"email": "member@fitmax-gym.com", "password": "password123"}' | jq .

test-studio-auth: ## Test studio authentication  
	@echo "🧪 Testing studio authentication..."
	@curl -s -X POST http://localhost:3000/api/v1/auth/login \
		-H "Content-Type: application/json" \
		-H "X-Tenant-Domain: zen-yoga" \
		-d '{"email": "student@zen-yoga.com", "password": "password123"}' | jq .

test-pt-auth: ## Test personal trainer authentication
	@echo "🧪 Testing personal trainer authentication..."
	@curl -s -X POST http://localhost:3000/api/v1/auth/login \
		-H "Content-Type: application/json" \
		-H "X-Tenant-Domain: elite-pt" \
		-d '{"email": "coach@elite-pt.com", "password": "password123"}' | jq .

test-enterprise-auth: ## Test enterprise authentication
	@echo "🧪 Testing enterprise authentication..."
	@curl -s -X POST http://localhost:3000/api/v1/auth/login \
		-H "Content-Type: application/json" \
		-H "X-Tenant-Domain: techcorp-wellness" \
		-d '{"email": "wellness@techcorp.com", "password": "password123"}' | jq .

##@ Database Status
db-status: ## Show database and tenant status
	@echo "📊 Database Status:"
	@echo "=================="
	@echo "PostgreSQL:"
	@docker-compose exec postgres pg_isready -U nexfit_user
	@echo ""
	@echo "Public Schema Tables:"
	@docker-compose exec postgres psql -U nexfit_user -d nexfit_db -c "\dt public.*"
	@echo ""
	@echo "Tenant Schemas:"
	@docker-compose exec postgres psql -U nexfit_user -d nexfit_db -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%';"

tenant-schemas: ## List all tenant schemas
	@echo "🏢 Tenant Schemas:"
	@docker-compose exec postgres psql -U nexfit_user -d nexfit_db -c "SELECT t.name, t.domain, t.tenant_type, t.schema_name, t.is_schema_created FROM tenants t ORDER BY t.created_at;"

##@ Development Helpers
reset-all: ## Reset everything (DANGEROUS - deletes all data)
	@echo "⚠️  WARNING: This will delete ALL data!"
	@read -p "Are you sure? (y/N): " confirm && [ "$confirm" = "y" ] || exit 1
	docker-compose down -v
	docker system prune -f
	make start
	@sleep 10
	make migrate-public-local
	make seed-all

logs-tail: ## Tail all logs
	docker-compose logs -f --tail=50

status: ## Show full system status
	@echo "🚀 NexFit System Status"
	@echo "======================"
	@echo "Docker Services:"
	@docker-compose ps
	@echo ""
	@echo "API Health:"
	@curl -s http://localhost:3000/health | jq .status
	@echo ""
	@echo "Database:"
	@docker-compose exec postgres pg_isready -U nexfit_user
	@echo ""
	@echo "Tenant Count:"
	@curl -s http://localhost:3000/api/v1/tenants | jq '.data | length'