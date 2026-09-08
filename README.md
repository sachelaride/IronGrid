# IronGrid

Sistema de monitoramento e inventario de infraestrutura, distribuido com
Docker Compose e com fontes para execucao direta em Linux.

## Projeto aberto

O IronGrid e um projeto totalmente aberto e distribuido sob a GNU GPLv3 ou
posterior. Voce pode usar, estudar, modificar e redistribuir o codigo conforme
os termos da licenca. A unica contribuicao financeira solicitada e voluntaria:
ela ajuda a manter a infraestrutura, corrigir problemas e desenvolver novas
melhorias. Relatos, ideias, testes e feedback dos usuarios sao igualmente
essenciais para orientar o projeto.

Consulte [CONTRIBUTING.md](CONTRIBUTING.md) para sugerir mudancas com issue,
Pull Request e aprovacao dos mantenedores.

## Imagem Docker oficial

As imagens publicadas estao disponiveis no
[Docker Hub do IronGrid](https://hub.docker.com/repository/docker/sachelaride/irongrid-limited-369/general):

```text
sachelaride/irongrid-limited-369:latest
```

Para baixar a imagem diretamente:

```bash
docker pull sachelaride/irongrid-limited-369:latest
```

O `docker-compose.yml` usa essa imagem por padrao. O build local continua
disponivel para quem quiser auditar ou modificar o codigo-fonte.

## Manuais e tutoriais

Os manuais estao disponiveis na pasta [Manual](Manual/):

- [Manual Docker Hub multilíngue](Manual/dockerhub-overview-trilingual.md)
- [Manual em português](Manual/index.html)
- [Manual em inglês](Manual/index-en.html)
- [Manual em espanhol](Manual/index-es.html)
- [Manual em francês](Manual/index-fr.html)
- [Manual em alemão](Manual/index-de.html)
- [Instalação offline](MANUAL_INSTALACAO_OFFLINE.md)

Quando o repositorio estiver publicado no GitHub Pages, as paginas HTML tambem
podem ser acessadas diretamente em `https://USUARIO.github.io/REPOSITORIO/Manual/`.

## Historico de downloads e estatisticas

Para manter um historico publico e auditavel, publique cada versao como uma
**Release** no GitHub e anexe os pacotes Linux, checksums e documentacao como
assets da release. A pagina de cada release mostra a quantidade de downloads
por asset ao longo do tempo.

Para a estatistica geral do repositorio, use a aba **Insights** do GitHub:

- **Traffic**: visualizacoes, visitantes unicos e clones do repositorio;
- **Releases**: downloads acumulados por arquivo publicado;
- **Contributors**: pessoas que contribuiram com codigo e documentacao;
- **Pulse**: resumo de issues e Pull Requests recentes.

Assim, o historico de downloads fica associado a versoes especificas e as
estatisticas gerais permanecem visiveis para a comunidade, sem coletar dados
pessoais dos usuarios no IronGrid.

### Publicar uma versao

```bash
git tag -a v12.0.0 -m "IronGrid v12.0.0"
git push origin v12.0.0
```

Depois, crie a Release correspondente no GitHub, anexe os arquivos gerados e
registre no texto da release as mudancas, correcoes, requisitos e hashes
SHA-256. Nao anexe `.env`, bancos, backups ou chaves.

## Licenca

Este projeto e distribuido sob a **GNU General Public License, versao 3 ou
posterior (GPLv3-or-later)**. Consulte o arquivo [LICENSE](LICENSE) para os
termos. A GPLv3 permite usar, estudar, modificar e redistribuir o programa,
desde que as condicoes da licenca sejam preservadas, incluindo a oferta do
codigo-fonte correspondente quando aplicavel.

As bibliotecas, imagens Docker e demais componentes de terceiros permanecem
sujeitos as licencas respectivas. Verifique essas licencas antes de criar uma
redistribuicao do conjunto completo.

## Distribuicao segura

O arquivo `.env.docker` e local e nao deve ser publicado. Para uma instalacao
nova, copie o modelo e preencha os segredos da propria instancia:

```bash
cp .env.docker.example .env.docker
chmod 600 .env.docker
```

Troque `POSTGRES_PASSWORD`, `INFLUX_INIT_PASSWORD`, `INFLUX_TOKEN`,
`JWT_SECRET` e `AGENT_INGEST_TOKEN` por valores exclusivos. Nao reutilize os
valores que possam ter existido neste ambiente.

## Instalacao com Docker

Pre-requisitos: Docker Engine com Compose V2 e portas livres conforme o
`.env.docker`.

```bash
docker compose --env-file .env.docker up -d --build
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f irongrid
```

Abra `http://localhost:${IRONGRID_HTTP_PORT}` no navegador. Para parar sem
remover os dados persistidos:

```bash
docker compose --env-file .env.docker down
```

Para detalhes de instalacao offline, consulte
`MANUAL_INSTALACAO_OFFLINE.md`. Os pacotes offline antigos foram movidos para
`desnecessarios/` e essa pasta nao faz parte da distribuicao fonte do Git.

## Execucao direta no Linux

Pre-requisitos: Node.js 18 ou superior, npm, PostgreSQL e InfluxDB acessiveis
no host. Instale as dependencias e configure os ambientes locais:

```bash
npm ci
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
```

Edite os dois arquivos locais com os dados da sua infraestrutura. Depois,
compile todas as aplicacoes:

```bash
npm run build
```

O servidor pode ser iniciado pelo script de operacao existente:

```bash
./start_irongrid.sh
```

Confirme as variaveis aceitas pelo script e os servicos disponiveis antes de
usar em producao. O agente Linux e compilado com `npm run build -w
irongrid-agent` e pode ser instalado separadamente conforme a politica da sua
distribuicao.

## Publicar no Git

Inicialize o repositorio e revise os arquivos antes de adicionar qualquer
remoto:

```bash
git init
git status --short --ignored
git add .
git status --short
git commit -m "Prepare IronGrid source distribution"
git remote add origin URL_DO_REPOSITORIO
git push -u origin main
```

O `.gitignore` exclui ambientes, dependencias, saidas de build, bancos,
backups, pacotes compactados e chaves privadas. Ainda assim, revise o diff e
use o recurso de secret scanning do provedor Git antes de tornar o repositorio
publico.
# IronGrid Mission Control - Manual do Sistema

Bem-vindo ao **IronGrid Mission Control**, uma plataforma completa de NOC (Network Operations Center), Telemetria, Gestão de Inventário (ITAM), Helpdesk (Ticketing) e Manutenção Preventiva.

Este documento serve como a referência primária (Manual do Sistema) abrangendo arquitetura, pré-requisitos, processos de deploy de servidores e agentes, integração e solução de problemas.

---

## 1. Visão Geral do Sistema

O IronGrid é projetado para consolidar as operações críticas de TI de uma empresa corporativa através de um único painel de controle (Mission Control).

### Principais Módulos
- **NOC & Telemetria:** Monitoramento passivo/ativo, gráficos em tempo real (Grafana), e latência usando InfluxDB.
- **Inventário (ITAM):** Gestão de dispositivos (roteadores, switches, endpoints), interfaces de rede e localização.
- **Ticketing / Suporte:** Sistema de chamados integrado vinculado aos usuários e departamentos.
- **Manutenção Preventiva:** Agendamento de paradas e janelas de manutenção, vinculadas a dispositivos.
- **Gestão de Alertas:** Matriz de Risco, encaminhamento via Múltiplos Canais (Telegram, Slack, Email, Discord).
- **Acesso Remoto:** Integração transparente com RustDesk para acesso não-assistido aos Endpoints.

---

## 2. Arquitetura e Contêineres

O sistema adota uma arquitetura em microsserviços provisionados via Docker Compose, englobando a stack:

- **Frontend (Web):** React com Vite, estilização em CSS "Cyber-Dark" e rotas via React Router.
- **Backend (Server):** Node.js 20, Express, tRPC para tipagem ponta a ponta com o frontend.
- **Banco de Dados (Relacional):** PostgreSQL 15 (Armazena usuários, tickets, logs, estrutura de rede).
- **Banco de Dados (Time-Series):** InfluxDB 2.0 (Armazena as métricas efêmeras, tráfego de interface, latência).
- **Acesso Remoto:** RustDesk Server (Serviços `hbbs` e `hbbr`) para tunelamento P2P.
- **Data Visualization:** Grafana (Consultas no InfluxDB geradas de forma dinâmica pelo IronGrid).

---

## 3. Guia de Instalação do Servidor (Docker)

> [!IMPORTANT]
> O IronGrid necessita de ferramentas de descoberta de rede para varreduras em profundidade. A imagem Docker final (`node:20-alpine`) já engloba o pacote de ferramentas como `nmap`, `iputils` e `net-snmp` para garantir que as buscas de rede funcionem perfeitamente.

### Pré-requisitos
- Host Linux (Debian/Ubuntu/Alpine).
- `docker` e `docker-compose` instalados.
- Portas liberadas: `3001` (Backend/Frontend), `3000` (Grafana), `21115-21119` (RustDesk).

### Passo 1: Configurar Variáveis
Na raiz do projeto (`/opt/IronGrid/Netwall`), configure o arquivo `.env.docker`:

```env
# Banco de Dados
DATABASE_URL="postgresql://irongrid:TROQUE_POR_SENHA_FORTE@db:5432/irongrid_db?schema=public"

# Telemetria
INFLUX_URL="http://influxdb:8086"
INFLUX_TOKEN="TROQUE_POR_TOKEN_ALEATORIO"
INFLUX_ORG="irongrid"
INFLUX_BUCKET="metrics"

# IronGrid / Grafana
NODE_ENV="production"
DEV_PORT="3001"
GRAFANA_URL="http://grafana:3000"
JWT_SECRET="TROQUE_POR_SEGREDO_ALEATORIO"
```

### Passo 2: Subir o Ambiente
Inicie a stack e force o build da aplicação:
```bash
docker compose up -d --build
```
Aguarde alguns minutos. O processo irá compilar o Backend, Frontend (cópia estática) e provisionar o banco de dados.

### Passo 3: Criação do Usuário Administrador Inicial
Caso seja a primeira instalação, o banco estará vazio e a tela de login retornará *Credenciais Inválidas*. Crie o usuário `admin` padrão acessando o console do contêiner e executando o script Prisma:

```bash
docker exec irongrid-app node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
  const password = await bcrypt.hash('irongrid-admin-password', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password, role: 'ADMIN' },
    create: { username: 'admin', password, name: 'Administrador do Sistema', role: 'ADMIN' }
  });
  console.log('Admin criado/resetado com sucesso!');
}
main().catch(console.error).finally(() => prisma.\$disconnect());
"
```
**Credenciais Padrão:**
- Usuário: `admin`
- Senha: `irongrid-admin-password`

*(Mude esta senha imediatamente após o primeiro login!)*

---

## 4. Guia do Agente e RustDesk (Acesso Remoto)

O acesso remoto é provido pelo RustDesk, que está perfeitamente embutido no Agente IronGrid. O agente já está compilado e pronto para uso direto pelo sistema.

### Como Instalar nos Clientes
A forma mais simples e recomendada de instalar o agente nos endpoints (computadores clientes) é através do próprio painel do IronGrid:

1. Acesse o IronGrid Mission Control e vá até a aba **Gestão de Agentes**.
2. Baixe o instalador do agente para Windows. Este instalador corporativo já possui o RustDesk integrado de forma otimizada.
3. Execute o instalador no cliente. Durante o processo de instalação gráfica, será solicitado o **IP do Servidor** IronGrid.
4. Preencha o IP do seu servidor. O agente se configurará automaticamente para apontar a telemetria e o túnel RustDesk para este endereço.

### Obtendo a Chave Pública (Avançado)
Caso precise da chave pública do RustDesk para algum diagnóstico ou instalação customizada profunda, o servidor RustDesk (`hbbs`) gera a chave de criptografia no primeiro boot. 
Para extraí-la através do Docker (burlando a imagem mínima do RustDesk), use o comando:

```bash
docker run --rm -v netwall_irongrid-rustdesk-data:/root alpine:3.18 cat /root/id_ed25519.pub
```
A string resultante (ex: `V6eYac0mBEdotGoD90KUsMju+utFrD4bziRS+dKxZVs=`) é a sua chave.

---

## 5. Gerenciamento e Integração do Grafana

> [!TIP]
> Você **não** precisa importar arquivos JSON manualmente para ver gráficos no Grafana!

A arquitetura do IronGrid usa uma API (`grafanaRouter.ts`) para falar diretamente com o Grafana via rede do Docker (`http://grafana:3000`).

**Fluxo de Funcionamento:**
1. No Mission Control, você vai até a aba de Integrações/Grafana e insere um **Token de Serviço/Admin** gerado dentro do Grafana.
2. O IronGrid acessa os dispositivos que possuem monitoramento ativo.
3. Ele compila um *Dashboard JSON* dinâmico com gráficos segmentados por interface de rede e os envia via API do Grafana.
4. A interface web do IronGrid utiliza *Iframes* invisíveis para renderizar os painéis do Grafana de volta para dentro do Mission Control perfeitamente tematizados com o "Cyber-Dark".

---

## 6. Solução de Problemas (Troubleshooting)

### Logs do Sistema
Se algo não se comportar como esperado (ex: e-mails falhando, chamados não finalizados), acompanhe os logs em tempo real:
```bash
# Ver os logs do backend do IronGrid
docker logs irongrid-app -f --tail 100

# Ver os logs do Banco de Dados
docker logs irongrid-db -f
```

### Erros de Compilação NPM/TypeScript
Se houver falha de dependências durante a criação da Imagem (`docker compose build`), certifique-se de que nenhum pacote importado no Typescript está faltando no `package.json` (`npm install <pacote> --save`).

### Descoberta de Rede não encontra IPs
- **Causa 1:** O firewall do dispositivo alvo (Windows/Linux) não responde a Ping (`ICMP Echo Request`) nem SNMP.
- **Causa 2:** SNMP não está instalado ou o IP do servidor Docker não está na lista de "Permitted Managers" na aba Segurança do serviço SNMP do Windows.
- **Causa 3:** O Agente/Servidor Node (`nmap`/`iputils`) não consegue rotear pacotes fora do range do Docker. Revise o roteamento de saída da interface de rede do seu servidor Linux Host.
