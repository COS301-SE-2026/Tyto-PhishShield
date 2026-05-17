FROM ghcr.io/pnpm/pnpm:latest

RUN pnpm runtime set node 22 -g

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY project/backend/accounts-service/package.json ./project/backend/accounts-service/package.json
COPY project/backend/accounts-service/ ./project/backend/accounts-service/

RUN pnpm install --frozen-lockfile

WORKDIR /app/project/backend/accounts-service

RUN pnpm run build

CMD [ "pnpm", "run", "start:dev" ]