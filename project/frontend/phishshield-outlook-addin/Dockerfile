FROM node:22 AS builder

RUN corepack enable
RUN corepack prepare pnpm@11.1.1 --activate

RUN groupadd phishshield && useradd -m -g phishshield appuser

WORKDIR /app

RUN chown -R appuser:phishshield /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY project/frontend/phishshield-outlook-addin/package.json ./project/frontend/phishshield-outlook-addin/package.json
COPY project/frontend/phishshield-outlook-addin/ ./project/frontend/phishshield-outlook-addin/

RUN pnpm install --frozen-lockfile

WORKDIR /app/project/frontend/phishshield-outlook-addin

RUN pnpm build

USER appuser

FROM nginx:alpine

COPY --from=builder /app/project/frontend/phishshield-outlook-addin/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]