# 🔵 STAGE 1: BASE SETUP
# Start with Node.js 18 on Alpine Linux (lightweight)
FROM node:22-alpine AS base

# Install extra tools needed for Prisma database stuff
RUN apk add --no-cache libc6-compat openssl

# Create app folder inside container
WORKDIR /app

# Copy package.json files first (for better caching)
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# 🔵 STAGE 2: DEVELOPMENT VERSION
FROM base AS dev
# Install ALL dependencies (including dev tools)
RUN npm ci
# Copy all source code
COPY . .
# Run development server
CMD ["npm", "run", "dev"]

# 🔵 STAGE 3: BUILD VERSION
FROM base AS builder

# Install ALL dependencies (need dev tools to build)
RUN npm ci

# Copy all source code
COPY . .

# Generate Prisma database client
RUN npx prisma generate

# Compile TypeScript to JavaScript
RUN npm run build

# 🔵 STAGE 4: PRODUCTION VERSION (FINAL)
FROM node:22-alpine AS production

# Install system tools
RUN apk add --no-cache libc6-compat openssl dumb-init

# Create a regular user (not root) for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 walletservice

# Create app folder
WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy the built JavaScript code from builder stage
COPY --from=builder --chown=walletservice:nodejs /app/dist ./dist
COPY --from=builder --chown=walletservice:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=walletservice:nodejs /app/prisma ./prisma

# Copy example environment file
COPY --chown=walletservice:nodejs .env.example ./

# Switch to the regular user (not root)
USER walletservice

# Tell Docker this app uses port 5002
EXPOSE 5002

# Check if app is healthy every 30 seconds
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5002/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Use dumb-init to handle shutdowns properly
ENTRYPOINT ["dumb-init", "--"]

# Start the app
CMD ["node", "dist/index.js"]