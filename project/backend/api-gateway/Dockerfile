FROM ghcr.io/pnpm/pnpm:latest

RUN addgroup -S phishshield && adduser -S appuser -G phishshield

RUN pnpm runtime set node 22 -g

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY project/backend/api-gateway/package.json ./project/backend/api-gateway/package.json
COPY project/backend/api-gateway/ ./project/backend/api-gateway/

RUN chown -R appuser:phishshield /app
USER appuser

RUN pnpm install --frozen-lockfile

WORKDIR /app/project/backend/api-gateway

RUN pnpm run build

CMD ["pnpm", "run", "start:dev"]