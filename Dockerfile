ARG BASE_IMAGE
ARG SERVICE_NAME
ARG NODE_VERSION=24.12.0-slim

FROM ${BASE_IMAGE} AS pruner
WORKDIR /app
COPY . .
# Remove all files except package.json, lockfiles, workspace config and tsconfig
RUN find . -type f -not -name "package.json" -not -name "pnpm-lock.yaml" -not -name "pnpm-workspace.yaml" -not -name ".npmrc" -not -name "tsconfig*.json" -delete

FROM ${BASE_IMAGE} AS base

FROM base AS deps
# LAYER CACHING: Copying only manifest files allows Docker to cache the 'pnpm fetch' layer
# regardless of source code changes.
USER node
WORKDIR /home/node/app
COPY --from=pruner --chown=node:node /app .
RUN pnpm fetch --frozen-lockfile

FROM deps AS installer
WORKDIR /home/node/app
ENV CI=true
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN pnpm install --frozen-lockfile --offline

FROM installer AS builder
ARG SERVICE_NAME
WORKDIR /home/node/app
ENV NODE_ENV=production
ENV CI=true
USER node
COPY --chown=node:node packages/ ./packages/
COPY --chown=node:node services/${SERVICE_NAME}/ ./services/${SERVICE_NAME}/
# ADDED: Copy View
COPY --chown=node:node services/view/ ./services/view/

# ADDED: Build View
RUN pnpm --filter @vk/view build

RUN pnpm --filter "@vk/${SERVICE_NAME}..." run build
RUN pnpm --filter="@vk/${SERVICE_NAME}" deploy --prod /home/node/app/deploy

FROM installer AS development
ARG SERVICE_NAME
USER root
USER node
WORKDIR /home/node/app
ENV NODE_ENV=development
ENV CI=true
USER node

RUN find services -mindepth 1 -maxdepth 1 -type d -not -name "${SERVICE_NAME}" -exec rm -rf {} +

COPY --chown=node:node packages/ ./packages/
COPY --chown=node:node services/${SERVICE_NAME}/ ./services/${SERVICE_NAME}/
# ADDED: Copy View
COPY --chown=node:node services/view/ ./services/view/
# ADDED: Build View for Dev
RUN pnpm --filter @vk/view build

RUN mkdir -p node_modules/@vk && \
    for d in packages/*; do \
        if [ -d "$d" ]; then \
            pkg=$(basename "$d"); \
            rm -rf "node_modules/@vk/$pkg"; \
            ln -s "/home/node/app/packages/$pkg" "node_modules/@vk/$pkg"; \
            rm -rf "$d/node_modules"; \
        fi \
    done && \
    rm -rf services/${SERVICE_NAME}/node_modules

FROM node:${NODE_VERSION} AS production
ARG SERVICE_NAME
ENV NODE_ENV=production
WORKDIR /app

RUN echo 'Acquire::ForceIPv4 "true";' > /etc/apt/apt.conf.d/99force-ipv4

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    libgssapi-krb5-2 \
    libsasl2-2 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder --chown=node:node /home/node/app/deploy .
# ADDED: Copy View Dist
COPY --from=builder --chown=node:node /home/node/app/services/view/dist ./services/view/dist

USER node
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:9000/health || exit 1
