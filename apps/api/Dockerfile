# Build context: repository root.  docker build -f apps/api/Dockerfile .
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter @speak-city/api... --filter @speak-city/shared
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @speak-city/shared build \
 && pnpm --filter @speak-city/api build \
 && pnpm --filter @speak-city/api deploy --prod --legacy /out

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out .
EXPOSE 4000
# apply migrations, load scene content (idempotent), then serve
CMD ["sh", "-c", "node dist/db/migrate.js && node dist/db/seed.js && node dist/main.js"]
