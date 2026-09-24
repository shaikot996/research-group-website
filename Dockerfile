# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NEXT_TELEMETRY_DISABLED=1 DATABASE_URL="file:/tmp/build.db"
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 DATABASE_URL="file:/app/data/site.db" UPLOAD_DIR="/app/data/uploads" PEOPLE_PHOTO_DIR="/app/public/people" ENABLE_ADMIN=false
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
RUN mkdir -p /app/data/uploads && chown -R nextjs:nodejs /app/data && chmod +x /app/scripts/docker-entrypoint.sh
USER nextjs
EXPOSE 3000
ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
CMD ["node", "server.js"]
