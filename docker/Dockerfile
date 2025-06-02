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
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Create directories and set permissions
RUN mkdir -p logs uploads dist && \
    chown -R nexphys:nodejs /app

# Switch to non-root user
USER nexphys

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Make start script executable
RUN chmod +x /app/docker/start.sh

# Start application using our improved startup script
CMD ["/app/docker/start.sh"]