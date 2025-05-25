#!/bin/bash

DOMAIN=$1
NAME=$2
TYPE=${3:-GYM}
EMAIL=${4:-admin@$DOMAIN.com}

if [ -z "$DOMAIN" ]; then
    echo "❌ Domain is required"
    echo "Usage: ./scripts/tenant-create.sh <domain> [name] [type] [email]"
    echo "Example: ./scripts/tenant-create.sh my-gym 'My Gym' GYM admin@my-gym.com"
    exit 1
fi

if [ -z "$NAME" ]; then
    NAME="$(echo $DOMAIN | sed 's/-/ /g' | sed 's/\b\w/\U&/g') Fitness"
fi

echo "🏢 Creating tenant: $DOMAIN"
echo "📝 Name: $NAME"
echo "🏷️  Type: $TYPE"
echo "📧 Email: $EMAIL"

# Create tenant via API
curl -X POST http://localhost:3000/api/v1/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$NAME\",
    \"domain\": \"$DOMAIN\",
    \"tenantType\": \"$TYPE\",
    \"contact\": {
      \"email\": \"$EMAIL\"
    },
    \"settings\": {
      \"timezone\": \"UTC\",
      \"currency\": \"USD\",
      \"language\": \"en\"
    }
  }" | jq .

echo ""
echo "✅ Tenant creation request completed!"
echo "🔗 You can now use: X-Tenant-Domain: $DOMAIN"
