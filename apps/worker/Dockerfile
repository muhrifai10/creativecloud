# NexusDrive background worker (BullMQ). Build dari root repo: docker build -f apps/worker/Dockerfile .
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# Install dependencies (workspace-aware) lalu salin sumber.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/worker/package.json apps/worker/
COPY packages/core/package.json packages/core/
COPY packages/database/package.json packages/database/
RUN pnpm install --no-frozen-lockfile

COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps ./apps
RUN pnpm --filter @nexusdrive/database exec prisma generate

ENV NODE_ENV=production
WORKDIR /app/apps/worker
EXPOSE 8080
CMD ["pnpm", "start"]
