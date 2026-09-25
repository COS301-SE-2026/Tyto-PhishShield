FROM node:24.19-alpine3.24@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43 AS builder

RUN corepack enable
RUN corepack prepare pnpm@11.1.1 --activate

RUN addgroup -S phishshield && adduser -S appuser -G phishshield

WORKDIR /app

RUN chown -R appuser:phishshield /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY project/frontend/phishshield-outlook-addin/package.json ./project/frontend/phishshield-outlook-addin/package.json

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY project/frontend/phishshield-outlook-addin/ ./project/frontend/phishshield-outlook-addin/

WORKDIR /app/project/frontend/phishshield-outlook-addin

ARG API_BASE
ENV API_BASE=${API_BASE}
ARG ADDIN_BASE_URL
ENV ADDIN_BASE_URL=${ADDIN_BASE_URL}

RUN pnpm build

USER appuser

FROM nginxinc/nginx-unprivileged:alpine

COPY --from=builder /app/project/frontend/phishshield-outlook-addin/dist /usr/share/nginx/html

USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]