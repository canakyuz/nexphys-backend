# nexphys Backend - Setup Guide

## 📋 Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker** & Docker Compose ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))

## 🚀 Automatic Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd nexphys-backend

# 2. Run setup script (does everything)
chmod +x scripts/setup.sh
./scripts/setup.sh

# 3. Start development
make dev
```

**That's it!** API will be running at `http://localhost:3000/api/v1`

## 🔧 Manual Setup

If you prefer manual control:

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env.development

# Edit with your values
nano .env.development
```

**Required values to change:**
```bash
DB_PASSWORD=your_secure_password_here
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-min-32-characters
```

### 3. Start Database
```bash
# Start PostgreSQL & Redis
docker-compose -f docker-compose.dev.yml up -d

# Wait for database to be ready (15 seconds)
sleep 15
```

### 4. Setup Database Schema
```bash
# Run public schema migrations
npm run migration:run:public

# Seed initial data
npm run seed:public
```

### 5. Start Development Server
```bash
npm run dev
```

## 🧪 Verify Installation

### 1. Health Check
```bash
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "success": true,
  "message": "nexphys API is running",
  "environment": "development"
}
```

### 2. Create Test Tenant
```bash
# Using Make command
make tenant-create DOMAIN=test-gym

# Or using script directly
./scripts/tenant-create.sh test-gym "Test Gym"
```

### 3. Run API Tests
```bash
# Full API test suite
./scripts/test-api.sh
```

## 🐳 Docker Setup

### Development Database Only
```bash
# Start only PostgreSQL & Redis
docker-compose -f docker-compose.dev.yml up -d

# Check services are running
docker-compose -f docker-compose.dev.yml ps
```

### Full Production Stack
```bash
# Start everything (API + Database + Redis)
docker-compose up -d

# Check all services
docker-compose ps
```

## 🗄️ Database Configuration

### Connection Settings
```bash
# Development (default)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexphys_db
DB_USER=nexphys_user
DB_PASSWORD=nexphys_password

# Production
DB_HOST=your-production-host
DB_PASSWORD=your-secure-production-password
```

### Schema Structure
```sql
-- Public schema (global data)
public.tenants          # Tenant registry
public.subscriptions    # Billing information

-- Tenant schemas (per-tenant data)
tenant_gym_abc.users    # Gym ABC users
tenant_gym_abc.roles    # Gym ABC roles
tenant_gym_abc.workouts # Gym ABC workouts
```

## 📁 Project Structure

```
nexphys-backend/
├── src/
│   ├── modules/           # Business modules
│   │   ├── tenants/      # Tenant management
│   │   ├── auth/         # Authentication
│   │   ├── users/        # User management
│   │   └── roles/        # Role management
│   ├── shared/           # Shared resources
│   │   ├── database/     # Database entities & config
│   │   ├── middlewares/  # Express middlewares
│   │   └── utils/        # Utility functions
│   └── config/           # Application configuration
├── scripts/              # Development scripts
├── docker/               # Docker configuration
└── tests/                # Test files
```

## 🔍 Troubleshooting

### Database Connection Failed
```bash
# Check if containers are running
docker-compose -f docker-compose.dev.yml ps

# View database logs
docker-compose -f docker-compose.dev.yml logs postgres

# Restart database
docker-compose -f docker-compose.dev.yml restart postgres
```

### Migration Errors
```bash
# Check migration status
npm run migration:show:public

# Revert last migration
npm run migration:revert:public

# Re-run migrations
npm run migration:run:public
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or use different port
PORT=3001 npm run dev
```

### Permission Denied (Scripts)
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Or run with bash
bash scripts/setup.sh
```

## 🎯 Next Steps

After successful setup:

1. **📖 Read [API Documentation](API.md)** - Learn the API endpoints
2. **🏗️ Understand [Architecture](ARCHITECTURE.md)** - System design
3. **🔐 Configure [Security](SECURITY.md)** - Production security
4. **🚀 Setup [Deployment](DEPLOYMENT.md)** - Production deployment

## 🆘 Getting Help

- **Common Issues**: Check [Troubleshooting Guide](TROUBLESHOOTING.md)
- **API Questions**: See [API Reference](API.md)
- **Bug Reports**: Create GitHub issue
- **Feature Requests**: Create GitHub issue

---

**✅ Setup complete! Ready to build amazing fitness applications!**