# Iron Grid - Manual de Instalação e Atualização (Versão Offline / Docker Container)

Este documento detalha o processo para instalar e atualizar a versão "Full" do Iron Grid rodando via **Docker Container**, projetado especificamente para servidores locais ou ambientes off-line (sem acesso à internet ou ao Docker Hub).

---

## 1. Requisitos do Sistema

- **Sistema Operacional:** Linux (Ubuntu 20.04/22.04+, Debian 11+, CentOS/RHEL 8+)
- **Dependências Mínimas:**
  - `docker` instalado no servidor
  - `docker-compose` (ou plugin docker compose)
  - Espaço em disco suficiente para carregar as imagens exportadas.

---

## 2. Instalação Inicial (Do Zero - Offline)

Siga estes passos se você está instalando o Iron Grid em um servidor limpo sem acesso à internet.

### Passo 2.1: Transferir a Imagem e Arquivos
Transfira para o seu servidor off-line os seguintes arquivos:
1. O arquivo compactado da imagem Docker (ex: `irongrid-full-offline-12_370.tar.gz`).
2. O arquivo `docker-compose.yml`.
3. O arquivo de configuração `.env` (ou `.env.example`).

Coloque todos em um diretório, por exemplo, `/opt/IronGrid/Netwall`.

### Passo 2.2: Carregar a Imagem Docker (Load)
No servidor off-line, navegue até a pasta onde os arquivos foram colocados e carregue a imagem importada localmente no Docker:
```bash
cd /opt/IronGrid/Netwall
# Descompacta o arquivo (ele vai virar um .tar)
gunzip irongrid-full-offline-12_370.tar.gz

# Tenta carregar o .tar
docker load -i irongrid-full-offline-12_370.tar
```

### Passo 2.3: Configurar o Arquivo `.env`
Se você ainda não tem o arquivo `.env`, crie um a partir do exemplo e configure as variáveis de ambiente, especialmente a conexão com o banco de dados (que pode estar rodando em outro container no mesmo `docker-compose.yml` ou ser externo):
```env
DATABASE_URL="postgresql://user:password@db:5432/irongrid_db"
PORT=3333
```

### Passo 2.4: Inicializar os Containers
Certifique-se de que o seu arquivo `docker-compose.yml` está apontando para a imagem exata que você carregou (ex: `image: irongrid:12_370`).
Suba a aplicação em background:
```bash
docker-compose up -d
```

### Passo 2.5: Executar as Migrações de Banco de Dados
Na primeira vez que rodar, pode ser necessário criar as tabelas no banco de dados. Execute a migração por dentro do container principal (assumindo que o serviço se chama `irongrid-app` no seu docker-compose):
```bash
docker-compose exec irongrid-app npx prisma migrate deploy
```

---

## 3. Atualização de Versão (Upgrade Offline)

Se você já possui o Iron Grid rodando no Docker e recebeu uma nova versão (ex: `irongrid-full-offline-12_370.tar.gz`).

### Passo 3.1: Transferir a Nova Imagem
Transfira o novo arquivo `.tar.gz` da imagem Docker para o servidor off-line (`/opt/IronGrid/Netwall`).

### Passo 3.2: Fazer Backup (Recomendado)
Sempre faça backup do banco de dados antes de realizar um upgrade!
```bash
docker-compose exec db pg_dump -U user irongrid_db > backup_irongrid_$(date +%Y%m%d).sql
```

### Passo 3.3: Carregar a Nova Imagem
```bash
# Descompacta o arquivo (ele vai virar um .tar)
gunzip irongrid-full-offline-12_370.tar.gz

# Tenta carregar novamente o .tar
docker load -i irongrid-full-offline-12_370.tar
```

### Passo 3.4: Atualizar o `docker-compose.yml`
Abra o seu arquivo `docker-compose.yml` e altere a tag da imagem para a versão mais recente que acabou de carregar:
```yaml
services:
  irongrid-app:
    image: irongrid:12_370  # <--- Altere para a tag da nova imagem
```

### Passo 3.5: Recriar os Containers
Para aplicar a nova versão, basta pedir ao compose para recriar o container modificado. Isso irá parar a versão antiga e subir a nova com o mesmo `.env`:
```bash
docker-compose up -d
```

### Passo 3.6: Aplicar Migrações do Banco (se necessário)
Após o container novo subir, execute o Prisma Migrate para garantir que novas tabelas ou colunas sejam criadas:
```bash
docker-compose exec irongrid-app npx prisma migrate deploy
```

*(Opcional) Limpar a imagem antiga para liberar espaço:*
```bash
docker image prune -f
```

---

## 4. Verificação de Saúde (Health Check)
Acesse a aplicação no navegador via IP e porta mapeada do container.
Navegue até a seção de **Discovery Control** para testar as novas métricas e cores customizadas, além de validar os scans em `/16` funcionando corretamente na nova versão do container.
