#!/usr/bin/env bash
# Atalho para iniciar o perfil basico e exibir o status dos servicos.
set -euo pipefail

cd "$(dirname "$0")"

cat <<'EOF'
----------------------------------------------------
IronGrid - inicialização centralizada
----------------------------------------------------
Subindo perfil básico: app + Postgres + InfluxDB.
Use ./irongrid up:grafana para incluir Grafana.
Use ./irongrid up:full para incluir todos os serviços.
EOF

./irongrid up
./irongrid status
