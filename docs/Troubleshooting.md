# NexFit Backend - Troubleshooting Guide

## 🚨 Common Issues & Quick Fixes

### Database Connection Issues

#### ❌ "Connection refused" Error
```bash
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Quick Fix:**
```bash
# Check if PostgreSQL is running
docker-compose ps

# If not running, start it
docker-compose -f docker-compose.dev.yml up -d postgres

# Wait and test connection
sleep 10
docker-compose exec postgres pg_isready -U nexfit_user
```

#### ❌ "Database does not exist"
```bash
Error: database "nexfit_db" does not exist
```

**Quick Fix:**
```bash
# Create database manually
docker-compose exec postgres createdb -U nexfit_user nexfit_db

# Or recreate containers
docker-compose down -v
docker-compose -f docker-compose.dev.yml up -d
```

### Migration Problems

#### ❌ Migration Already Exists
```bash
Error: relation "tenants" already exists
```

**Quick Fix:**
```bash
# Check migration status
npm run migration:show:public

# Revert problematic migration
npm run migration:revert:public

# Fix migration file and re-run
npm run migration:run:public
```

#### ❌ Tenant Schema Migration Fails
```bash
Error: schema "tenant_xyz_abc123" does not exist
```

**Quick Fix:**
```bash
# Check if tenant schema was created
psql -h localhost -U nexfit_user -d nexfit_db \
  -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%';"

# Manually create schema if missing
psql -h localhost -U nexfit_user -d nexfit_db \
  -c "CREATE SCHEMA \"tenant_xyz_abc123\";"

# Re-run tenant migrations
npm run migration:run:tenant
```

### Authentication Issues

#### ❌ "Invalid or expired token"
```bash
Error: JsonWebTokenError: invalid signature
```

**Quick Fix:**
```bash
# Check JWT secret length
echo "JWT_SECRET length: ${#JWT_SECRET}"
# Should be 32+ characters

# Generate new secret if needed
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update .env.development file
JWT_SECRET=your-new-secret-here
```

#### ❌ "Tenant not found"
```bash
Error: Tenant not found: my-gym
```

**Quick Fix:**
```bash
# Check if tenant exists
curl -X GET http://localhost:3000/api/v1/tenants | jq '.data[] | .domain'

# Create tenant if missing
./scripts/tenant-create.sh my-gym "My Gym"

# Or via API
curl -X POST http://localhost:3000/api/v1/tenants \
  -H "Content-Type: application/json" \
  -d '{"name": "My Gym", "domain": "my-gym", "tenantType": "GYM", "contact": {"email": "admin@my-gym.com"}}'
```

### CORS & Network Issues

#### ❌ CORS Policy Error
```bash
Access to fetch blocked by CORS policy
```

**Quick Fix:**
```bash
# Update CORS origins in .env.development
CORS_ORIGIN=http://localhost:3000,http://localhost:19006,http://localhost:8081

# For development, temporarily allow all
CORS_ORIGIN=*

# Restart server
npm run dev
```

#### ❌ Port Already in Use
```bash
Error: listen EADDRINUSE :::3000
```

**Quick Fix:**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or use different port
PORT=3001 npm run dev
```

## 🔍 Diagnostic Commands

### Health Check
```bash
# Basic health check
curl http://localhost:3000/health

# Detailed health with JSON formatting
curl -s http://localhost:3000/health | jq .
```

### Database Diagnostics
```bash
# Connect to database
docker-compose exec postgres psql -U nexfit_user -d nexfit_db

# Check database size
\l+

# List all schemas
\dn+

# Check tenant schemas
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name LIKE 'tenant_%';

# Check table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname LIKE 'tenant_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Application Logs
```bash
# View real-time logs
docker-compose logs -f api

# Search for errors
docker-compose logs api | grep ERROR

# View last 100 lines
docker-compose logs --tail=100 api

# Filter by timestamp
docker-compose logs --since="1h" api
```

### Connection Diagnostics
```bash
# Check active database connections
docker-compose exec postgres psql -U nexfit_user -d nexfit_db \
  -c "SELECT datname, usename, client_addr, state FROM pg_stat_activity WHERE datname = 'nexfit_db';"

# Check for long-running queries
docker-compose exec postgres psql -U nexfit_user -d nexfit_db \
  -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active';"
```

## 🛠️ Advanced Troubleshooting

### Memory Issues

#### ❌ "JavaScript heap out of memory"
```bash
<--- Last few GCs --->
FATAL ERROR: Ineffective mark-compacts near heap limit
```

**Solutions:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev

# Or add to package.json
"dev": "NODE_OPTIONS='--max-old-space-size=4096' nodemon src/server.ts"

# Monitor memory usage
node --inspect src/server.ts
# Open chrome://inspect
```

### Performance Issues

#### ❌ Slow Database Queries
```bash
# Enable query logging in development
# Add to .env.development
DB_LOGGING=true

# Analyze slow queries
docker-compose exec postgres psql -U nexfit_user -d nexfit_db \
  -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

#### ❌ High CPU Usage
```bash
# Check Node.js process
top -p $(pgrep -f "node.*server.ts")

# Profile with clinic.js
npm install -g clinic
clinic doctor -- node src/server.ts

# Use Node.js built-in profiler
node --prof src/server.ts
node --prof-process isolate-*.log > profile.txt
```

### Docker Issues

#### ❌ Container Won't Start
```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs postgres
docker-compose logs api

# Inspect container
docker inspect nexfit-postgres

# Remove and recreate containers
docker-compose down -v
docker-compose -f docker-compose.dev.yml up -d
```

#### ❌ Volume Permission Issues
```bash
# Fix volume permissions
sudo chown -R $USER:$USER ./logs ./uploads

# Or use docker-compose override
# docker-compose.override.yml
version: '3.8'
services:
  api:
    user: "${UID}:${GID}"
```

## 🐛 Debugging Techniques

### Enable Debug Mode
```bash
# Development with debug
DEBUG=* npm run dev

# Specific module debugging
DEBUG=nexfit:* npm run dev

# TypeORM query debugging
# In .env.development
DB_LOGGING=true
```

### Request Debugging
```typescript
// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, {
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params
  });
  next();
});
```

### Database Query Debugging
```typescript
// Log all TypeORM queries
const dataSource = new DataSource({
  // ... other config
  logging: ['query', 'error'],
  logger: 'advanced-console',
});
```

## 📊 Performance Monitoring

### Application Metrics
```bash
# Memory usage
node -e "console.log(process.memoryUsage())"

# Event loop lag
node -e "
  const start = process.hrtime();
  setImmediate(() => {
    const delta = process.hrtime(start);
    console.log('Event loop lag:', delta[0] * 1000 + delta[1] * 1e-6, 'ms');
  });
"
```

### Database Performance
```sql
-- Check for missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname LIKE 'tenant_%' AND n_distinct > 100;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname LIKE 'tenant_%'
ORDER BY idx_scan DESC;
```

## 🚨 Error Recovery Procedures

### Database Recovery
```bash
# Backup before recovery
pg_dump -h localhost -U nexfit_user nexfit_db > backup_$(date +%Y%m%d).sql

# Reset public schema
psql -h localhost -U nexfit_user -d nexfit_db \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Restore from backup
psql -h localhost -U nexfit_user -d nexfit_db < backup_20240101.sql

# Re-run migrations
npm run migration:run:public
npm run seed:public
```

### Application Recovery
```bash
# Reset to clean state
docker-compose down -v
rm -rf node_modules package-lock.json
npm install
docker-compose -f docker-compose.dev.yml up -d
sleep 15
npm run migration:run:public
npm run seed:public
npm run dev
```

### Emergency Procedures
```bash
# Quick emergency restart
pkill -f "node.*server"
docker-compose restart postgres
npm run dev

# Reset everything (DESTRUCTIVE)
docker-compose down -v
docker system prune -f
git clean -fdx
git reset --hard HEAD
npm install
./scripts/setup.sh
```

## 📞 Getting Help

### Log Collection for Support
```bash
# Collect comprehensive logs
mkdir -p debug-logs/$(date +%Y%m%d_%H%M%S)
cd debug-logs/$(date +%Y%m%d_%H%M%S)

# Application logs
docker-compose logs api > app.log 2>&1
docker-compose logs postgres > postgres.log 2>&1

# System info
node --version > system-info.txt
npm --version >> system-info.txt
docker --version >> system-info.txt
docker-compose --version >> system-info.txt

# Environment (sanitized)
env | grep -E "(NODE|DB|JWT|PORT)" | sed 's/=.*/=***/' > env.txt

# Package info
cp ../../package.json .
cp ../../docker-compose*.yml .

echo "Debug logs collected in: $(pwd)"
```

### Common Support Questions
1. **What version are you running?** Check `package.json` version
2. **What's your environment?** Check `NODE_ENV` value
3. **Any recent changes?** Check git log: `git log --oneline -10`
4. **Error reproducible?** Try with fresh database/containers
5. **Network issues?** Test health endpoint: `curl http://localhost:3000/health`

---

**🆘 Still having issues? Create a GitHub issue with:**
- Error message (full stack trace)
- Steps to reproduce
- Environment details (OS, Node version, Docker version)
- Recent changes made to the codebase