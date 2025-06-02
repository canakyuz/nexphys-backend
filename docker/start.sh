#!/bin/sh
set -e

# Log başlatma mesajı
echo "🚀 Starting NexPhys API in Docker environment"

# Çalışma ortamını kontrol et
if [ "$NODE_ENV" = "production" ]; then
  echo "📡 Running in PRODUCTION mode"
  
  # Önce TypeScript kodunu derle
  echo "🔨 Building TypeScript code..."
  npm run build
  
  # Derlenmiş uygulamayı başlat
  echo "🚀 Starting production server..."
  node dist/server.js
else
  echo "🛠️ Running in DEVELOPMENT mode"
  
  # Önce package.json'ın varlığını kontrol et
  if [ ! -f /app/package.json ]; then
    echo "❌ ERROR: package.json not found in /app directory!"
    echo "Current directory contents:"
    ls -la /app
    exit 1
  fi
  
  # Dev modunda nodemon ile çalıştır
  echo "🔄 Starting development server with hot-reload..."
  npm run dev
fi
