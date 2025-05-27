FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Create app directory
WORKDIR /app

# Create nexphys user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nexphys -u 1001 -G nodejs

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for development)
RUN npm ci

# Install modules
RUN npm install

# Copy source code
COPY . .

# Create directories and set permissions
RUN mkdir -p logs uploads dist && \
    chown -R nexphys:nodejs /app

# Switch to non-root user
USER nexphys

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "run", "dev"]