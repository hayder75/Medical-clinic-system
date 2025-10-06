# Use Node.js 18 Debian image for better Prisma compatibility
FROM node:18-slim

# Install curl for health checks, netcat for waiting, and OpenSSL for Prisma
RUN apt-get update && apt-get install -y \
    curl \
    netcat-openbsd \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Make entrypoint script executable
RUN chmod +x docker-entrypoint.sh

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/auth/login || exit 1

# Start the application
ENTRYPOINT ["./docker-entrypoint.sh"]