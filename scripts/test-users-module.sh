#!/bin/bash

# Test Users Module API

API_URL="http://localhost:4000/api/v1"
TENANT_DOMAIN="fitmax-gym"  # Existing tenant from seeded data

echo "🧪 Testing Users Module API..."
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ACCESS_TOKEN=""

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
        response=$(curl -s -X $method "$url" -H "Content-Type: application/json" $headers -d "$data")
    else
        response=$(curl -s -X $method "$url" $headers)
    fi

    if echo "$response" | jq -e .success > /dev/null 2>&1; then
        echo -e "${GREEN}✅ SUCCESS${NC}"
        echo "$response" | jq .
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "$response" | jq . 2>/dev/null || echo "$response"
        return 1
    fi
}

# Step 1: Login to get access token
echo -e "\n${BLUE}Step 1: Getting access token...${NC}"
login_data='{
  "email": "member@fitmax-gym.com",
  "password": "password123"
}'

login_response=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Domain: $TENANT_DOMAIN" \
  -d "$login_data")

if echo "$login_response" | jq -e .success > /dev/null 2>&1; then
    ACCESS_TOKEN=$(echo "$login_response" | jq -r '.data.accessToken')
    echo -e "${GREEN}✅ Login successful${NC}"
    echo -e "${BLUE}📝 Token: ${ACCESS_TOKEN:0:20}...${NC}"
else
    echo -e "${RED}❌ Login failed${NC}"
    echo "$login_response"
    exit 1
fi

# Common headers
AUTH_HEADERS="-H 'Authorization: Bearer $ACCESS_TOKEN' -H 'X-Tenant-Domain: $TENANT_DOMAIN'"

# Step 2: Test Current User Profile
echo -e "\n${BLUE}Step 2: Testing current user profile...${NC}"
test_endpoint "Get Current User Profile" "GET" "$API_URL/users/me" "" "$AUTH_HEADERS"

# Step 3: Test Users List
echo -e "\n${BLUE}Step 3: Testing users list...${NC}"
test_endpoint "Get Users List" "GET" "$API
