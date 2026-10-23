FROM ghcr.io/pnpm/pnpm:11.1.1@sha256:18bcf6373f2ca9b74f13d939951f02b4514ec10a6f548fec8cfe28eb02cc4b4f AS build

RUN groupadd phishshield && useradd -m -g phishshield appuser

RUN pnpm runtime set node 22 -g

WORKDIR /app

RUN chown -R appuser:phishshield /app

ARG GLINER_MODEL_URL=https://huggingface.co/onnx-community/gliner_small-v2/resolve/6b17161d3a8ef6737ee6492659a095daed73d868/onnx/model.onnx

RUN curl -L --fail --retry 5 \
    "$GLINER_MODEL_URL" \
    -o /tmp/model.onnx

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY project/backend/llm-service/package.json ./project/backend/llm-service/package.json
COPY project/backend/packages/dto/package.json ./project/backend/packages/dto/package.json
COPY project/backend/packages/eventHandler/package.json ./project/backend/packages/eventHandler/package.json

RUN pnpm config set fetch-retries 8 -g \
 && pnpm config set fetch-retry-mintimeout 10000 -g \
 && pnpm config set fetch-retry-maxtimeout 120000 -g \
 && pnpm config set fetch-timeout 120000 -g \
 && pnpm config set network-concurrency 8 -g \
 && pnpm install --frozen-lockfile --prefer-offline

COPY project/backend/packages/eventHandler/ ./project/backend/packages/eventHandler/

COPY project/backend/packages/dto/ ./project/backend/packages/dto/

RUN pnpm build:shared

COPY project/backend/llm-service/ ./project/backend/llm-service/

WORKDIR /app/project/backend/llm-service

RUN rm -f tsconfig.build.tsbuildinfo && pnpm run build

RUN pnpm deploy --filter llm-service --prod /out

FROM node:24.19-bookworm-slim AS runtime

RUN addgroup -S phishshield && adduser -S appuser -G phishshield

WORKDIR /app

RUN chown -R appuser:phishshield /app

COPY --from=build /tmp/model.onnx /app/model.onnx
COPY --from=build /out ./
COPY --from=build /app/project/backend/llm-service/dist/ ./dist/

USER appuser

CMD ["node", "dist/main.js"]