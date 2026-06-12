FROM ghcr.io/pnpm/pnpm:11.1.1

RUN groupadd phishshield && useradd -m -g phishshield appuser

RUN pnpm runtime set node 22 -g

WORKDIR /app

RUN chown -R appuser:phishshield /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY project/frontend/website/package.json ./project/frontend/website/package.json
COPY project/frontend/website/ ./project/frontend/website/

RUN pnpm install --frozen-lockfile

WORKDIR /app/project/frontend/website

RUN pnpm run build

RUN pnpm add -g serve

EXPOSE 5173

USER appuser

CMD [ "serve", "-s", "dist", "-l", "5173" ]