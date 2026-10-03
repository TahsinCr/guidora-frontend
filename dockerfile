# ========================================================
# Stage 1: Build & Optimize Assets
# ========================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Optimize caching by installing dependencies first
COPY package.json package-lock.json ./
RUN npm ci --no-audit --prefer-offline

# Copy source code and build
COPY . .

# Run production build (generates optimized dist/ with pre-compressed Brotli & Gzip)
ENV VITE_USE_MOCK=false
ENV VITE_ALLOW_MOCK_FALLBACK=false
ENV VITE_API_BASE_URL=/api
RUN npm run build

# ========================================================
# Stage 2: Minimal, Hardened Production Server
# ========================================================
FROM nginx:1.27-alpine-slim AS runner

# Create dedicated non-root user/group or use standard nginx
WORKDIR /usr/share/nginx/html

# Remove default nginx html
RUN rm -rf ./*

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist ./

# Copy customized, security-hardened Nginx configuration
COPY infra/nginx/default.conf /etc/nginx/conf.d/default.conf

# Expose standard HTTP port
EXPOSE 80

# Container liveness check
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/healthz || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
