#!/bin/bash

echo "🚀 Setting up NexFit Multi-Tenant Backend..."

# Create directories
mkdir -p logs uploads

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file if not exists
if [ ! -f .env.development ]; then
    echo "📝 Creating development environment file..."
    cp .env.example .env.development
    echo "⚠️  Please update .env.development with your actual values"
fi

# Start database services
echo "🐳 Starting database services..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 15

# Check if database is ready
echo "🔍 Checking database connection..."
docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U nexfit_user -d nexfit_dev || {
    echo "❌ Database is not ready. Please check Docker services."
    exit 1
}

echo "✅ Setup completed!"
echo ""
echo "Next steps:"
echo "1. Update .env.development with your configuration"
echo "2. Run: npm run migration:run:public"
echo "3. Run: npm run seed:public"
echo "4. Run: npm run dev"
