#!/bin/bash

API_URL="http://localhost:3000/api/v1"

echo "🧪 Testing NexFit Multi-Tenant API..."
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local headers=$5

    echo -e "\n${YELLOW}Testing: $name${NC}"
    echo "----------------------------------------"

    if [ -n "$data" ]; then
        if [ -n "$headers" ]; then
            response=$(curl -s -X $method "$url" -H "Content-Type: application/json" $headers -d "$data")
        else
            response=$(curl -s -X $method "$url" -H "Content-Type: application/json" -d "$data")
        fi
    else
        if [ -n "$headers" ]; then
            response=$(curl -s -X $method "$url" $headers)
        else
            response=$(curl -s -X $method "$url")
        fi
    fi

    if echo "$response" | jq -e .success > /dev/null 2>&1; then
        echo -e "${GREEN}✅ SUCCESS${NC}"
        echo "$response" | jq .
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "$response"
    fi
}

# Test 1: Health Check
test_endpoint "Health Check" "GET" "$API_URL/../health"

# Test 2: Create Tenant
echo -e "\n${YELLOW}Creating test tenant...${NC}"
tenant_data='{
  "name": "Test Gym ABC",
  "domain": "test-gym-abc",
  "tenantType": "GYM",
  "contact": {
    "email": "admin@test-gym-abc.com",
    "phone": "+1234567890"
  },
  "settings": {
    "timezone": "UTC",
    "currency": "USD",
    "language": "en"
  }
}'

tenant_response=$(curl -s -X POST "$API_URL/tenants" \
  -H "Content-Type: application/json" \
  -d "$tenant_data")

if echo "$tenant_response" | jq -e .success > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Tenant created successfully${NC}"
    tenant_domain=$(echo "$tenant_response" | jq -r '.data.domain')
    echo "Tenant Domain: $tenant_domain"
else
    echo -e "${RED}❌ Failed to create tenant${NC}"
    echo "$tenant_response"
    exit 1
fi

# Test 3: Register User
echo -e "\n${YELLOW}Registering user in tenant...${NC}"
register_data='{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@test-gym-abc.com",
  "password": "password123"
}'

test_endpoint "Register User" "POST" "$API_URL/auth/register" "$register_data" "-H 'X-Tenant-Domain: $tenant_domain'"

# Test 4: Login User
echo -e "\n${YELLOW}Logging in user...${NC}"
login_data='{
  "email": "john@test-gym-abc.com",
  "password": "password123"
}'

login_response=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Domain: $tenant_domain" \
  -d "$login_data")

if echo "$login_response" | jq -e .success > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Login successful${NC}"
    token=$(echo "$login_response" | jq -r '.data.accessToken')
    echo "Token obtained: ${token:0:20}..."
else
    echo -e "${RED}❌ Login failed${NC}"
    echo "$login_response"
    exit 1
fi

# Test 5: Get Profile
test_endpoint "Get User Profile" "GET" "$API_URL/auth/profile" "" "-H 'Authorization: Bearer $token' -H 'X-Tenant-Domain: $tenant_domain'"

# Test 6: List Tenants (Admin)
test_endpoint "List Tenants" "GET" "$API_URL/tenants" "" "-H 'Authorization: Bearer $token'"

echo -e "\n${GREEN}🎉 All API tests completed!${NC}"
echo -e "\n${YELLOW}Usage examples:${NC}"
echo "Tenant Domain: $tenant_domain"
echo "Authorization: Bearer $token"
echo "API Base URL: $API_URL"
