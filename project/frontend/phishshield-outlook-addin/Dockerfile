FROM ghcr.io/pnpm/pnpm:11.1.1

RUN groupadd phishshield && useradd -m -g phishshield appuser

RUN pnpm runtime set node 22 -g

WORKDIR /app

RUN chown -R appuser:phishshield /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY project/frontend/phishshield-outlook-addin/package.json ./project/frontend/phishshield-outlook-addin/package.json
COPY project/phishshield-outlook-addin/website/ ./project/phishshield-outlook-addin/website/

RUN pnpm install --frozen-lockfile

WORKDIR /app/project/frontend/website

USER appuser

CMD [ "pnpm", "start" ]