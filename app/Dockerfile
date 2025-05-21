# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build


# Expose the application port
EXPOSE 4000

# Start the application
CMD ["npm", "run", "start:dev"]
