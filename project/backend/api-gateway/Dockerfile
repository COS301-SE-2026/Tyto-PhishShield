FROM ghcr.io/pnpm/pnpm:11.1.1

RUN groupadd phishshield && useradd -m -g phishshield appuser

RUN pnpm runtime set node 22 -g

WORKDIR /app

RUN chown -R appuser:phishshield /app

RUN mkdir -p ../var/log/api-gateway

RUN chown -R appuser:phishshield ../var/log/api-gateway

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY project/backend/api-gateway/package.json ./project/backend/api-gateway/package.json
COPY project/backend/api-gateway/ ./project/backend/api-gateway/

RUN pnpm config set fetch-retries 8 -g \
 && pnpm config set fetch-retry-mintimeout 10000 -g \
 && pnpm config set fetch-retry-maxtimeout 120000 -g \
 && pnpm config set fetch-timeout 120000 -g \
 && pnpm config set network-concurrency 8 -g

RUN pnpm install --frozen-lockfile --prefer-offline

WORKDIR /app/project/backend/api-gateway

RUN rm -f tsconfig.build.tsbuildinfo && pnpm run build

USER appuser

CMD ["node", "dist/main.js"]