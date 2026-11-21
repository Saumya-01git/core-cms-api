# Multi-stage production Dockerfile
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source & schema
COPY prisma ./prisma
COPY src ./src
COPY admin ./admin
COPY uploads ./uploads

# Expose server port
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

# Start command
CMD ["npm", "start"]
