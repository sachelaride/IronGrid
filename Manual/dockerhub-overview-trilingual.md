# IronGrid

Imagem oficial: [Docker Hub - sachelaride/irongrid-limited-369](https://hub.docker.com/r/sachelaride/irongrid-limited-369)

A tag `latest` corresponde à imagem completa publicada a partir do repositorio.

**Tutorial / Manual HTML:**

- Portugues: https://sachelaride.github.io/IronGrid/Manual/index.html
- English: https://sachelaride.github.io/IronGrid/Manual/index-en.html

---

## Idiomas / Languages

- [Portugues](#portugues)
- [English](#english)

---

## Portugues

Imagem Docker oficial da edicao completa do IronGrid.

- Imagem: `sachelaride/irongrid-limited-369:latest`
- Inclui frontend, backend, agentes para download e integrações do IronGrid

## Importante

O Docker Hub hospeda apenas a imagem da aplicacao. Para instalar em um servidor novo, voce precisa criar tambem um `docker-compose.yml` e um arquivo `.env`.

A forma mais facil e usar o pacote auxiliar de instalacao, que contem:

```text
.env.example
README_INSTALACAO.md
README_DOCKERHUB.md
docker-compose.yml
manage.sh
```

Um arquivo `.tar` nao e necessario quando a imagem vem do Docker Hub.

## Instalacao rapida com pacote auxiliar

No servidor Linux:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin openssl
sudo systemctl enable --now docker
```

Copie os arquivos auxiliares para o servidor, por exemplo:

```bash
sudo mkdir -p /opt/irongrid
sudo cp docker-compose.yml manage.sh .env.example README_INSTALACAO.md /opt/irongrid/
cd /opt/irongrid
chmod +x manage.sh
./manage.sh install
docker compose pull
./manage.sh up
```

Acesse:

```text
http://IP_DO_SERVIDOR:3001
```

## Instalacao manual sem pacote auxiliar

Crie uma pasta no servidor:

```bash
sudo mkdir -p /opt/irongrid
cd /opt/irongrid
```

Crie o arquivo `.env`:

```env
NODE_ENV=production
DEV_PORT=3001
DEBUG=false
IRONGRID_EDITION=full
IRONGRID_HTTP_PORT=3001
IRONGRID_SYSLOG_PORT=514
POSTGRES_USER=irongrid
POSTGRES_PASSWORD=TROQUE_POR_SENHA_FORTE
POSTGRES_DB=irongrid_db
DATABASE_URL=postgresql://irongrid:TROQUE_POR_SENHA_FORTE@db:5432/irongrid_db?schema=public
SYSLOG_DATABASE_URL=postgresql://irongrid:TROQUE_POR_SENHA_FORTE@db:5432/irongrid_db?schema=public
JWT_SECRET=TROQUE_POR_SEGREDO_FORTE_32_CHARS_OU_MAIS
AGENT_INGEST_TOKEN=TROQUE_POR_TOKEN_FORTE_16_CHARS_OU_MAIS
ALLOWED_ORIGIN=http://IP_DO_SERVIDOR:3001
INFLUX_URL=http://influxdb:8086
INFLUX_INIT_USERNAME=admin
INFLUX_INIT_PASSWORD=TROQUE_POR_SENHA_FORTE_INFLUX
INFLUX_ORG=irongrid
INFLUX_BUCKET=metrics
INFLUX_TOKEN=TROQUE_POR_TOKEN_FORTE_INFLUX
GRAFANA_PORT=3000
RUSTDESK_HBBS_PORT=21115
RUSTDESK_RENDEZVOUS_TCP_PORT=21116
RUSTDESK_RENDEZVOUS_UDP_PORT=21116
RUSTDESK_RELAY_PORT=21117
RUSTDESK_WEB_CLIENT_PORT=21118
RUSTDESK_RELAY_WEB_PORT=21119
```

Crie o arquivo `docker-compose.yml`:

```yaml
name: irongrid

services:
  app:
    image: sachelaride/irongrid-limited-369:latest
    container_name: irongrid-app
    restart: unless-stopped
    env_file:
      - .env
    ports:
      - "${IRONGRID_HTTP_PORT:-3001}:3001"
      - "${IRONGRID_SYSLOG_PORT:-514}:1514/udp"
    depends_on:
      db:
        condition: service_healthy
      influxdb:
        condition: service_healthy
    networks:
      - irongrid

  db:
    image: postgres:15-alpine
    container_name: irongrid-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-irongrid}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-irongrid_db}
    volumes:
      - irongrid-pg-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 10
    networks:
      - irongrid

  influxdb:
    image: influxdb:2.0
    container_name: irongrid-influxdb
    restart: unless-stopped
    environment:
      DOCKER_INFLUXDB_INIT_MODE: setup
      DOCKER_INFLUXDB_INIT_USERNAME: ${INFLUX_INIT_USERNAME:-admin}
      DOCKER_INFLUXDB_INIT_PASSWORD: ${INFLUX_INIT_PASSWORD}
      DOCKER_INFLUXDB_INIT_ORG: ${INFLUX_ORG:-irongrid}
      DOCKER_INFLUXDB_INIT_BUCKET: ${INFLUX_BUCKET:-metrics}
      DOCKER_INFLUXDB_INIT_ADMIN_TOKEN: ${INFLUX_TOKEN}
    volumes:
      - irongrid-influx-data:/var/lib/influxdb2
      - irongrid-influx-config:/etc/influxdb2
    healthcheck:
      test: ["CMD", "influx", "ping"]
      interval: 10s
      timeout: 5s
      retries: 10
    networks:
      - irongrid

  grafana:
    image: grafana/grafana:latest
    container_name: irongrid-grafana
    restart: unless-stopped
    profiles: ["grafana", "full"]
    environment:
      GF_SECURITY_ALLOW_EMBEDDING: "true"
      GF_AUTH_ANONYMOUS_ENABLED: "true"
      GF_AUTH_ANONYMOUS_ORG_ROLE: Admin
      GF_USERS_ALLOW_SIGN_UP: "false"
    ports:
      - "${GRAFANA_PORT:-3000}:3000"
    depends_on:
      influxdb:
        condition: service_healthy
    volumes:
      - irongrid-grafana-data:/var/lib/grafana
    networks:
      - irongrid

  rustdesk-hbbs:
    image: rustdesk/rustdesk-server:latest
    container_name: irongrid-hbbs
    restart: unless-stopped
    profiles: ["remote", "full"]
    command: hbbs -r rustdesk-hbbr:21117
    volumes:
      - irongrid-rustdesk-data:/root
    ports:
      - "${RUSTDESK_HBBS_PORT:-21115}:21115"
      - "${RUSTDESK_RENDEZVOUS_TCP_PORT:-21116}:21116/tcp"
      - "${RUSTDESK_RENDEZVOUS_UDP_PORT:-21116}:21116/udp"
      - "${RUSTDESK_WEB_CLIENT_PORT:-21118}:21118"
    depends_on:
      - rustdesk-hbbr
    networks:
      - irongrid

  rustdesk-hbbr:
    image: rustdesk/rustdesk-server:latest
    container_name: irongrid-hbbr
    restart: unless-stopped
    profiles: ["remote", "full"]
    command: hbbr
    volumes:
      - irongrid-rustdesk-data:/root
    ports:
      - "${RUSTDESK_RELAY_PORT:-21117}:21117"
      - "${RUSTDESK_RELAY_WEB_PORT:-21119}:21119"
    networks:
      - irongrid

networks:
  irongrid:
    name: irongrid-net

volumes:
  irongrid-pg-data:
  irongrid-influx-data:
  irongrid-influx-config:
  irongrid-grafana-data:
  irongrid-rustdesk-data:
```

Suba a stack:

```bash
docker compose pull
docker compose up -d
```

Para subir com Grafana e RustDesk:

```bash
docker compose --profile full up -d
```

## Chave publica RustDesk

Depois de subir com o perfil `remote` ou `full`:

```bash
docker cp irongrid-hbbs:/root/id_ed25519.pub ./id_ed25519.pub
cat ./id_ed25519.pub
```

Use essa chave na tela `Gestao de agentes`.

## Gerenciamento basico

```bash
docker compose ps
docker compose logs -f --tail=200 app
docker compose restart
docker compose down
```

## Suporte

German Sachelaride  
Email: sachelaride@gmail.com  
Fone: (67) 9.9859-9051

Doacoes PIX: 558252491-68 ou sachelaride@gmail.com

Canal bancario em dolar americano (USD) para contribuicoes internacionais:

```text
Banco Intermediario (Field 56):
JP Morgan Chase N.A.
SWIFT: CHASUS33
ABA: 021000021
Account: 360556937

Banco Final (Field 57):
Beneficiary Bank: Banco Inter SA
SWIFT: ITEMBRSP

Beneficiario (Field 59):
Beneficiary in Brazil: GERMAN DE OLIVEIRA SACHELARIDE
IBAN: BR2800416968000010011233613C1
```

## Modos de execucao

Instalacao essencial, sem Grafana e sem RustDesk:

```bash
docker compose up -d
```

Com Grafana:

```bash
docker compose --profile grafana up -d
```

Com RustDesk:

```bash
docker compose --profile remote up -d
```

Completo, com Grafana e RustDesk:

```bash
docker compose --profile full up -d
```

Portas RustDesk usadas no servidor:

```text
21115/tcp
21116/tcp
21116/udp
21117/tcp
21118/tcp
21119/tcp
```

Depois que o RustDesk estiver em execucao, veja a chave publica com:

```bash
docker cp irongrid-hbbs:/root/id_ed25519.pub ./id_ed25519.pub && cat ./id_ed25519.pub
```

---

## English

Official Docker image for the complete edition of IronGrid.

- Image: `sachelaride/irongrid-limited-369:latest`
- Includes frontend, backend, downloadable agents, and IronGrid integrations

## Important

Docker Hub hosts only the application image. To install IronGrid on a new server, you also need to create a `docker-compose.yml` file and a `.env` file.

The easiest method is to use the auxiliary installation package, which contains:

```text
.env.example
README_INSTALACAO.md
README_DOCKERHUB.md
docker-compose.yml
manage.sh
```

A `.tar` file is not required when the image is pulled from Docker Hub.

## Quick installation with auxiliary package

On the Linux server:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin openssl
sudo systemctl enable --now docker
```

Copy the auxiliary files to the server, for example:

```bash
sudo mkdir -p /opt/irongrid
sudo cp docker-compose.yml manage.sh .env.example README_INSTALACAO.md /opt/irongrid/
cd /opt/irongrid
chmod +x manage.sh
./manage.sh install
docker compose pull
./manage.sh up
```

Access:

```text
http://SERVER_IP:3001
```

## Manual installation without auxiliary package

Create a folder on the server:

```bash
sudo mkdir -p /opt/irongrid
cd /opt/irongrid
```

Create the `.env` file:

```env
NODE_ENV=production
DEV_PORT=3001
DEBUG=false
IRONGRID_EDITION=full
IRONGRID_HTTP_PORT=3001
IRONGRID_SYSLOG_PORT=514
POSTGRES_USER=irongrid
POSTGRES_PASSWORD=CHANGE_TO_STRONG_PASSWORD
POSTGRES_DB=irongrid_db
DATABASE_URL=postgresql://irongrid:CHANGE_TO_STRONG_PASSWORD@db:5432/irongrid_db?schema=public
SYSLOG_DATABASE_URL=postgresql://irongrid:CHANGE_TO_STRONG_PASSWORD@db:5432/irongrid_db?schema=public
JWT_SECRET=CHANGE_TO_STRONG_SECRET_32_CHARS_OR_MORE
AGENT_INGEST_TOKEN=CHANGE_TO_STRONG_TOKEN_16_CHARS_OR_MORE
ALLOWED_ORIGIN=http://SERVER_IP:3001
INFLUX_URL=http://influxdb:8086
INFLUX_INIT_USERNAME=admin
INFLUX_INIT_PASSWORD=CHANGE_TO_STRONG_INFLUX_PASSWORD
INFLUX_ORG=irongrid
INFLUX_BUCKET=metrics
INFLUX_TOKEN=CHANGE_TO_STRONG_INFLUX_TOKEN
GRAFANA_PORT=3000
RUSTDESK_HBBS_PORT=21115
RUSTDESK_RENDEZVOUS_TCP_PORT=21116
RUSTDESK_RENDEZVOUS_UDP_PORT=21116
RUSTDESK_RELAY_PORT=21117
RUSTDESK_WEB_CLIENT_PORT=21118
RUSTDESK_RELAY_WEB_PORT=21119
```

Create the `docker-compose.yml` file:

```yaml
name: irongrid

services:
  app:
    image: sachelaride/irongrid-limited-369:latest
    container_name: irongrid-app
    restart: unless-stopped
    env_file:
      - .env
    ports:
      - "${IRONGRID_HTTP_PORT:-3001}:3001"
      - "${IRONGRID_SYSLOG_PORT:-514}:1514/udp"
    depends_on:
      db:
        condition: service_healthy
      influxdb:
        condition: service_healthy
    networks:
      - irongrid

  db:
    image: postgres:15-alpine
    container_name: irongrid-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-irongrid}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-irongrid_db}
    volumes:
      - irongrid-pg-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 10
    networks:
      - irongrid

  influxdb:
    image: influxdb:2.0
    container_name: irongrid-influxdb
    restart: unless-stopped
    environment:
      DOCKER_INFLUXDB_INIT_MODE: setup
      DOCKER_INFLUXDB_INIT_USERNAME: ${INFLUX_INIT_USERNAME:-admin}
      DOCKER_INFLUXDB_INIT_PASSWORD: ${INFLUX_INIT_PASSWORD}
      DOCKER_INFLUXDB_INIT_ORG: ${INFLUX_ORG:-irongrid}
      DOCKER_INFLUXDB_INIT_BUCKET: ${INFLUX_BUCKET:-metrics}
      DOCKER_INFLUXDB_INIT_ADMIN_TOKEN: ${INFLUX_TOKEN}
    volumes:
      - irongrid-influx-data:/var/lib/influxdb2
      - irongrid-influx-config:/etc/influxdb2
    healthcheck:
      test: ["CMD", "influx", "ping"]
      interval: 10s
      timeout: 5s
      retries: 10
    networks:
      - irongrid

  grafana:
    image: grafana/grafana:latest
    container_name: irongrid-grafana
    restart: unless-stopped
    profiles: ["grafana", "full"]
    environment:
      GF_SECURITY_ALLOW_EMBEDDING: "true"
      GF_AUTH_ANONYMOUS_ENABLED: "true"
      GF_AUTH_ANONYMOUS_ORG_ROLE: Admin
      GF_USERS_ALLOW_SIGN_UP: "false"
    ports:
      - "${GRAFANA_PORT:-3000}:3000"
    depends_on:
      influxdb:
        condition: service_healthy
    volumes:
      - irongrid-grafana-data:/var/lib/grafana
    networks:
      - irongrid

  rustdesk-hbbs:
    image: rustdesk/rustdesk-server:latest
    container_name: irongrid-hbbs
    restart: unless-stopped
    profiles: ["remote", "full"]
    command: hbbs -r rustdesk-hbbr:21117
    volumes:
      - irongrid-rustdesk-data:/root
    ports:
      - "${RUSTDESK_HBBS_PORT:-21115}:21115"
      - "${RUSTDESK_RENDEZVOUS_TCP_PORT:-21116}:21116/tcp"
      - "${RUSTDESK_RENDEZVOUS_UDP_PORT:-21116}:21116/udp"
      - "${RUSTDESK_WEB_CLIENT_PORT:-21118}:21118"
    depends_on:
      - rustdesk-hbbr
    networks:
      - irongrid

  rustdesk-hbbr:
    image: rustdesk/rustdesk-server:latest
    container_name: irongrid-hbbr
    restart: unless-stopped
    profiles: ["remote", "full"]
    command: hbbr
    volumes:
      - irongrid-rustdesk-data:/root
    ports:
      - "${RUSTDESK_RELAY_PORT:-21117}:21117"
      - "${RUSTDESK_RELAY_WEB_PORT:-21119}:21119"
    networks:
      - irongrid

networks:
  irongrid:
    name: irongrid-net

volumes:
  irongrid-pg-data:
  irongrid-influx-data:
  irongrid-influx-config:
  irongrid-grafana-data:
  irongrid-rustdesk-data:
```

Start the stack:

```bash
docker compose pull
docker compose up -d
```

To start with Grafana and RustDesk:

```bash
docker compose --profile full up -d
```

## RustDesk public key

After starting with the `remote` or `full` profile:

```bash
docker cp irongrid-hbbs:/root/id_ed25519.pub ./id_ed25519.pub
cat ./id_ed25519.pub
```

Use this key in the `Agent Management` screen.

## Basic management

```bash
docker compose ps
docker compose logs -f --tail=200 app
docker compose restart
docker compose down
```

## Support

German Sachelaride  
Email: sachelaride@gmail.com  
Phone: +55 67 99859-9051

PIX donations: 558252491-68 or sachelaride@gmail.com

Bank channel in US dollars (USD) for international contributions:

```text
Intermediary Bank (Field 56):
JP Morgan Chase N.A.
SWIFT: CHASUS33
ABA: 021000021
Account: 360556937

Final Bank (Field 57):
Beneficiary Bank: Banco Inter SA
SWIFT: ITEMBRSP

Beneficiary (Field 59):
Beneficiary in Brazil: GERMAN DE OLIVEIRA SACHELARIDE
IBAN: BR2800416968000010011233613C1
```

## Execution modes

Essential installation, without Grafana and without RustDesk:

```bash
docker compose up -d
```

With Grafana:

```bash
docker compose --profile grafana up -d
```

With RustDesk:

```bash
docker compose --profile remote up -d
```

Complete mode, with Grafana and RustDesk:

```bash
docker compose --profile full up -d
```

RustDesk ports used on the server:

```text
21115/tcp
21116/tcp
21116/udp
21117/tcp
21118/tcp
21119/tcp
```

After RustDesk is running, view the public key with:

```bash
docker cp irongrid-hbbs:/root/id_ed25519.pub ./id_ed25519.pub && cat ./id_ed25519.pub
```
