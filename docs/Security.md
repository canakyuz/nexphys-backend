# nexphys Backend - Security Guide

## 🔐 Authentication System

### JWT Token Strategy

**Dual-Token System** for enhanced security:

```typescript
// Access Token (Short-lived)
{
  "userId": "uuid",
  "email": "user@example.com",
  "roleId": "uuid", 
  "roleTypeCode": "CLIENT",
  "tenantId": "uuid",
  "tenantDomain": "my-gym",
  "exp": 1640995200  // 24 hours
}

// Refresh Token (Long-lived)
{
  "userId": "uuid",
  "tokenId": "uuid",
  "exp": 1641168000  // 7 days
}
```

### Token Security Best Practices

```typescript
// ✅ Secure token generation
const JWT_SECRET = crypto.randomBytes(64).toString('hex'); // Min 32 chars
const JWT_REFRESH_SECRET = crypto.randomBytes(64).toString('hex');

// ✅ Token storage (Client-side)
// Access Token: Memory only (never localStorage)
// Refresh Token: Secure HTTP-only cookie

// ✅ Token rotation
app.post('/auth/refresh', async (req, res) => {
  // Invalidate old refresh token
  // Generate new access + refresh tokens
  // Return new tokens
});
```

## 🏢 Multi-Tenant Security

### Tenant Isolation

**Schema-Level Isolation** prevents data leakage:

```sql
-- ✅ Complete isolation
tenant_gym_abc.users     -- Gym ABC users
tenant_studio_xyz.users  -- Studio XYZ users

-- ❌ Row-level isolation (not used)
users WHERE tenant_id = 'gym_abc'  -- Risky!
```

### Tenant Context Validation

```typescript
// ✅ Always verify tenant access
export const tenantMiddleware = async (req, res, next) => {
  const tenantDomain = req.headers['x-tenant-domain'];
  const userTenantId = req.user.tenantId;
  
  // Verify user belongs to requested tenant
  if (tenant.id !== userTenantId) {
    throw new AppError('Unauthorized tenant access', 403);
  }
  
  next();
};
```

## 🛡️ Authorization System

### Role-Based Access Control (RBAC)

```typescript
// Permission Structure
interface Permission {
  resource: string;    // 'users', 'workouts', 'analytics'  
  action: string;      // 'create', 'read', 'update', 'delete'
  conditions?: {       // Optional constraints
    own: boolean;      // Can only access own resources
    status?: string;   // Only access active resources
  };
}

// ✅ Permission checking
const requirePermission = (resource: string, action: string) => {
  return (req, res, next) => {
    if (!req.user.hasPermission(resource, action)) {
      throw new AppError(`Missing permission: ${action} ${resource}`, 403);
    }
    next();
  };
};
```

### Role Hierarchy

```
OWNER (Level 4)
├── Full tenant control
├── User & role management  
├── Billing & subscriptions
└── All permissions

MANAGER (Level 3)
├── Staff management
├── Business operations
├── Analytics & reports
└── Most permissions

PREMIUM (Level 2) 
├── Advanced features
├── Limited management
└── Extended permissions

BASIC (Level 1)
├── Core features only
├── Personal data access
└── Basic permissions
```

## 🔒 Input Validation & Sanitization

### Validation Pipeline

```typescript
// ✅ Multi-layer validation
export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-zA-Z\s]+$/) // Only letters and spaces
  firstName: string;

  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
  password: string;
}

// ✅ SQL injection prevention (TypeORM handles this)
const user = await userRepository.findOne({
  where: { email: userInput.email } // Safe with TypeORM
});

// ❌ Never do this
const query = `SELECT * FROM users WHERE email = '${userInput}'`; // Dangerous!
```

### XSS Prevention

```typescript
// ✅ Output encoding
import { escape } from 'html-escaper';

const safeOutput = escape(userInput);

// ✅ Content Security Policy
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  }
}));
```

## 🚫 Rate Limiting

### Multi-Level Rate Limiting

```typescript
// ✅ Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP',
});

// ✅ Tenant-specific limiting  
const tenantLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Higher limit per tenant
  keyGenerator: (req) => `${req.tenant.id}:${req.ip}`,
});

// ✅ Endpoint-specific limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts
  skipSuccessfulRequests: true,
});
```

## 🔐 Password Security

### Password Requirements

```typescript
// ✅ Strong password policy
export const passwordValidation = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true, 
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfo: true, // No name, email in password
};

// ✅ Secure hashing
import * as bcrypt from 'bcryptjs';

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12; // Adjust based on performance needs
  return await bcrypt.hash(password, saltRounds);
};
```

### Password Reset Security

```typescript
// ✅ Secure password reset flow
export class PasswordResetService {
  async requestReset(email: string) {
    const user = await this.findUser(email);
    
    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256')
      .update(resetToken).digest('hex');
    
    // Store hashed token with expiration
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    
    await this.saveUser(user);
    
    // Send unhashed token via email
    await this.sendResetEmail(email, resetToken);
  }
}
```

## 🔒 Database Security

### Connection Security

```typescript
// ✅ Secure database connection
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false, // For managed databases
  } : false,
  extra: {
    max: 20,
    connectionTimeoutMillis: 40000,
    idleTimeoutMillis: 40000,
  }
});
```

### Sensitive Data Encryption

```typescript
// ✅ Encrypt sensitive fields
import { createCipher, createDecipher } from 'crypto';

@Entity()
export class User {
  @Column()
  email: string;

  @Column({ transformer: {
    to: (value: string) => encrypt(value),
    from: (value: string) => decrypt(value)
  }})
  socialSecurityNumber?: string; // Encrypted in database
}
```

## 🌐 API Security

### CORS Configuration

```typescript
// ✅ Restrictive CORS policy
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://app.nexphys.com',
      'https://admin.nexphys.com'
    ];
    
    // Allow requests with no origin (mobile apps)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Domain'],
};
```

### Security Headers

```typescript
// ✅ Comprehensive security headers
app.use(helmet({
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  
  // Prevent MIME type sniffing
  noSniff: true,
  
  // Force HTTPS
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

## 🕵️ Audit Logging

### Security Event Logging

```typescript
// ✅ Comprehensive audit trail
export class AuditLogger {
  async logSecurityEvent(event: SecurityEvent) {
    await this.auditRepository.save({
      eventType: event.type,
      userId: event.userId,
      tenantId: event.tenantId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      resource: event.resource,
      action: event.action,
      success: event.success,
      details: event.details,
      timestamp: new Date(),
    });
  }
}

// Security events to log:
// - Login attempts (success/failure)
// - Permission denials
// - Password changes
// - Role modifications
// - Tenant access attempts
// - API rate limit violations
```

## 🔍 Security Monitoring

### Threat Detection

```typescript
// ✅ Suspicious activity detection
export class ThreatDetector {
  async detectSuspiciousLogin(userId: string, loginData: LoginAttempt) {
    const recentLogins = await this.getRecentLogins(userId, '1 hour');
    
    // Check for unusual patterns
    const suspiciousIndicators = [
      this.checkUnusualLocation(loginData.ipAddress, recentLogins),
      this.checkRapidAttempts(recentLogins),
      this.checkUnusualDevice(loginData.userAgent, recentLogins),
    ];
    
    if (suspiciousIndicators.some(Boolean)) {
      await this.triggerSecurityAlert(userId, loginData);
    }
  }
}
```

## 📋 Production Security Checklist

### Environment Security
- [ ] Strong JWT secrets (min 32 characters)
- [ ] Secure database passwords
- [ ] Environment variables (never hardcoded secrets)
- [ ] HTTPS only in production
- [ ] Secure cookie settings

### Application Security
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (using TypeORM)
- [ ] XSS protection (CSP headers)
- [ ] CSRF protection (for web clients)
- [ ] Rate limiting configured

### Authentication Security
- [ ] Strong password requirements
- [ ] Secure password hashing (bcrypt)
- [ ] Token expiration policies
- [ ] Refresh token rotation
- [ ] Account lockout policies

### Authorization Security
- [ ] RBAC properly implemented
- [ ] Tenant isolation verified
- [ ] Permission checks on all protected endpoints
- [ ] Principle of least privilege

### Infrastructure Security
- [ ] Database SSL/TLS enabled
- [ ] API behind load balancer
- [ ] Security headers configured
- [ ] CORS properly restricted
- [ ] Audit logging enabled

### Monitoring Security
- [ ] Failed authentication alerts
- [ ] Unusual access pattern detection
- [ ] Performance monitoring
- [ ] Error tracking (without sensitive data)
- [ ] Regular security audits

## 🚨 Incident Response

### Security Breach Protocol

1. **Immediate Actions**
    - Identify affected tenants
    - Rotate compromised credentials
    - Block suspicious IP addresses
    - Notify security team

2. **Investigation**
    - Analyze audit logs
    - Determine breach scope
    - Document timeline
    - Preserve evidence

3. **Recovery**
    - Patch vulnerabilities
    - Update security measures
    - Restore services
    - Monitor for recurring issues

4. **Communication**
    - Notify affected users
    - Report to authorities (if required)
    - Update security documentation
    - Conduct post-mortem

---

**🔒 Security is everyone's responsibility. Follow these guidelines to keep nexphys and user data secure.**