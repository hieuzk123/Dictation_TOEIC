# ========================================================
# Dockerfile: Frontend React 18 + Vite (Nginx Alpine)
# Multi-stage build
# ========================================================

# Stage 1: Build static assets
FROM node:22-alpine AS builder
WORKDIR /app

# Cache package dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build production bundle
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx Alpine
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html

# Clean default assets and copy production build
RUN rm -rf ./*
COPY --from=builder /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
