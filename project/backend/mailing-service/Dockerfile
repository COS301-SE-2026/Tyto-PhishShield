FROM ghcr.io/pnpm/pnpm:latest

RUN addgroup -S phishshield && adduser -S appuser -G phishshield

RUN pnpm runtime set node 22 -g

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY project/backend/mailing-service/package.json ./project/backend/mailing-service/package.json
COPY project/backend/mailing-service/ ./project/backend/mailing-service/

RUN chown -R appuser:phishshield /app
USER appuser

RUN pnpm install --frozen-lockfile

WORKDIR /app/project/backend/mailing-service

RUN pnpm run build

CMD [ "pnpm", "run", "start:dev" ]