# Build Stage
FROM node:22-alpine3.23 AS builder

WORKDIR /app

# Instalar dependências necessárias para compilação e Prisma
RUN apk upgrade --no-cache \
    && apk add --no-cache openssl python3 make g++

# Atualiza o npm embutido da imagem Node para corrigir CVEs em pacotes internos
# como tar, picomatch e sigstore reportados por scanners de container.
RUN npm install -g npm@12.0.2 \
    && npm cache clean --force

# Copiar arquivos essenciais para instalação de dependências (otimização de cache)
COPY package.json package-lock.json ./
COPY turbo.json ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
# Se houverem pacotes comuns:
# COPY packages/ ./packages/

# Instalar todas as dependências
RUN npm install

# Copiar o restante do código
COPY . .

# Gerar o cliente Prisma
RUN cd apps/server && npx prisma generate

# Fazer o build de todos os workspaces (Web e Server)
RUN npm run build

# Production Stage
FROM node:22-alpine3.23 AS runner

WORKDIR /app

# Dependências em runtime (Prisma e Ferramentas de Rede: Nmap, Ping, SNMP)
RUN apk upgrade --no-cache \
    && apk add --no-cache openssl nmap nmap-scripts iputils net-snmp net-snmp-tools

RUN npm install -g npm@12.0.2 \
    && npm cache clean --force

# Copiar configuração raiz
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node apps/server/package.json ./apps/server/
RUN npm ci --omit=dev --workspace=@irongrid/server --include-workspace-root

# Copiar backend
COPY --chown=node:node --from=builder /app/apps/server/package.json ./apps/server/
COPY --chown=node:node --from=builder /app/apps/server/dist ./apps/server/dist
COPY --chown=node:node --from=builder /app/apps/server/prisma ./apps/server/prisma
RUN cd apps/server && npx prisma generate \
    && rm -rf /root/.npm /home/node/.npm /usr/local/lib/node_modules/npm \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx /app/package-lock.json
COPY --chown=node:node --from=builder /app/apps/server/public ./apps/server/public

# Manuais operacionais servidos pelo backend em /manual
COPY --chown=node:node --from=builder /app/Manual ./Manual

# Copiar frontend (servido estaticamente pelo backend)
COPY --chown=node:node --from=builder /app/apps/web/dist ./apps/web/dist

# Copiar ferramentas auxiliares
COPY --chown=node:node --from=builder /app/tools ./tools

# Metadados da edicao empacotados dentro da imagem fechada
LABEL org.opencontainers.image.vendor="IronGrid"
LABEL io.irongrid.support="German Sachelaride <sachelaride@gmail.com>"
LABEL io.irongrid.donations="Contribua com o projeto - PIX 558252491-68 / sachelaride@gmail.com"
RUN mkdir -p /usr/local/share/.cache/netmon/.state \
    && printf '%s\n' '{"support":"German Sachelaride","email":"sachelaride@gmail.com","phone":"(67) 9.9859-9051","contribution":"Contribua com o projeto","pix":["558252491-68","sachelaride@gmail.com"]}' > /usr/local/share/.cache/netmon/.state/.runtime \
    && chmod 444 /usr/local/share/.cache/netmon/.state/.runtime


USER node

# Variáveis de ambiente
ENV NODE_ENV=production
ENV DEV_PORT=3001

EXPOSE 3001

WORKDIR /app/apps/server

# O comando inicializa as migrações (se houverem) e o servidor
CMD ["sh", "-c", "/app/node_modules/.bin/prisma db push --skip-generate && node prisma/bootstrap-admin.js && node dist/index.js"]
