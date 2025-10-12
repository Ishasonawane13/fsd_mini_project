# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

# Change ownership of the app directory
RUN chown -R nodeuser:nodejs /app
USER nodeuser

# Expose port
EXPOSE 5000

# Health check disabled temporarily for debugging
# HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
#     CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]