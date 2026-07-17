# syntax=docker/dockerfile:1

# ---- Stage 1: install dependencies for the whole monorepo ----
FROM node:22-alpine AS deps
WORKDIR /app
# Copy the full monorepo and do a clean, lockfile-pinned install.
COPY . .
RUN npm ci

# ---- Stage 2: build only the web app with turbo ----
FROM deps AS builder
WORKDIR /app

# Next.js inlines NEXT_PUBLIC_* values at build time, so the Supabase config
# has to be present as build args (Coolify: set these under Build Variables).
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Öffentliche Basis-URL für alle Links, die in E-Mails landen. Im Client-Bundle
# wird der Wert zur Build-Zeit eingebacken – fehlt das Build-Arg, ist er dort
# `undefined` und es greift nur der Fallback. Serverseitig wird zusätzlich zur
# Laufzeit gelesen, deshalb in Coolify als Build- UND Runtime-Variable setzen.
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

RUN npx turbo run build --filter=web

# ---- Stage 3: minimal production runtime ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# Bind to all interfaces so the container is reachable from outside.
ENV HOSTNAME=0.0.0.0

# curl wird für den HEALTHCHECK benötigt.
RUN apk add --no-cache curl

# Run as an unprivileged user.
RUN addgroup -g 1001 -S nodejs \
  && adduser -u 1001 -S nextjs -G nodejs

# The standalone output already bundles the traced node_modules in the
# monorepo layout (apps/web/server.js, packages/*, node_modules/*).
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

# Meldet den Container-Status an Coolify/Docker (behebt „unknown").
# `curl -f` scheitert nur ab HTTP >= 400: Nur 503 (Supabase nicht erreichbar)
# macht den Container unhealthy. „degraded" (Schema-Drift/fehlende Migration)
# antwortet bewusst mit 200 und bleibt healthy – siehe CLAUDE.md.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://localhost:3000/api/health || exit 1

CMD ["node", "apps/web/server.js"]
