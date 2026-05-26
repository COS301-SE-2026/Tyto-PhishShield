FROM ghcr.io/pnpm/pnpm:11.1.1

RUN groupadd phishshield && useradd -m -g phishshield appuser

RUN pnpm runtime set node 22 -g

WORKDIR /app

RUN chown -R appuser:phishshield /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY project/backend/api-gateway/package.json ./project/backend/api-gateway/package.json
COPY project/backend/api-gateway/ ./project/backend/api-gateway/

RUN pnpm install --frozen-lockfile

WORKDIR /app/project/backend/api-gateway

RUN rm -f tsconfig.build.tsbuildinfo && pnpm run build

USER appuser

CMD ["node", "dist/main.js"]