FROM node:22-bookworm-slim AS build

ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}

WORKDIR /app

COPY package.json yarn.lock lerna.json tsconfig.base.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN yarn install --frozen-lockfile --non-interactive

COPY client/index.html client/tsconfig.json client/tsconfig.app.json client/tsconfig.node.json client/vite.config.ts client/
COPY client/src client/src
RUN yarn workspace @presight/client build

FROM nginx:1.27-alpine AS runtime

COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
