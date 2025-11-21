# Stage 1: Dependencies
FROM node:20.18.1-alpine3.20 AS deps

WORKDIR /app

# Instala dependências necessárias para builds nativos
RUN apk add --no-cache libc6-compat

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências (usa install pois package-lock.json não está commitado)
RUN npm install

# Stage 2: Builder
FROM node:20.18.1-alpine3.20 AS builder

WORKDIR /app

# Copia dependências do stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copia código fonte
COPY . .

# Build da aplicação Next.js
RUN npm run build

# Stage 3: Production
FROM node:20.18.1-alpine3.20 AS runner

WORKDIR /app

# Adiciona labels para metadata
LABEL maintainer="Kuhaku Team"
LABEL version="1.0.0"
LABEL description="Kuhaku SaaS Frontend Service"

# Define variáveis de ambiente
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

# Cria grupo e usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copia arquivos públicos
COPY --from=builder /app/public ./public

# Copia arquivos standalone e static com ownership correto
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Muda para usuário não-root
USER nextjs

EXPOSE 3000

# Health check para monitoramento
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
