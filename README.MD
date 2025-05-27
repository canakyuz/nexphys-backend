# nexphys Multi-Tenant Backend

Modern fitness platform backend with **tenant-per-schema** multi-tenancy architecture.

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repo-url>
cd nexphys-backend

# Run complete setup
chmod +x scripts/setup.sh
./scripts/setup.sh

# Start development
make dev
```

**API Available at**: `http://localhost:3000/api/v1`

## 🏗️ Architecture

### Multi-Tenancy: Tenant-Per-Schema
- **Public Schema**: Tenant management, subscriptions
- **Tenant Schemas**: Isolated data per tenant
- **Dynamic Routing**: Automatic tenant resolution

```
Database Structure:
├── public.tenants          # Global tenant registry
├── public.subscriptions    # Billing & plans
├── tenant_gym_abc.*        # Gym ABC's isolated data
└── tenant_studio_xyz.*     # Studio XYZ's isolated data
```

### Tech Stack
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL + TypeORM
- **Auth**: JWT (Access + Refresh tokens)
- **Security**: RBAC + Multi-tenant isolation
- **Container**: Docker + Docker Compose

## 📋 Available Commands

```bash
# Development
make setup              # Initial project setup
make dev                # Start development server
make build              # Build for production

# Database
make migrate-public-run     # Run public schema migrations
make migrate-tenant-run     # Run tenant schema migrations
make seed-public           # Seed initial data

# Tenant Management
make tenant-create DOMAIN=my-gym    # Create new tenant

# Testing
make test              # Run tests
make test-api          # Test API endpoints

# Docker
make start             # Start production
make stop              # Stop all services
```

## 🏢 Tenant Types

| Type | Description | Features |
|------|-------------|----------|
| **GYM** | Traditional fitness centers | Equipment, classes, memberships |
| **STUDIO** | Specialized studios | Yoga, pilates, dance classes |
| **PERSONAL_TRAINER** | Independent trainers | 1-on-1 training, programs |
| **ENTERPRISE** | Corporate wellness | Employee programs, analytics |

## 🔐 Authentication

### Tenant Context
Every request needs tenant identification:
```bash
# Method 1: Header (Recommended)
X-Tenant-Domain: my-gym

# Method 2: Subdomain
my-gym.nexphys.com

# Method 3: Query parameter
?tenant=my-gym
```

### User Authentication
```bash
# Register user in tenant
POST /api/v1/auth/register
X-Tenant-Domain: my-gym

# Login to tenant
POST /api/v1/auth/login
X-Tenant-Domain: my-gym

# Access protected resources
Authorization: Bearer <token>
X-Tenant-Domain: my-gym
```

## 🎯 Role-Based Access Control

### Role Types (Per Tenant)
- `CLIENT` - End users/members
- `COACH` - Fitness trainers
- `GYM_OWNER` - Gym owners
- `STUDIO_OWNER` - Studio owners
- `GYM_MEMBER` - Gym members
- `STUDIO_MEMBER` - Studio members

### Permission System
```typescript
// Format: resource:action
permissions: [
    "users:read",      // View users
    "workouts:create", // Create workouts
    "analytics:manage" // Full analytics access
]
```

## 📡 Core API Endpoints

### Tenant Management
```bash
POST   /api/v1/tenants              # Create tenant
GET    /api/v1/tenants              # List tenants (admin)
GET    /api/v1/tenants/:id/stats    # Tenant statistics
```

### Authentication (Tenant-Scoped)
```bash
POST   /api/v1/auth/register        # Register user
POST   /api/v1/auth/login           # Login user
GET    /api/v1/auth/profile         # Get profile
POST   /api/v1/auth/refresh         # Refresh token
```

### User Management (Tenant-Scoped)
```bash
GET    /api/v1/users                # List users
POST   /api/v1/users                # Create user
PUT    /api/v1/users/:id            # Update user
PUT    /api/v1/users/:id/role       # Change user role
```

## 🧪 Testing

### Create Test Tenant
```bash
# Using script
./scripts/tenant-create.sh test-gym "Test Gym" GYM admin@test-gym.com

# Or using API
curl -X POST http://localhost:3000/api/v1/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Gym",
    "domain": "test-gym",
    "tenantType": "GYM",
    "contact": {"email": "admin@test-gym.com"}
  }'
```

### Test Full API Flow
```bash
# Run comprehensive tests
./scripts/test-api.sh

# This will:
# 1. Create tenant
# 2. Register user
# 3. Login user
# 4. Test protected endpoints
```

## 🐳 Docker Setup

### Development
```bash
# Start database only
docker-compose -f docker-compose.dev.yml up -d

# Or use Make command
make docker-dev
```

### Production
```bash
# Start full stack
docker-compose up -d

# Or use Make command
make start
```

## 🔧 Environment Configuration

### Required Variables
```bash
# Database
DB_HOST=localhost
DB_PASSWORD=secure_password

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars

# Tenant Settings
TENANT_TRIAL_DAYS=30
```

### Optional Variables
```bash
# Server
PORT=3000
API_PREFIX=/api/v1

# Features
MAX_FILE_SIZE=5242880
REDIS_HOST=localhost
```

## 📚 Documentation

- 📖 **[Setup Guide](docs/SETUP.md)** - Detailed installation
- 🏗️ **[Architecture](docs/ARCHITECTURE.md)** - System design
- 📡 **[API Reference](docs/API.md)** - Complete API docs
- 🔐 **[Security](docs/SECURITY.md)** - Auth & permissions
- 🚀 **[Deployment](docs/DEPLOYMENT.md)** - Production setup
- 🐛 **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Follow tenant-aware patterns
4. Add tests for new features
5. Submit pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**🎯 Ready to build the future of fitness technology!**