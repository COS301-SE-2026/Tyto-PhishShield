FROM node:22 AS builder

RUN corepack enable
RUN corepack prepare pnpm@11.1.1 --activate

RUN groupadd phishshield && useradd -m -g phishshield appuser

WORKDIR /app

RUN chown -R appuser:phishshield /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY project/frontend/phishshield-outlook-addin/package.json ./project/frontend/phishshield-outlook-addin/package.json
COPY project/frontend/phishshield-outlook-addin/ ./project/frontend/phishshield-outlook-addin/

RUN pnpm install --frozen-lockfile --ignore-scripts

WORKDIR /app/project/frontend/phishshield-outlook-addin

ARG API_BASE
ENV API_BASE=${API_BASE}
ARG ADDIN_BASE_URL
ENV ADDIN_BASE_URL=${ADDIN_BASE_URL}

RUN pnpm build

USER appuser

FROM nginx:alpine

COPY --from=builder /app/project/frontend/phishshield-outlook-addin/dist /usr/share/nginx/html

RUN chown -R nginx:nginx \
    /usr/share/nginx/html \
    /var/cache/nginx \
    /var/log/nginx \
    /etc/nginx/conf.d

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]