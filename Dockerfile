# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Builder
# Compiles TypeScript → JavaScript
# ─────────────────────────────────────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Copy manifests first — Docker layer cache means npm install only
# re-runs when package.json actually changes, not on every code edit
COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci --only=production=false

COPY src/ ./src/

RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Production
# Only compiled JS + prod dependencies, no devDeps, no source TS
# Result: ~180MB instead of ~600MB
# ─────────────────────────────────────────────────────────────────────────────
FROM node:18-alpine AS production

WORKDIR /app

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
RUN npm ci --only=production

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

# Graceful shutdown support
CMD ["node", "dist/app.js"]
