#!/bin/bash
set -e
SERVER_IP="${1:-${IRONGRID_SERVERIP:-}}"
COMMUNITY="${2:-${IRONGRID_COMMUNITY:-IronGrid}}"
SERVER_PORT="${3:-${IRONGRID_SERVERPORT:-3001}}"
RUSTDESK_HOST="${4:-${RUSTDESK_SERVER:-}}"
RUSTDESK_KEY="${5:-${RUSTDESK_KEY:-}}"
RUSTDESK_RELAY="${6:-${RUSTDESK_RELAY:-}}"
[ -z "$SERVER_IP" ] && read -p "IP ou hostname do servidor IronGrid: " SERVER_IP
[ -z "$SERVER_PORT" ] && read -p "Porta web IronGrid [3001]: " SERVER_PORT
SERVER_PORT=${SERVER_PORT:-3001}
[ -z "$COMMUNITY" ] && read -p "Comunidade SNMP [IronGrid]: " COMMUNITY
COMMUNITY=${COMMUNITY:-IronGrid}
[ -z "$RUSTDESK_HOST" ] && read -p "Servidor RustDesk HBBS/rendezvous [$SERVER_IP]: " RUSTDESK_HOST
RUSTDESK_HOST=${RUSTDESK_HOST:-$SERVER_IP}
[ -z "$RUSTDESK_RELAY" ] && read -p "Servidor RustDesk relay [$RUSTDESK_HOST:21117]: " RUSTDESK_RELAY
RUSTDESK_RELAY=${RUSTDESK_RELAY:-$RUSTDESK_HOST:21117}
[ -z "$RUSTDESK_KEY" ] && read -p "Chave publica RustDesk HBBS (Enter para deixar vazio): " RUSTDESK_KEY

echo "IronGrid: http://$SERVER_IP:$SERVER_PORT"
echo "SNMP: $COMMUNITY"
echo "RustDesk rendezvous: $RUSTDESK_HOST"
echo "RustDesk relay: $RUSTDESK_RELAY"
if [[ $EUID -ne 0 ]]; then echo "Execute como root/sudo."; exit 1; fi
if command -v apt-get >/dev/null 2>&1; then apt-get update && apt-get install -y snmpd; elif command -v yum >/dev/null 2>&1; then yum install -y net-snmp; fi
CONF_FILE="/etc/snmp/snmpd.conf"
[ -f "$CONF_FILE" ] && mv "$CONF_FILE" "${CONF_FILE}.bak.$(date +%Y%m%d%H%M%S)"
cat > "$CONF_FILE" <<EOF
agentAddress udp:161
rocommunity $COMMUNITY $SERVER_IP
sysLocation "Local"
sysContact "Admin"
EOF
systemctl restart snmpd || true
systemctl enable snmpd || true
mkdir -p /opt/irongrid-agent/rustdesk
cat > /opt/irongrid-agent/config.json <<EOF
{
  "serverUrl": "http://$SERVER_IP:$SERVER_PORT",
  "agentId": "$(hostname)",
  "rustdeskHost": "$RUSTDESK_HOST",
  "rustdeskRelay": "$RUSTDESK_RELAY",
  "rustdeskKey": "$RUSTDESK_KEY"
}
EOF
cat > /opt/irongrid-agent/rustdesk/RustDesk2.toml <<EOF
rendezvous_server = '$RUSTDESK_HOST'
relay_server = '$RUSTDESK_RELAY'
key = '$RUSTDESK_KEY'
EOF
chmod 600 /opt/irongrid-agent/config.json /opt/irongrid-agent/rustdesk/RustDesk2.toml || true
echo "OK: agente Linux configurado."
