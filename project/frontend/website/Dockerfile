FROM ghcr.io/pnpm/pnpm:11.1.1@sha256:18bcf6373f2ca9b74f13d939951f02b4514ec10a6f548fec8cfe28eb02cc4b4f AS build

RUN groupadd phishshield && useradd -m -g phishshield appuser

RUN pnpm runtime set node 24 -g

WORKDIR /app

RUN chown -R appuser:phishshield /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY project/frontend/website/package.json ./project/frontend/website/package.json

RUN pnpm install --frozen-lockfile --prefer-offline --ignore-scripts

COPY project/frontend/website/ ./project/frontend/website/

WORKDIR /app/project/frontend/website

ARG VITE_API_GATEWAY_URL
ARG VITE_BASE_PATH

ENV VITE_API_GATEWAY_URL=$VITE_API_GATEWAY_URL
ENV VITE_BASE_PATH=$VITE_BASE_PATH

RUN pnpm run build

FROM node:24.19-alpine3.24@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43 AS runtime

RUN npm add -g serve@14.2.6 --ignore-scripts

RUN addgroup -S phishshield && adduser -S appuser -G phishshield

WORKDIR /app

RUN chown -R appuser:phishshield /app

COPY --from=build /app/project/frontend/website/dist/ ./dist/

EXPOSE 5173

USER appuser

CMD [ "serve", "-s", "dist", "-l", "5173" ]