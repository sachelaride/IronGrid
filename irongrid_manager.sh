#!/usr/bin/env bash
# Menu interativo para operar os perfis Docker do IronGrid.
set -euo pipefail

cd "$(dirname "$0")"

while true; do
  clear
  cat <<'EOF'
====================================================
          IRONGRID - PAINEL DE ADMINISTRACAO
====================================================
1) Subir basico (app + Postgres + InfluxDB)
2) Subir com Grafana
3) Subir com RustDesk
4) Subir completo
5) Status dos containers
6) Logs da aplicacao
7) Validar configuracao Docker
8) Parar servicos
q) Sair
----------------------------------------------------
EOF
  read -r -p "Escolha uma opcao: " opt
  case "$opt" in
    1) ./irongrid up ;;
    2) ./irongrid up:grafana ;;
    3) ./irongrid up:remote ;;
    4) ./irongrid up:full ;;
    5) ./irongrid status ;;
    6) ./irongrid logs app ;;
    7) ./irongrid config >/tmp/irongrid-compose-config.yml && echo "Config OK: /tmp/irongrid-compose-config.yml" ;;
    8) ./irongrid down ;;
    q|Q) exit 0 ;;
    *) echo "Opcao invalida" ;;
  esac
  echo
  read -r -p "Pressione Enter para continuar..." _
done
