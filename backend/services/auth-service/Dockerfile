# Base image (lightweight)
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy dependency files first (for caching)
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy application source
COPY . .

# Document the port used by the service
EXPOSE 3001

# Start the auth service
CMD ["sh", "-c", "NODE_OPTIONS=--dns-result-order=ipv4first npm start"]

