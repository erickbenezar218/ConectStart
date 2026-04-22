FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── build ──────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ── runner (imagem final mínima) ───────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist          ./dist
COPY --from=builder /app/node_modules  ./node_modules
COPY --from=builder /app/prisma        ./prisma
COPY package*.json ./

# pasta de uploads — monte como volume no EasyPanel
RUN mkdir -p uploads

EXPOSE 3001

# roda migrations automaticamente na inicialização e sobe o servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
