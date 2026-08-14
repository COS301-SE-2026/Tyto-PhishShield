FROM ghcr.io/pnpm/pnpm:11.1.1

RUN groupadd phishshield && useradd -m -g phishshield appuser

RUN pnpm runtime set node 22 -g

WORKDIR /app

RUN chown -R appuser:phishshield /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY project/frontend/website/package.json ./project/frontend/website/package.json
COPY project/frontend/website/ ./project/frontend/website/

RUN pnpm install --frozen-lockfile --prefer-offline --ignore-scripts

WORKDIR /app/project/frontend/website

ARG VITE_API_GATEWAY_URL
ARG VITE_BASE_PATH

ENV VITE_API_GATEWAY_URL=$VITE_API_GATEWAY_URL
ENV VITE_BASE_PATH=$VITE_BASE_PATH

RUN pnpm run build

RUN pnpm add -g serve --ignore-scripts

EXPOSE 5173

USER appuser

CMD [ "serve", "-s", "dist", "-l", "5173" ]