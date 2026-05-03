FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY backend/package*.json ./
RUN npm ci

# ── build ──────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY backend/ .
RUN npx prisma generate
RUN npm run build

# ── runner (imagem final mínima) ───────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl

COPY --from=builder /app/dist          ./dist
COPY --from=builder /app/node_modules  ./node_modules
COPY --from=builder /app/prisma        ./prisma
COPY backend/package*.json ./

RUN mkdir -p uploads contracts templates
# Uncomment to enable automatic DOCX→PDF conversion via LibreOffice:
# RUN apk add --no-cache libreoffice openjdk11-jre-headless fontconfig ttf-dejavu

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
