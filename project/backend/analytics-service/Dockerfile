FROM ghcr.io/pnpm/pnpm:11.1.1

RUN groupadd phishshield && useradd -m -g phishshield appuser

RUN pnpm runtime set node 22 -g

WORKDIR /app

RUN chown -R appuser:phishshield /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY project/backend/analytics-service/package.json ./project/backend/analytics-service/package.json
COPY project/backend/analytics-service/ ./project/backend/analytics-service/

RUN pnpm config set fetch-retries 8 -g \
 && pnpm config set fetch-retry-mintimeout 10000 -g \
 && pnpm config set fetch-retry-maxtimeout 120000 -g \
 && pnpm config set fetch-timeout 120000 -g \
 && pnpm config set network-concurrency 8 -g

RUN pnpm install --frozen-lockfile --prefer-offline

WORKDIR /app/project/backend/analytics-service

RUN rm -f tsconfig.build.tsbuildinfo && pnpm run build

USER appuser

CMD ["node", "dist/main.js"]