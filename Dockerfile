FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY view/package.json ./view/package.json
COPY pnpm-workspace.yaml ./
# Use cache mount to speed up install. Workspace install handles both root and view.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/view/node_modules ./view/node_modules
# Build both backend (tsup) and frontend (vite)
RUN pnpm build

FROM base AS prod-deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
# Install only production dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Keep necessary runtime libraries
RUN echo 'Acquire::ForceIPv4 "true";' > /etc/apt/apt.conf.d/99force-ipv4 && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    libgssapi-krb5-2 \
    libsasl2-2 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER node
EXPOSE 9000

CMD ["node", "dist/index.js"]
