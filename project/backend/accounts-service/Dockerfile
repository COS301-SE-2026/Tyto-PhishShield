FROM ghcr.io/pnpm/pnpm:latest

RUN addgroup -S phishshield && adduser -S appuser -G phishshield

RUN pnpm runtime set node 22 -g

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY project/backend/accounts-service/package.json ./project/backend/accounts-service/package.json
COPY project/backend/accounts-service/ ./project/backend/accounts-service/

RUN chown -R appuser:phishshield /app
USER appuser

RUN pnpm install --frozen-lockfile

WORKDIR /app/project/backend/accounts-service

RUN pnpm run build

CMD ["node", "dist/main.js"]