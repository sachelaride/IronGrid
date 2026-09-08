const fs = require('fs');
const path = require('path');

/**
 * 🛠️ CONFIGURAÇÃO DO SEU MONITORAMENTO
 */
let config = {
    title: "IronGrid - Dashboard Personalizado",
    devices: [
        {
            name: "Switch Core - 01",
            ip: "192.168.1.10",
            interfaces: ["GigabitEthernet1/0/1", "GigabitEthernet1/0/2", "TenGigabitEthernet1/1/1"]
        }
    ]
};

// Procura config em locais possíveis (pasta local ou pasta temporária do sistema)
const localConfigPath = path.join(__dirname, 'gen_dashboard_config.json');
const tempConfigPath = path.join(require('os').tmpdir(), 'irongrid_gen_config.json');
const externalConfigPath = fs.existsSync(tempConfigPath) ? tempConfigPath : localConfigPath;

if (fs.existsSync(externalConfigPath)) {
    try {
        const externalConfig = JSON.parse(fs.readFileSync(externalConfigPath, 'utf-8'));
        config = { ...config, ...externalConfig };
        console.log(`📂 Carregando configuração via ${externalConfigPath === tempConfigPath ? 'Sistema (Temp)' : 'Web'}...`);
    } catch (e) {
        console.error("Erro ao ler config externa:", e);
    }
}


// Template base do Dashboard
const dashboard = {
    "annotations": { "list": [] },
    "editable": true,
    "fiscalYearStartMonth": 0,
    "graphTooltip": 1,
    "panels": [],
    "refresh": "10s",
    "schemaVersion": 38,
    "style": "dark",
    "tags": ["IronGrid", "Automated"],
    "time": { "from": "now-1h", "to": "now" },
    "title": config.title,
    "uid": config.title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    "version": 1
};

let yPos = 0;

config.devices.forEach((dev, devIdx) => {
    // 1. Linha (Row) para o Dispositivo
    dashboard.panels.push({
        "collapsed": false,
        "gridPos": { "h": 1, "w": 24, "x": 0, "y": yPos++ },
        "id": (devIdx + 1) * 100,
        "title": `🖥️ Dispositivo: ${dev.name} (${dev.ip})`,
        "type": "row"
    });

    // 2. Painel de Latência para este dispositivo
    dashboard.panels.push({
        "datasource": { "type": "influxdb", "uid": config.datasourceUid || "IronGrid-InfluxDB" },
        "fieldConfig": {
            "defaults": { "unit": "ms", "color": { "mode": "thresholds" }, "thresholds": { "steps": [{ "color": "green", "value": null }, { "color": "red", "value": 150 }] } }
        },
        "gridPos": { "h": 4, "w": 24, "x": 0, "y": yPos++ },
        "id": (devIdx + 1) * 100 + 1,
        "options": { "textMode": "value_and_name", "reduceOptions": { "calcs": ["lastNotNull"] } },
        "targets": [
            {
                "query": `from(bucket: "metrics") |> range(start: v.timeRangeStart) |> filter(fn: (r) => r["_measurement"] == "device_latency") |> filter(fn: (r) => r["device"] == "${dev.ip}") |> last()`,
                "refId": "A"
            }
        ],
        "fieldConfig": {
            "defaults": {
                "unit": "ms",
                "displayName": `${dev.name} (${dev.ip})`,
                "color": { "mode": "thresholds" },
                "thresholds": { "steps": [{ "color": "green", "value": null }, { "color": "red", "value": 150 }] }
            }
        },
        "title": `Latência Atual - ${dev.name}`,
        "type": "stat"
    });

    // 3. Gráficos de Tráfego para CADA interface selecionada
    dev.interfaces.forEach((iface, ifIdx) => {
        dashboard.panels.push({
            "datasource": { "type": "influxdb", "uid": config.datasourceUid || "IronGrid-InfluxDB" },
            "fieldConfig": {
                "defaults": { 
                    "unit": "bps", 
                    "color": { "mode": "palette-classic" }, 
                    "custom": { "drawStyle": "line", "fillOpacity": 10, "lineInterpolation": "smooth" },
                    "min": 0
                },
                "overrides": [
                    {
                        "matcher": { "id": "byName", "options": "ifInOctets" },
                        "properties": [{ "id": "displayName", "value": "Download" }]
                    },
                    {
                        "matcher": { "id": "byName", "options": "ifOutOctets" },
                        "properties": [{ "id": "displayName", "value": "Upload" }]
                    }
                ]
            },
            "gridPos": { "h": 8, "w": 12, "x": (ifIdx % 2 === 0 ? 0 : 12), "y": yPos + Math.floor(ifIdx / 2) * 8 },
            "id": (devIdx + 1) * 100 + 10 + ifIdx,
            "options": { "legend": { "displayMode": "table", "placement": "bottom" } },
            "targets": [
                {
                    "query": `from(bucket: "metrics")\n  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\n  |> filter(fn: (r) => r["_measurement"] == \"interface_traffic\")\n  |> filter(fn: (r) => r["device"] == \"${dev.ip}\")\n  |> filter(fn: (r) => r["interface"] == \"${iface}\")\n  |> filter(fn: (r) => r["_field"] == \"ifInOctets\" or r["_field"] == \"ifOutOctets\")\n  |> derivative(unit: 1s, nonNegative: true)\n  |> map(fn: (r) => ({ r with _value: r._value * 8.0 }))\n  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\n  |> yield(name: "mean")`,
                    "refId": "A"
                }
            ],
            "title": `Tráfego: ${iface} [${dev.name}]`,
            "type": "timeseries"
        });
    });

    // Atualiza yPos para o próximo dispositivo (8h por linha de gráficos, 2 gráficos por linha)
    yPos += Math.ceil(dev.interfaces.length / 2) * 8;
});

const outputPath = path.join(require('os').tmpdir(), 'irongrid_gen_dashboard.json');
fs.writeFileSync(outputPath, JSON.stringify(dashboard, null, 2));

console.log(`✅ Dashboard gerado com sucesso em: ${outputPath}`);
console.log(`📊 Dispositivos: ${config.devices.length} | Interfaces: ${config.devices.reduce((acc, d) => acc + d.interfaces.length, 0)}`);
