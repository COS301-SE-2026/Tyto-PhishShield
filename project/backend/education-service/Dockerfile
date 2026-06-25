FROM ghcr.io/pnpm/pnpm:latest

RUN pnpm runtime set node 22 -g

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY project/backend/education-service/package.json ./project/backend/education-service/package.json
COPY project/backend/education-service/ ./project/backend/education-service/

RUN pnpm install --frozen-lockfile

WORKDIR /app/project/backend/education-service

RUN pnpm run build

CMD ["node", "dist/main.js"]