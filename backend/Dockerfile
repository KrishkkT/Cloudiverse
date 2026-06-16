FROM node:20-alpine

# Install curl for ALB target group healthchecks
RUN apk add --no-cache curl

WORKDIR /app

# Set node execution to production
ENV NODE_ENV=production
ENV PORT=5000

# Set permissions of /app to node user
RUN chown node:node /app

USER node

# Copy dependency manifests
COPY --chown=node:node package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy source code (Excluding ignored files)
COPY --chown=node:node . .

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "server.js"]