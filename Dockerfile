FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# Install build dependencies for native modules if needed
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
RUN pnpm install --frozen-lockfile

FROM deps AS builder
WORKDIR /app
COPY . .
RUN pnpm build
# Prune dev dependencies
RUN pnpm prune --prod --config.ignore-scripts=true

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# System deps
RUN echo 'Acquire::ForceIPv4 "true";' > /etc/apt/apt.conf.d/99force-ipv4 &&     apt-get update &&     apt-get install -y --no-install-recommends     curl     libgssapi-krb5-2     libsasl2-2     && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER node
EXPOSE 9000

CMD ["node", "dist/index.js"]
