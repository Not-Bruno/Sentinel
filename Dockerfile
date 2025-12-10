# Stage 1: Build the Next.js application
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the Next.js application for production
RUN npm run build


# Stage 2: Create the production image
FROM node:18-alpine

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Install production-only native dependencies
RUN apk add --no-cache libc6-compat build-base python3

# Copy built assets from the builder stage
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "server.js"]
