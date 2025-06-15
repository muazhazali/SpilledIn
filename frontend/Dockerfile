# syntax=docker/dockerfile:1

# ----------
# 1. Install dependencies
# ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Enable pnpm via corepack (ships with Node 20)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency manifests first for cached installs
COPY package.json pnpm-lock.yaml* ./

# Install production & dev dependencies (cached by layer)
RUN pnpm install --frozen-lockfile

# ----------
# 2. Build the application
# ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Re-enable pnpm in this stage
RUN corepack enable && corepack prepare pnpm@latest --activate

# Bring installed deps from previous stage
COPY --from=deps /app/node_modules ./node_modules
# Bring rest of the source code
COPY . .

# Build Next.js (outputs to .next)
RUN pnpm run build

# ----------
# 3. Create production image
# ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy only the minimal files needed to run the app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000

# Start the Next.js server
CMD ["node_modules/.bin/next", "start", "-p", "3000"] 