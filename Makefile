# Makefile'a ek komutlar

##@ Advanced Seeding
seed-all: ## Seed all schemas (public + all tenants)
	make seed-public-local && make seed-tenants-local

seed-tenants-local: ## Seed all tenant schemas locally
	DB_HOST=localhost DB_PORT=5432 npm run seed:tenant

seed-specific-tenant: ## Seed specific tenant (TENANT=domain)
	@if [ -z "$(TENANT)" ]; then echo "❌ TENANT is required. Usage: make seed-specific-tenant TENANT=fitmax-gym"; exit 1; fi
	DB_HOST=localhost DB_PORT=5432 npm run seed:tenant $(TENANT)

##@ Nexphys.com Development Environment
nexphys-dev-setup: ## Complete nexphys.com development setup with all tenant types
	@echo "🚀 Setting up Nexphys.com multi-tenant development environment..."
	make start
	@sleep 10
	make migrate-public-local
	make seed-public-nexphys
	make seed-tenants-nexphys
	@echo "✅ Nexphys.com development setup complete!"
	@echo ""
	@echo "🏢 Available Nexphys.com Tenants:"
	@echo "  • FitMax Gym (GYM): fitmax-gym.nexphys.com"
	@echo "  • Zen Yoga Studio (STUDIO): zen-yoga.nexphys.com" 
	@echo "  • Elite Personal Training (PERSONAL_TRAINER): elite-pt.nexphys.com"
	@echo "  • TechCorp Wellness (ENTERPRISE): techcorp-wellness.nexphys.com"
	@echo ""
	@echo "👤 Available Roles and Users:"
	@echo "  • Superadmin: superadmin@nexphys.com / superadmin123"
	@echo "  • Tenant Admin: admin@nexphys.com / admin123"
	@echo "  • GYM: owner@fitmax-gym.nexphys.com, coach@fitmax-gym.nexphys.com, member@fitmax-gym.nexphys.com / password123"
	@echo "  • STUDIO: owner@zen-yoga.nexphys.com, instructor@zen-yoga.nexphys.com, student@zen-yoga.nexphys.com / password123"
	@echo "  • PT: coach@elite-pt.nexphys.com, client@elite-pt.nexphys.com / password123"
	@echo "  • ENTERPRISE: wellness@techcorp.nexphys.com, coach@techcorp.nexphys.com, employee@techcorp.nexphys.com / password123"

seed-public-nexphys: ## Seed public schema with nexphys.com data
	@echo "🌱 Seeding public schema with nexphys.com data..."
	npm run migration:run -- -d ./src/shared/database/config/public-connection.ts --name=SeedAdminUsers

seed-tenants-nexphys: ## Seed all tenant schemas with nexphys.com users
	@echo "🌱 Seeding all tenant schemas with nexphys.com users..."
	NODE_ENV=development DB_HOST=localhost DB_PORT=5432 node scripts/seed-tenant-users.js

seed-specific-nexphys-tenant: ## Seed specific nexphys.com tenant (TENANT=domain)
	@if [ -z "$(TENANT)" ]; then echo "❌ TENANT is required. Usage: make seed-specific-nexphys-tenant TENANT=fitmax-gym.nexphys.com"; exit 1; fi
	@echo "🌱 Seeding nexphys.com tenant: $(TENANT)..."
	NODE_ENV=development DB_HOST=localhost DB_PORT=5432 node scripts/seed-tenant-users.js $(TENANT)

##@ Nexphys.com Production Environment
nexphys-prod-init: ## Initialize nexphys.com production database with migrations (NON-DESTRUCTIVE)
	@echo "⚠️ WARNING: This will apply migrations to PRODUCTION database!"
	@read -p "Are you sure you want to continue? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@echo "🔧 Initializing production database with migrations..."
	NODE_ENV=production npm run migration:run -- -d ./src/shared/database/config/public-connection.ts
	@echo "✅ Production migrations complete!"

nexphys-prod-seed-tenant: ## Seed specific tenant in production (TENANT=domain) (USE WITH CAUTION)
	@if [ -z "$(TENANT)" ]; then echo "❌ TENANT is required. Usage: make nexphys-prod-seed-tenant TENANT=custom-domain.nexphys.com"; exit 1; fi
	@echo "⚠️ WARNING: This will seed users for $(TENANT) in PRODUCTION!"
	@read -p "Are you sure you want to continue? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@echo "🌱 Seeding production tenant: $(TENANT)..."
	NODE_ENV=production node scripts/seed-tenant-users.js $(TENANT)

##@ Tenant Demo Setup
demo-setup: ## Complete demo setup with all tenant types
	@echo "🚀 Setting up nexphys multi-tenant demo..."
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

test-nexphys-gym-auth: ## Test nexphys gym authentication
	@echo "🧪 Testing nexphys gym authentication..."
	@curl -s -X POST http://localhost:3000/api/v1/auth/login \
		-H "Content-Type: application/json" \
		-H "X-Tenant-Domain: fitmax-gym.nexphys.com" \
		-d '{"email": "owner@fitmax-gym.nexphys.com", "password": "password123"}' | jq .

test-nexphys-studio-auth: ## Test nexphys studio authentication  
	@echo "🧪 Testing nexphys studio authentication..."
	@curl -s -X POST http://localhost:3000/api/v1/auth/login \
		-H "Content-Type: application/json" \
		-H "X-Tenant-Domain: zen-yoga.nexphys.com" \
		-d '{"email": "instructor@zen-yoga.nexphys.com", "password": "password123"}' | jq .

test-nexphys-pt-auth: ## Test nexphys personal trainer authentication
	@echo "🧪 Testing nexphys personal trainer authentication..."
	@curl -s -X POST http://localhost:3000/api/v1/auth/login \
		-H "Content-Type: application/json" \
		-H "X-Tenant-Domain: elite-pt.nexphys.com" \
		-d '{"email": "coach@elite-pt.nexphys.com", "password": "password123"}' | jq .

test-nexphys-enterprise-auth: ## Test nexphys enterprise authentication
	@echo "🧪 Testing nexphys enterprise authentication..."
	@curl -s -X POST http://localhost:3000/api/v1/auth/login \
		-H "Content-Type: application/json" \
		-H "X-Tenant-Domain: techcorp-wellness.nexphys.com" \
		-d '{"email": "wellness@techcorp.nexphys.com", "password": "password123"}' | jq .

##@ Database Status
db-status: ## Show database and tenant status
	@echo "📊 Database Status:"
	@echo "=================="
	@echo "PostgreSQL:"
	@docker-compose exec postgres pg_isready -U nexphys_user
	@echo ""
	@echo "Public Schema Tables:"
	@docker-compose exec postgres psql -U nexphys_user -d nexphys_db -c "\dt public.*"
	@echo ""
	@echo "Tenant Schemas:"
	@docker-compose exec postgres psql -U nexphys_user -d nexphys_db -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%';"

tenant-schemas: ## List all tenant schemas
	@echo "🏢 Tenant Schemas:"
	@docker-compose exec postgres psql -U nexphys_user -d nexphys_db -c "SELECT t.name, t.domain, t.tenant_type, t.schema_name, t.is_schema_created FROM tenants t ORDER BY t.created_at;"

##@ Development Helpers
reset-all: ## Reset everything (DANGEROUS - deletes all data)
	@echo "⚠️  WARNING: This will delete ALL data!"
	@read -p "Are you sure? (y/N): " confirm && [ "$confirm" = "y" || "$confirm" = "Y" || "$confirm" = "" ] || exit 1
	docker-compose down -v
	docker system prune -f
	make start
	@sleep 10
	make migrate-public-local
	make seed-all

logs-tail: ## Tail all logs
	docker-compose logs -f --tail=50

status: ## Show full system status
	@echo "🚀 nexphys System Status"
	@echo "======================"
	@echo "Docker Services:"
	@docker-compose ps
	@echo ""
	@echo "API Health:"
	@curl -s http://localhost:3000/health | jq .status
	@echo ""
	@echo "Database:"
	@docker-compose exec postgres pg_isready -U nexphys_user
	@echo ""
	@echo "Tenant Count:"
	@curl -s http://localhost:3000/api/v1/tenants | jq '.data | length'