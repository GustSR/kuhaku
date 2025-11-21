# Stage 1: Dependencies
FROM node:20.18.1-alpine3.20 AS deps

WORKDIR /app

# Copia apenas arquivos de dependências
COPY package*.json ./

# Instala apenas dependências de produção (usa install pois package-lock.json não está commitado)
RUN npm install --omit=dev --ignore-scripts

# Stage 2: Production
FROM node:20.18.1-alpine3.20 AS runner

WORKDIR /app

# Adiciona labels para metadata
LABEL maintainer="Kuhaku Team"
LABEL version="1.0.0"
LABEL description="Kuhaku SaaS Backend Service"

# Define ambiente de produção
ENV NODE_ENV=production

# Cria grupo e usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copia dependências de produção
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copia apenas o código fonte necessário
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs src ./src

# Muda para usuário não-root
USER nodejs

EXPOSE 3333

# Health check para monitoramento
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3333/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "src/server.js"]
