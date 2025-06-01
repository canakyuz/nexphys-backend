# nexphys Backend - API Reference

## 🌐 Base Information

**Base URL**: `http://localhost:4000/api/v1`  
**Authentication**: Bearer Token + Tenant Context  
**Content-Type**: `application/json`

## 🔐 Authentication Headers

All tenant-scoped endpoints require:
```bash
Authorization: Bearer <access_token>
X-Tenant-Domain: <tenant-domain>
```

## 📋 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field": ["Validation error details"]
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Success",
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 🏢 Tenant Management

### Create Tenant
```http
POST /api/v1/tenants
Content-Type: application/json

{
  "name": "My Fitness Gym",
  "domain": "my-fitness-gym",
  "tenantType": "GYM",
  "contact": {
    "email": "admin@my-fitness-gym.com",
    "phone": "+1234567890"
  },
  "settings": {
    "timezone": "America/New_York",
    "currency": "USD",
    "language": "en"
  }
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Tenant created successfully",
  "data": {
    "id": "uuid-here",
    "name": "My Fitness Gym",
    "domain": "my-fitness-gym",
    "schemaName": "tenant_myf_abc123",
    "tenantType": "GYM",
    "status": "TRIAL",
    "isSchemaCreated": true,
    "trialEndDate": "2024-12-31T23:59:59Z"
  }
}
```

### List Tenants (Admin Only)
```http
GET /api/v1/tenants?page=1&limit=20
Authorization: Bearer <admin_token>
```

### Get Tenant Details
```http
GET /api/v1/tenants/:id
Authorization: Bearer <token>
```

### Update Tenant
```http
PUT /api/v1/tenants/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Gym Name",
  "settings": {
    "timezone": "America/Los_Angeles"
  }
}
```

## 🔐 Authentication (Tenant-Scoped)

### Register User
```http
POST /api/v1/auth/register
X-Tenant-Domain: my-fitness-gym
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "phone": "+1234567890"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "uuid-here",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "status": "ACTIVE",
      "role": {
        "name": "Client",
        "roleType": {
          "code": "CLIENT",
          "level": "BASIC"
        }
      }
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Login User
```http
POST /api/v1/auth/login
X-Tenant-Domain: my-fitness-gym
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Get User Profile
```http
GET /api/v1/auth/profile
Authorization: Bearer <access_token>
X-Tenant-Domain: my-fitness-gym
```

### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
X-Tenant-Domain: my-fitness-gym
```

## 👥 User Management (Tenant-Scoped)

### List Users
```http
GET /api/v1/users?page=1&limit=20&role=CLIENT&status=ACTIVE
Authorization: Bearer <access_token>
X-Tenant-Domain: my-fitness-gym
```

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `role` (string): Filter by role type
- `status` (string): Filter by user status
- `search` (string): Search in name and email

### Get User Details
```http
GET /api/v1/users/:userId
Authorization: Bearer <access_token>
X-Tenant-Domain: my-fitness-gym
```

### Create User (Admin)
```http
POST /api/v1/users
Authorization: Bearer <access_token>
X-Tenant-Domain: my-fitness-gym
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "password": "SecurePass123!",
  "roleId": "role-uuid-here",
  "status": "ACTIVE"
}
```

### Update User
```http
PUT /api/v1/users/:userId
Authorization: Bearer <access_token>
X-Tenant-Domain: my-fitness-gym
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Updated",
  "phone": "+1987654321",
  "profile": {
    "dateOfBirth": "1990-01-01",
    "goals": ["weight_loss", "muscle_gain"],
    "experience": "intermediate"
  }
}
```

### Update User Role
```http
PUT /api/v1/users/:userId/role
Authorization: Bearer <access_token>
X-Tenant-Domain: my-fitness-gym
Content-Type: application/json

{
  "roleId": "new-role-uuid-here"
}
```

### Deactivate User
```http
POST /api/v1/users/:userId/deactivate
Authorization: Bearer <access_token>
X-Tenant-Domain: my-fitness-gym
```

## 🎭 Role Management (Tenant-Scoped)

### List Roles
```http
GET /api/v1/roles
Authorization: Bearer <access_token>
X-Tenant-Domain: my-fitness-gym
```

### Get Role Details
```http
GET /api/v1/roles/:roleId
Authorization: Bearer <access_token>
X-Tenant-Domain: my-fitness-gym
```

### Create Custom Role
```http
POST /api/v1/roles
Authorization: Bearer <access_token>
X-Tenant-Domain: my-fitness-gym
Content-Type: application/json

{
  "name": "Senior Trainer",
  "description": "Experienced trainer with management responsibilities",
  "roleTypeId": "role-type-uuid-here",
  "permissions": [
    "users:read",
    "users:update",
    "workouts:create",
    "workouts:update",
    "analytics:read"
  ]
}
```

### Update Role Permissions
```http
PUT /api/v1/roles/:roleId/permissions
Authorization: Bearer <access_token>
X-Tenant-Domain: my-fitness-gym
Content-Type: application/json

{
  "permissions": [
    "users:read",
    "workouts:manage",
    "analytics:read"
  ]
}
```

### List All Permissions
```http
GET /api/v1/permissions
Authorization: Bearer <access_token>
X-Tenant-Domain: my-fitness-gym
```

## 🚨 HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 204 | No Content | Request successful, no response body |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

## 🔧 Common Patterns

### Tenant Context
Always include tenant context in requests:
```bash
# Preferred method
X-Tenant-Domain: my-fitness-gym

# Alternative methods
Host: my-fitness-gym.nexphys.com
?tenant=my-fitness-gym
```

### Pagination
```bash
GET /api/v1/users?page=2&limit=50
```

### Filtering
```bash
GET /api/v1/users?role=CLIENT&status=ACTIVE&search=john
```

### Sorting
```bash
GET /api/v1/users?sort=createdAt&order=desc
```

## 📝 Rate Limiting

- **Default**: 100 requests per 15 minutes per IP
- **Headers included in response**:
    - `X-RateLimit-Limit`: Request limit
    - `X-RateLimit-Remaining`: Remaining requests
    - `X-RateLimit-Reset`: Reset time

## 🧪 Testing Examples

### cURL Examples
```bash
# Create tenant
curl -X POST http://localhost:4000/api/v1/tenants \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Gym", "domain": "test-gym", "tenantType": "GYM", "contact": {"email": "admin@test.com"}}'

# Register user
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Domain: test-gym" \
  -d '{"firstName": "John", "lastName": "Doe", "email": "john@test.com", "password": "password123"}'

# Login user
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Domain: test-gym" \
  -d '{"email": "john@test.com", "password": "password123"}'

# Get profile (replace TOKEN)
curl -X GET http://localhost:4000/api/v1/auth/profile \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Tenant-Domain: test-gym"
```

### JavaScript/Fetch Examples
```javascript
// API client setup
const apiClient = {
  baseURL: 'http://localhost:4000/api/v1',
  tenantDomain: 'my-fitness-gym',
  token: null,

  async request(method, endpoint, data = null) {
    const headers = {
      'Content-Type': 'application/json',
      'X-Tenant-Domain': this.tenantDomain,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : null,
    });

    return await response.json();
  },

  // Login and store token
  async login(email, password) {
    const result = await this.request('POST', '/auth/login', {
      email,
      password,
    });
    
    if (result.success) {
      this.token = result.data.accessToken;
    }
    
    return result;
  },

  // Get user profile
  async getProfile() {
    return await this.request('GET', '/auth/profile');
  },

  // List users
  async getUsers(page = 1, limit = 20) {
    return await this.request('GET', `/users?page=${page}&limit=${limit}`);
  },
};

// Usage
await apiClient.login('john@test.com', 'password123');
const profile = await apiClient.getProfile();
const users = await apiClient.getUsers(1, 50);
```

---

**🔗 Related Documentation**:
- [Setup Guide](SETUP.md) - Installation & configuration
- [Security Guide](SECURITY.md) - Authentication & permissions
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues