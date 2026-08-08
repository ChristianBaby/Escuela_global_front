# =============================================================
# Escuela Global Frontend — Dockerfile (multi-stage)
# Build standalone de Next.js, runtime minimo con node:22-alpine.
# =============================================================

# -------------------------------------------------------------
# Stage 1: deps
# Instala dependencias de produccion.
# -------------------------------------------------------------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# `lightningcss` (usado por Tailwind v4) tiene un binding nativo por
# plataforma. `npm ci` con la libc del host no resuelve correctamente
# la variante musl cuando la imagen es Alpine, asi que el build de
# Next.js falla. Lo instalamos explicito.
RUN npm install --no-save lightningcss-linux-x64-musl@1.32.0

# -------------------------------------------------------------
# Stage 2: builder
# Compila Next.js. `output: "standalone"` (en next.config.ts)
# genera `.next/standalone` con un server.js minimo y solo
# los node_modules que se usan en runtime.
# -------------------------------------------------------------
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* se embebe en el bundle en build-time. Lo pasamos
# como ARG desde docker-compose (build.args).
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# -------------------------------------------------------------
# Stage 3: runner
# Imagen final. No-root, solo el server standalone + estaticos.
# -------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

RUN addgroup -g 1001 -S nodejs \
  && adduser -S nextjs -u 1001

# Assets estaticos servidos por el server standalone
COPY --from=builder /app/public ./public

# Bundle standalone (incluye server.js y node_modules recortado)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# .next/static no lo copia standalone automaticamente
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD node -e "require('http').get({host:'0.0.0.0',port:3000,timeout:5000},r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
