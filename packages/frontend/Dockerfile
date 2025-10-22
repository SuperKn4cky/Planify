FROM node:22.13.1-slim AS builder
WORKDIR /app

COPY package.json yarn.lock ./
COPY packages ./packages

ARG BACKEND_URL
ENV BACKEND_URL=${BACKEND_URL}

RUN corepack enable && corepack prepare yarn@4.10.3 --activate \
    && yarn config set nodeLinker node-modules \
    && yarn install --immutable \
    && yarn workspaces focus --all \
    && yarn workspace frontend build

FROM gcr.io/distroless/nodejs22-debian12:nonroot AS runner
WORKDIR /app

COPY --from=builder /app/packages/frontend/.next ./.next
COPY --from=builder /app/packages/frontend/public ./public
COPY --from=builder /app/packages/frontend/package.json ./package.json
COPY --from=builder /app/packages/frontend/next.config.ts ./next.config.ts
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node_modules/.bin/next", "start"]
