FROM node:22.13.1-slim AS builder
WORKDIR /app

COPY package.json yarn.lock ./
COPY packages ./packages

RUN corepack enable && corepack prepare yarn@4.10.3 --activate \
    && yarn config set nodeLinker node-modules \
    && yarn install --immutable \
    && yarn workspaces focus --all \
    && yarn workspace backend drizzle-kit generate \
    && yarn workspace backend build

FROM node:22.13.1-slim

RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

RUN chown -R appuser:appuser /app

COPY --from=builder --chown=appuser:appuser /app/packages/backend/dist ./dist
COPY --from=builder --chown=appuser:appuser /app/packages/backend/drizzle ./drizzle
COPY --from=builder --chown=appuser:appuser /app/packages/backend/package.json ./package.json

ENV NODE_ENV=production

USER appuser

EXPOSE 4000

CMD ["node", "./dist/src/app.js"]