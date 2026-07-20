FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json yarn.lock lerna.json tsconfig.base.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN yarn install --frozen-lockfile --non-interactive

COPY server/tsconfig.json server/tsconfig.json
COPY server/src server/src
RUN yarn workspace @presight/server build

FROM node:22-bookworm-slim AS production-dependencies

WORKDIR /app

COPY server/package.json package.json
COPY yarn.lock yarn.lock
RUN yarn install --frozen-lockfile --non-interactive --production

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/presight.sqlite

WORKDIR /app

COPY --from=production-dependencies --chown=node:node /app/node_modules node_modules
COPY --from=build --chown=node:node /app/server/dist dist
COPY --from=build --chown=node:node /app/server/package.json package.json

RUN mkdir -p /app/data && chown node:node /app/data

USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]
