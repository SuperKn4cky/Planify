FROM node:22.13.1-slim AS builder

WORKDIR /app

COPY package.json drizzle.config.ts tsconfig.json ./

RUN corepack enable

COPY src ./src

RUN yarn config set nodeLinker node-modules \
    && yarn workspaces focus --all \
    && yarn drizzle-kit generate \
    && yarn build

FROM node:22.13.1-slim

RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

RUN chown -R appuser:appuser /app

COPY --from=builder --chown=appuser:appuser /app/dist ./dist
COPY --from=builder --chown=appuser:appuser /app/drizzle ./drizzle
COPY --from=builder --chown=appuser:appuser /app/package.json ./package.json
COPY --from=builder --chown=appuser:appuser /app/node_modules ./node_modules

ARG DATABASE_URL
ARG FRONTEND_URL
ARG JWT_SECRET
ARG NODE_ENV

ENV DATABASE_URL=${DATABASE_URL}
ENV FRONTEND_URL=${FRONTEND_URL}
ENV JWT_SECRET=${JWT_SECRET}
ENV NODE_ENV=${NODE_ENV}

USER appuser

EXPOSE 4000

CMD ["node", "./dist/src/app.js"]