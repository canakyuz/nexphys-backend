# Makefile'a ek komutlar

##@ Docker Komutları
start: ## Docker container'ları başlat
	docker-compose up -d
	docker-compose ps


setup-all: ## Docker ortamında tam kurulum (migration ve seed işlemleri dahil)
	@echo "🚀 Docker ortamında nexphys kurulumu başlatılıyor..."
	docker-compose up -d
	@echo "⏳ PostgreSQL'in hazır olması bekleniyor..."
	@sleep 10
	@echo "🔄 Public şema migrasyonları çalıştırılıyor..."
	docker-compose exec api npm run migration:run:public
	@echo "🌱 Admin kullanıcıları ve tenantlar ekleniyor..."
	docker-compose exec api npm run migration:run -- -d ./src/shared/database/config/public-connection.ts --name=SeedAdminUsers
	@echo "🔄 Tenant şemaları oluşturuluyor..."
	docker-compose exec api npm run migration:run:tenant
	@echo "🌱 Tenant kullanıcıları ekleniyor..."
	docker-compose exec api node scripts/seed-tenant-users.js
	@echo "✅ Docker kurulumu tamamlandı!"


docker-migrate-public: ## Docker içinde public şema migrasyonlarını çalıştır
	docker-compose exec api npm run migration:run:public

docker-seed-admin: ## Docker içinde admin kullanıcıları ve tenant'ları ekle
	docker-compose exec api npm run migration:run -- -d ./src/shared/database/config/public-connection.ts --name=SeedAdminUsers

docker-migrate-tenant: ## Docker içinde tenant şemalarını oluştur
	docker-compose exec api npm run migration:run:tenant

docker-seed-tenant-users: ## Docker içinde tenant kullanıcılarını ekle
	docker-compose exec api node scripts/seed-tenant-users.js

docker-seed-specific-tenant: ## Docker içinde belirli bir tenant için kullanıcı ekle (TENANT=domain)
	@if [ -z "$(TENANT)" ]; then echo "❌ TENANT is required. Usage: make docker-seed-specific-tenant TENANT=fitmax-gym"; exit 1; fi
	docker-compose exec api node scripts/seed-tenant-users.js $(TENANT)

docker-db-status: ## Docker içinde veritabanı durumunu kontrol et
	@echo "📊 Docker PostgreSQL Durumu:"
	@echo "=========================="
	docker-compose exec postgres pg_isready -U nexphys_user
	@echo ""
	@echo "Public Şema Tabloları:"
	docker-compose exec postgres psql -U nexphys_user -d nexphys_db -c "\dt public.*"
	@echo ""
	@echo "Tenant Şemaları:"
	docker-compose exec postgres psql -U nexphys_user -d nexphys_db -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%';"

docker-tenant-schemas: ## Docker içinde tüm tenant şemalarını listele
	@echo "🏢 Tenant Şemaları:"
	docker-compose exec postgres psql -U nexphys_user -d nexphys_db -c "SELECT t.name, t.domain, t.tenant_type, t.schema_name, t.is_schema_created FROM public.tenants t ORDER BY t.created_at;"

docker-test-api: ## Docker içinde API sağlık kontrolü
	docker-compose exec api curl -s http://localhost:4000/health | jq .

docker-test-tenants: ## Docker içinde tenant endpoint'lerini test et
	docker-compose exec api curl -s http://localhost:4000/api/v1/tenants | jq .

docker-test-auth: ## Docker içinde kimlik doğrulamayı test et (TENANT ve ROLE gerekli)
	@if [ -z "$(TENANT)" ] || [ -z "$(ROLE)" ]; then echo "❌ TENANT ve ROLE gerekli. Kullanım: make docker-test-auth TENANT=fitmax-gym ROLE=owner"; exit 1; fi
	docker-compose exec api curl -s -X POST http://localhost:4000/api/v1/auth/login \
		-H "Content-Type: application/json" \
		-H "X-Tenant-Domain: $(TENANT)" \
		-d '{"email": "$(ROLE)@$(TENANT)", "password": "password123"}' | jq .

docker-reset-all: ## Docker ortamını tamamen sıfırla (TÜM VERİLER SİLİNİR!)
	@echo "⚠️  UYARI: Bu işlem TÜM verileri silecek!"
	@read -p "Emin misiniz? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	docker-compose down -v
	docker system prune -f
	make docker-start
	@sleep 10
	make docker-setup-all


##@ Advanced Seeding
seed-all: ## Seed all schemas (public + all tenants)
	make seed-public-local && make seed-tenants-local

seed-tenants-local: ## Seed all tenant schemas locally
	DB_HOST=localhost DB_PORT=5432 npm run seed:tenant

seed-specific-tenant: ## Seed specific tenant (TENANT=domain)
	@if [ -z "$(TENANT)" ]; then echo "❌ TENANT is required. Usage: make seed-specific-tenant TENANT=fitmax-gym"; exit 1; fi
	DB_HOST=localhost DB_PORT=5432 npm run seed:tenant $(TENANT)

##@ Nexphys.com Development Environment
migrate-public-local: ## Run public schema migrations locally
	@echo "🔄 Running public schema migrations locally..."
	docker-compose exec api npm run migration:run:public

migrate-tenant-local: ## Run tenant schema migrations locally
	@echo "🔄 Running tenant schema migrations locally..."
	docker-compose exec api npm run migration:run:tenant

nexphys-dev-setup: ## Complete nexphys.com development setup with all tenant types
	@echo "🚀 Setting up Nexphys.com multi-tenant development environment with correct tenant-per-schema architecture..."
	make start
	@sleep 10
	@echo "🔧 Creating all tenant schemas, tables, and populating with users for each role type..."
	docker-compose exec api npm run setup:nexphys-env
	@echo "✅ Nexphys.com development setup complete!"
	@echo ""
	@echo "🏢 Available Nexphys.com Tenants:"
	@echo "  • FitMax Gym (GYM): fitmax-gym.nexphys.com"
	@echo "  • Zen Yoga Studio (STUDIO): zen-yoga.nexphys.com" 
	@echo "  • Elite Personal Training (PERSONAL_TRAINER): elite-pt.nexphys.com"
	@echo "  • TechCorp Wellness (ENTERPRISE): techcorp-wellness.nexphys.com"
	@echo ""
	@echo "👤 Available Roles and Users by Tenant Type:"
	@echo "  • Superadmin: superadmin@nexphys.com / superadmin123"
	@echo "  • Tenant Admin: admin@nexphys.com / admin123"
	@echo "  • GYM: owner@fitmax-gym / password123, manager@fitmax-gym / password123, coach@fitmax-gym / password123, member@fitmax-gym / password123"
	@echo "  • STUDIO: owner@zen-yoga / password123, manager@zen-yoga / password123, instructor@zen-yoga / password123, student@zen-yoga / password123"
	@echo "  • PT: coach@elite-pt / password123, client@elite-pt / password123"
	@echo "  • ENTERPRISE: wellness@techcorp-wellness / password123, coach@techcorp-wellness / password123, employee@techcorp-wellness / password123"

seed-public-nexphys: ## Seed public schema with nexphys.com data
	@echo "🌱 Seeding public schema with nexphys.com data..."
	docker-compose exec api npx ts-node -r tsconfig-paths/register src/scripts/seed-tenants-manually.ts

seed-tenants-nexphys: ## Seed all tenant schemas with nexphys.com users
	@echo "🌱 Seeding all tenant schemas with nexphys.com users..."
	@echo "🔄 Seeding role types for each tenant schema..."
	docker-compose exec api npx ts-node -r tsconfig-paths/register src/scripts/seed-role-types.ts
	@echo "🔄 Seeding test users for each tenant schema..."
	docker-compose exec api npx ts-node -r tsconfig-paths/register src/scripts/seed-test-users.ts

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

##@ Database Management
create-migration: ## Create a new migration file (NAME=MigrationName, TYPE=public|tenant)
	@if [ -z "$(NAME)" ]; then echo "❌ NAME is required. Usage: make create-migration NAME=CreateUserTable TYPE=public"; exit 1; fi
	@if [ -z "$(TYPE)" ]; then echo "❌ TYPE is required (public or tenant). Usage: make create-migration NAME=CreateUserTable TYPE=public"; exit 1; fi
	@if [ "$(TYPE)" != "public" ] && [ "$(TYPE)" != "tenant" ]; then echo "❌ TYPE must be 'public' or 'tenant'"; exit 1; fi
	@echo "📝 Creating $(TYPE) migration: $(NAME)..."
	docker-compose exec api npm run typeorm migration:create -- ./src/shared/database/migrations/$(TYPE)/$(NAME)
	@echo "✅ Migration created at src/shared/database/migrations/$(TYPE)/$(NAME)"

show-tenant-schemas: ## Show all tenant schemas in the database
	@echo "📊 Tenant schemas in database:"
	docker-compose exec postgres psql -U nexphys_user -d nexphys_db -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%';"

show-tenant-users: ## Show users for a specific tenant (TENANT=schema_name)
	@if [ -z "$(TENANT)" ]; then echo "❌ TENANT is required. Usage: make show-tenant-users TENANT=tenant_fitmax_gym"; exit 1; fi
	@echo "📊 Users in tenant $(TENANT):"
	docker-compose exec postgres psql -U nexphys_user -d nexphys_db -c "SELECT id, email, first_name, last_name, role, status FROM $(TENANT).users;"

reset-tenant: ## Reset a specific tenant schema (TENANT=schema_name)
	@if [ -z "$(TENANT)" ]; then echo "❌ TENANT is required. Usage: make reset-tenant TENANT=tenant_fitmax_gym"; exit 1; fi
	@echo "⚠️ WARNING: This will DROP the $(TENANT) schema and all its data!"
	@read -p "Are you sure you want to continue? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@echo "🗑️ Dropping schema $(TENANT)..."
	docker-compose exec postgres psql -U nexphys_user -d nexphys_db -c "DROP SCHEMA IF EXISTS $(TENANT) CASCADE;"
	@echo "🔄 Creating schema $(TENANT)..."
	docker-compose exec postgres psql -U nexphys_user -d nexphys_db -c "CREATE SCHEMA $(TENANT);"
	@echo "✅ Tenant schema reset complete!"
	@echo "🏢 Available Tenants:"
	@echo "  • FitMax Gym (GYM): fitmax-gym"
	@echo "  • Zen Yoga Studio (STUDIO): zen-yoga" 
	@echo "  • Elite Personal Training (PERSONAL_TRAINER): elite-pt"
	@echo "  • TechCorp Wellness (ENTERPRISE): techcorp-wellness"
	@echo "  • Test Tenant (TEST): test-tenant"
	@echo ""
	@echo "🌐 Test endpoints:"
	@echo "  curl http://localhost:4000/api/v1/tenants"
	@echo "  curl -H 'X-Tenant-Domain: fitmax-gym' http://localhost:4000/api/v1/auth/login"

##@ Quick Tests
test-tenants: ## Test all tenant endpoints
	@echo "🧪 Testing tenant endpoints..."
	@curl -s http://localhost:4000/api/v1/tenants | jq .
	@echo "\n"

test-nexphys-gym-auth: ## Test nexphys gym authentication
	@echo "🧪 Testing nexphys gym authentication..."
	@curl -s -X POST http://localhost:4000/api/v1/auth/login \
		-H "Content-Type: application/json" \
		-H "X-Tenant-Domain: fitmax-gym.nexphys.com" \
		-d '{"email": "owner@fitmax-gym.nexphys.com", "password": "password123"}' | jq .

test-nexphys-studio-auth: ## Test nexphys studio authentication  
	@echo "🧪 Testing nexphys studio authentication..."
	@curl -s -X POST http://localhost:4000/api/v1/auth/login \
		-H "Content-Type: application/json" \
		-H "X-Tenant-Domain: zen-yoga.nexphys.com" \
		-d '{"email": "instructor@zen-yoga.nexphys.com", "password": "password123"}' | jq .

test-nexphys-pt-auth: ## Test nexphys personal trainer authentication
	@echo "🧪 Testing nexphys personal trainer authentication..."
	@curl -s -X POST http://localhost:4000/api/v1/auth/login \
		-H "Content-Type: application/json" \
		-H "X-Tenant-Domain: elite-pt.nexphys.com" \
		-d '{"email": "coach@elite-pt.nexphys.com", "password": "password123"}' | jq .

test-nexphys-enterprise-auth: ## Test nexphys enterprise authentication
	@echo "🧪 Testing nexphys enterprise authentication..."
	@curl -s -X POST http://localhost:4000/api/v1/auth/login \
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
	@curl -s http://localhost:4000/health | jq .status
	@echo ""
	@echo "Database:"
	@docker-compose exec postgres pg_isready -U nexphys_user
	@echo ""
	@echo "Tenant Count:"
	@curl -s http://localhost:4000/api/v1/tenants | jq '.data | length'

down:
	docker-compose down -v

reset:
	docker-compose down -v
	docker-compose up -d

install-bcrypt:
	docker-compose exec api npm install bcrypt @types/bcrypt