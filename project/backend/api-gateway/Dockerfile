FROM ghcr.io/pnpm/pnpm:11.1.1@sha256:18bcf6373f2ca9b74f13d939951f02b4514ec10a6f548fec8cfe28eb02cc4b4f AS build

RUN groupadd phishshield && useradd -m -g phishshield appuser

RUN pnpm runtime set node 24 -g

WORKDIR /app

RUN chown -R appuser:phishshield /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY project/backend/api-gateway/package.json ./project/backend/api-gateway/package.json
COPY project/backend/api-gateway/ ./project/backend/api-gateway/

RUN pnpm config set fetch-retries 8 -g \
 && pnpm config set fetch-retry-mintimeout 10000 -g \
 && pnpm config set fetch-retry-maxtimeout 120000 -g \
 && pnpm config set fetch-timeout 120000 -g \
 && pnpm config set network-concurrency 8 -g

RUN pnpm install --frozen-lockfile --prefer-offline --ignore-scripts

WORKDIR /app/project/backend/api-gateway

RUN rm -f tsconfig.build.tsbuildinfo && pnpm run build

FROM node:24.19-alpine3.24@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43 AS runtime

RUN addgroup -S phishshield && adduser -S appuser -G phishshield

WORKDIR /app

RUN chown -R appuser:phishshield /app

COPY --from=build /app/project/backend/api-gateway/dist/ ./dist/

RUN mkdir -p ../var/log/api-gateway

RUN chown -R appuser:phishshield ../var/log/api-gateway

USER appuser

CMD ["node", "dist/main.js"]