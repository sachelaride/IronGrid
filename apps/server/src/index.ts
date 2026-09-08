import 'dotenv/config';
import express from 'express';
import { prisma } from './utils/prisma';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './routers/appRouter';
export type { AppRouter } from './routers/appRouter';
import { createContext } from './context';
import { monitoredDevices, syncMonitoredDevices } from './routers/snmpRouter';
import { SnmpService } from './services/snmp';
import { influxDB } from './services/influxdb';
import { AlertService } from './services/alertService';
import { Point } from '@influxdata/influxdb-client';
import fs from 'fs';
import path from 'path';
import { Server as SocketServer } from 'socket.io';
import http from 'http';
import { syslogService } from './services/syslogService';
import { MailCollectorService } from './services/mailCollectorService';
import { IPAMSchedulerService } from './services/ipamSchedulerService';
import { DiscoverySchedulerService } from './services/discoverySchedulerService';
import { CronService } from './services/cronService';
import { env, isDebug } from './utils/env';
// import { VncProxyService } from './services/vncProxyService';

const LOG_FILE = path.join(process.cwd(), 'poller_debug.log');

async function logDebug(msg: string, forceConsole = false) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    try {
        await fs.promises.appendFile(LOG_FILE, line);
    } catch (e) {
        if (isDebug) console.error('Failed to write to log file:', e);
    }

    if (forceConsole || isDebug) {
        console.log(msg);
    }
}

const logSnmpPoller = (msg: string) => logDebug(msg, true);

// Fatal Error Handlers
process.on('uncaughtException', (err) => {
    logDebug(`[FATAL] Uncaught Exception: ${err.stack || err}`, true);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logDebug(`[FATAL] Unhandled Rejection at: ${promise} reason: ${reason}`, true);
});

// Configuração de Origens Seguras (CORS)
const allowedOrigins = env.ALLOWED_ORIGIN === '*' ? '*' : env.ALLOWED_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean);

const ioCorsConfig = {
    origin: allowedOrigins === '*' ? '*' : allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
};

const expressCorsOptions = {
    origin: allowedOrigins === '*' ? true : (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Permite requisições sem origin (como server-to-server ou curl) ou origens permitidas
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            logDebug(`[SECURITY] CORS bloqueou a requisição da origem: ${origin}`, true);
            callback(null, false);
        }
    },
    credentials: true,
};

// Inicializa o app Express
const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
    cors: ioCorsConfig,
    allowEIO3: true,            // Compatibility with older socket.io clients
    pingTimeout: 60000,         // Prevent slow Windows agents from dropping
    pingInterval: 25000,
    transports: ['polling', 'websocket']
});

const snmpService = new SnmpService();
const alertService = new AlertService();

// Habilita CORS para permitir requisições do frontend
app.use(cors(expressCorsOptions as any));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const port = env.DEV_PORT;
import { connectedAgents } from './agentState';

// Rate Limiter em memória para proteção do tRPC
const trpcRateLimiter = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 150; // requisições
const RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS) : 60000; // 1 minuto

const rateLimitMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Evita rate limit local para os agentes do próprio servidor
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (ip === '127.0.0.1' || ip === '::1') return next();

    const now = Date.now();
    let record = trpcRateLimiter.get(ip);
    
    if (!record || now > record.resetTime) {
        record = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
    } else {
        record.count++;
    }
    
    trpcRateLimiter.set(ip, record);

    if (record.count > RATE_LIMIT_MAX) {
        logDebug(`[SECURITY] Rate Limit excedido por IP: ${ip} (${record.count} requisições)`);
        return res.status(429).json({ 
            error: { message: 'Limite de requisições excedido. Tente novamente mais tarde.', code: 'TOO_MANY_REQUESTS' } 
        });
    }
    
    // Limpeza periódica do mapa para evitar leak de memória
    if (trpcRateLimiter.size > 10000) trpcRateLimiter.clear();
    
    next();
};

// Endpoint principal do tRPC
app.use(
    '/trpc',
    rateLimitMiddleware,
    createExpressMiddleware({
        router: appRouter,
        createContext: (opts) => createContext(opts, io),
    })
);

// Serve static agents/downloads
// Use __dirname to ensure path works regardless of where the server is started from
const agentsPath = path.join(__dirname, '..', 'public', 'agents');
console.log('[Server] Agents path:', agentsPath);
if (!fs.existsSync(agentsPath)) {
    console.warn('[Server] Creating agents directory:', agentsPath);
    fs.mkdirSync(agentsPath, { recursive: true });
}

// Intercept dynamic downloads to suggest IP
app.get('/downloads/IronGridAgentSetup_*.exe', (req, res) => {
    const setupFile = path.join(agentsPath, 'IronGridAgentSetup.exe');
    const agentFile = path.join(agentsPath, 'agent-win.exe');
    const realFile = fs.existsSync(setupFile) ? setupFile : agentFile;
    console.log('[Downloads] Attempting to serve:', realFile, '| Exists:', fs.existsSync(realFile));
    if (fs.existsSync(realFile)) {
        const filename = req.path.split('/').pop() || 'IronGridAgentSetup.exe';
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.download(realFile, filename);
    } else {
        console.error('[Downloads] File not found:', realFile);
        res.status(404).send('Agent executable not found');
    }
});

app.use('/downloads', express.static(agentsPath));

const manualPathCandidates = [
    path.join(__dirname, '..', 'public', 'manual'),
    path.join(process.cwd(), '..', 'public', 'manual'),
    path.join(process.cwd(), '../../Manual'),
    path.join(process.cwd(), 'Manual'),
];
const manualPath = manualPathCandidates.find(candidate => fs.existsSync(candidate));
if (manualPath) {
    console.log('[Server] Manual path:', manualPath);
    app.use('/manual', express.static(manualPath));
}

// NOTE: Static frontend serving moved to the bottom of the file to ensure API routes are handled first.

// Inicialização de Parâmetros do Sistema (Ocorre uma vez no startup)
async function initializeSystemParameters() {
    try {
        await prisma.systemParameter.upsert({ where: { key: 'alert_bandwidth_threshold' }, update: {}, create: { key: 'alert_bandwidth_threshold', value: '85', category: 'ALERTS', type: 'NUMBER', description: 'Limite de utilização de banda em %' } });
        await prisma.systemParameter.upsert({ where: { key: 'alert_latency_threshold' }, update: {}, create: { key: 'alert_latency_threshold', value: '200', category: 'ALERTS', type: 'NUMBER', description: 'Limite de latência em ms' } });
        await prisma.systemParameter.upsert({ where: { key: 'alert_monitored_types' }, update: {}, create: { key: 'alert_monitored_types', value: 'SWITCH,GATEWAY,FIREWALL', category: 'ALERTS', type: 'STRING', description: 'Tipos de dispositivos monitorados pela central de alertas' } });

        // Parâmetros SNMP
        await prisma.systemParameter.upsert({ where: { key: 'snmp_default_community' }, update: {}, create: { key: 'snmp_default_community', value: 'IronGrid', category: 'SNMP', type: 'STRING', description: 'Comunidade SNMP padrão sugerida para descoberta. Pode ser alterada por instalação ou configuração.' } });
        await prisma.systemParameter.upsert({ where: { key: 'snmp_communities' }, update: {}, create: { key: 'snmp_communities', value: 'IronGrid,public,irongrid,private,community', category: 'SNMP', type: 'STRING', description: 'Lista de comunidades SNMP que o sistema tentará automaticamente para descoberta.' } });
        await prisma.systemParameter.upsert({ where: { key: 'snmp_version' }, update: {}, create: { key: 'snmp_version', value: '2c', category: 'SNMP', type: 'STRING', description: 'Versão SNMP preferencial: 2c por padrão; suporte a v3 pode ser habilitado no futuro.' } });
        await prisma.systemParameter.upsert({ where: { key: 'snmp_auto_discovery_enabled' }, update: {}, create: { key: 'snmp_auto_discovery_enabled', value: 'true', category: 'SNMP', type: 'BOOLEAN', description: 'Habilita a descoberta automática de dispositivos via SNMP após o bootstrap do sistema.' } });
        await prisma.systemParameter.upsert({ where: { key: 'snmp_auto_discovery_timeout_ms' }, update: {}, create: { key: 'snmp_auto_discovery_timeout_ms', value: '3000', category: 'SNMP', type: 'NUMBER', description: 'Timeout padrão para tentativas de descoberta SNMP.' } });
        
        // Parâmetros RustDesk
        await prisma.systemParameter.upsert({ where: { key: 'rustdesk_server_host' }, update: {}, create: { key: 'rustdesk_server_host', value: '', category: 'REMOTE_ACCESS', type: 'STRING', description: 'IP ou Hostname do servidor RustDesk' } });
        await prisma.systemParameter.upsert({ where: { key: 'rustdesk_server_key' }, update: {}, create: { key: 'rustdesk_server_key', value: '', category: 'REMOTE_ACCESS', type: 'STRING', description: 'Chave pública (Public Key) do servidor RustDesk' } });
        await prisma.systemParameter.upsert({ where: { key: 'rustdesk_server_relay' }, update: {}, create: { key: 'rustdesk_server_relay', value: '', category: 'REMOTE_ACCESS', type: 'STRING', description: 'Host:porta do relay RustDesk HBBR' } });
        logDebug('[System] Parameters initialized.');
    } catch (e) {
        logDebug(`[System] Error initializing parameters: ${e}`);
    }
}
initializeSystemParameters();

// Static frontend serving has been moved to the bottom.

app.get('/api/public/rustdesk', async (req, res) => {
    const rows = await prisma.systemParameter.findMany({
        where: { key: { in: ['rustdesk_server_host', 'rustdesk_server_key', 'rustdesk_server_relay'] } }
    });
    const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    const host = values.rustdesk_server_host || req.hostname;
    res.json({
        host,
        relay: values.rustdesk_server_relay || `${host}:21117`,
        key: values.rustdesk_server_key || '',
    });
});

// Diagnostic endpoint
app.get('/diag/agents', (req, res) => {
    res.json({
        total: connectedAgents.size,
        agents: Array.from(connectedAgents.entries())
    });
});

// Rota de teste básica (Health Check simples fora do tRPC)
app.get('/api/health', (req, res) => {
    res.json({ message: 'IronGrid API' });
});

// Serve frontend in production (must be after all API routes)
if (env.NODE_ENV === 'production') {
    // __dirname is usually apps/server/dist in prod, so ../../web/dist is correct.
    // Fallback to process.cwd() just in case.
    let webDistPath = path.join(__dirname, '../../web/dist');
    if (!fs.existsSync(webDistPath)) {
        webDistPath = path.join(process.cwd(), '../web/dist');
    }
    
    if (fs.existsSync(webDistPath)) {
        logDebug(`[Server] Serving static frontend from: ${webDistPath}`, true);
        app.use(express.static(webDistPath, {
            setHeaders: (res, filePath) => {
                if (filePath.endsWith('index.html')) {
                    res.setHeader('Cache-Control', 'no-store');
                } else if (filePath.includes('/assets/')) {
                    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                }
            }
        }));
        
        // Handle SPA routing - send all non-API requests to index.html
        app.get('*', (req, res, next) => {
            // Se for uma requisição de API que não foi pega, retorne 404
            if (req.path.startsWith('/trpc') || req.path.startsWith('/downloads') || req.path.startsWith('/manual') || req.path.startsWith('/api') || req.path.startsWith('/diag')) {
                return res.status(404).json({ error: 'API route not found' });
            }
            
            // Se o browser pedir um asset que não existe, retorne 404 em vez de index.html
            // Isso evita erros de MIME type confusos e 500 no client
            if (req.path.startsWith('/assets/')) {
                return res.status(404).type('text/plain').send('Asset not found');
            }
            
            res.sendFile(path.join(webDistPath, 'index.html'));
        });
    } else {
        logDebug(`[Server] WARNING: web/dist not found at ${webDistPath}. Static serving disabled.`, true);
    }
}

logDebug(`Server starting [PID: ${process.pid}] [ENV: ${env.NODE_ENV}]`, true);

// Initialize Syslog Service
syslogService.start().then(() => {
    const status = syslogService.getStatus();
    logDebug(`[Syslog] Service started on port ${status.port}`);
}).catch(err => {
    logDebug(`[Syslog] Failed to start service: ${err.message}`);
});

// Initialize Mail Collector Polling
MailCollectorService.startPolling();

// Initialize monitoring from DB
syncMonitoredDevices().then(devices => {
    logDebug(`Restored ${devices.length} monitored devices from DB`);
}).catch(err => {
    logDebug(`Error restoring monitored devices: ${err.message}`);
});

// Polling Loop for SNMP Monitoring
let lastPollerStatusEmpty = false;
let snmpPollerRunning = false;
const pollSnmpMetrics = async () => {
    if (snmpPollerRunning) {
        logSnmpPoller('[SNMP Poller] Previous cycle still running; skipping this interval.');
        return;
    }
    snmpPollerRunning = true;

    try {
    if (monitoredDevices.length === 0) {
        if (!lastPollerStatusEmpty) {
            logSnmpPoller(`[SNMP Poller] Entry state: No devices to poll (Agents connected: ${connectedAgents.size})`);
            lastPollerStatusEmpty = true;
        }
        return;
    }
    lastPollerStatusEmpty = false;

    logSnmpPoller(`[SNMP Poller] Monitoring ${monitoredDevices.length} devices: ${monitoredDevices.map(d => d.ip).join(', ')}`);

    const { monitoringService } = await import('./services/monitoringService');

    for (const device of monitoredDevices) {
        try {
            if (device.interfaces.length === 0) {
                logSnmpPoller(`[SNMP Poller] Skipping ${device.ip} (Zero interfaces monitored)`);
                continue;
            }
            logSnmpPoller(`[SNMP Poller] Fetching metrics for ${device.ip} (Interfaces: ${device.interfaces.join(',')})`);
            const metrics = await snmpService.getTrafficMetrics(device.ip, device.community, device.interfaces, logSnmpPoller);

            logSnmpPoller(`[SNMP Poller] ${device.ip} returned ${metrics.length} interface metrics`);

            if (metrics.length > 0) {
                const dbDevice = await prisma.device.findFirst({
                    where: { ipAddress: device.ip },
                    include: { networkInterfaces: true },
                    orderBy: { createdAt: 'asc' }
                });

                if (dbDevice) {
                    // Update status to ONLINE if SNMP is responding
                    if (dbDevice.status !== 'ONLINE') {
                        await prisma.device.update({
                            where: { id: dbDevice.id },
                            data: { 
                                status: 'ONLINE', 
                                lastSeen: new Date(),
                                offlineSince: null 
                            }
                        });
                        await monitoringService.checkStatus(dbDevice, 'ONLINE');
                    } else {
                        await prisma.device.update({
                            where: { id: dbDevice.id },
                            data: { lastSeen: new Date() }
                        });
                    }

                    metrics.forEach(m => {
                        const point = new Point('interface_traffic')
                            .tag('device', device.ip)
                            .tag('device_id', dbDevice.id)
                            .tag('interface_index', m.index.toString())
                            .floatField('ifInOctets', Number(m.in))
                            .floatField('ifOutOctets', Number(m.out))
                            .stringField('status', m.status);

                        const iface = dbDevice.networkInterfaces.find(i => i.index === m.index);
                        if (iface) {
                            point.tag('interface', iface.name);
                        }

                        influxDB.writeApi.writePoint(point);

                        // Update status in database for the interface
                        prisma.networkInterface.updateMany({
                            where: { deviceId: dbDevice.id, index: m.index },
                            data: { status: m.status, updatedAt: new Date() }
                        }).catch(e => logSnmpPoller(`[SNMP Poller] Failed to update interface status for ${device.ip}:${m.index}: ${e}`));

                        // Verificação de Banda (Threshold)
                        if (iface && iface.speed) {
                            monitoringService.checkBandwidth(
                                dbDevice,
                                m.index,
                                iface.name,
                                m.in,
                                m.out,
                                Number(iface.speed) / 1000000 // Convert to Mbps
                            ).catch(e => logDebug(`[Monitoring] Bandwidth check failed: ${e}`));
                        }
                    });

                    await influxDB.writeApi.flush();
                    logSnmpPoller(`[SNMP Poller] Data flushed to InfluxDB for ${device.ip}`);
                }
            }
        } catch (error: any) {
            logSnmpPoller(`[SNMP Poller] ERROR polling ${device.ip}: ${error?.message || error}`);

            // Trigger Critical Alert on poll failure — com deduplicação:
            // Só cria/envia se NÃO houver um alerta SNMP ativo para este dispositivo.
            try {
                const { AlertSeverity, AlertStatus } = await import('@prisma/client');
                const dbDevice = await prisma.device.findFirst({ where: { ipAddress: device.ip }, orderBy: { createdAt: 'asc' } });

                const existingSnmpAlert = await prisma.alert.findFirst({
                    where: {
                        deviceId: dbDevice?.id ?? undefined,
                        status: AlertStatus.ACTIVE,
                        title: { startsWith: `Falha de Comunicação SNMP: ${device.ip}` }
                    }
                });

                if (existingSnmpAlert) {
                    logSnmpPoller(`[SNMP Poller] ${device.ip} still unreachable — SNMP alert already active (${existingSnmpAlert.id}), skipping duplicate.`);
                } else {
                    await alertService.createAlert({
                        title: `Falha de Comunicação SNMP: ${device.ip}`,
                        message: `O poller não conseguiu obter métricas do dispositivo ${device.ip}. Erro: ${error?.message || 'Unknown'}`,
                        severity: AlertSeverity.CRITICAL,
                        deviceId: dbDevice?.id
                    });
                }
            } catch (alertError) {
                logSnmpPoller(`[SNMP Poller] Failed to create alert: ${alertError}`);
            }
        }
    }
    } finally {
        snmpPollerRunning = false;
    }
};

setTimeout(() => {
    pollSnmpMetrics().catch(error => logSnmpPoller(`[SNMP Poller] Initial run failed: ${error?.message || error}`));
}, 5000);

setInterval(() => {
    pollSnmpMetrics().catch(error => logSnmpPoller(`[SNMP Poller] Interval run failed: ${error?.message || error}`));
}, 30000); // 30s para atualizar gráficos nativos com mais responsividade

// Global Ping Poller for Topology and Status
setInterval(async () => {
    const devices = await prisma.device.findMany();
    if (devices.length === 0) return;

    logDebug(`[Ping Poller] Pinging ${devices.length} devices...`);

    const { PingService } = await import('./services/pingService');
    const { monitoringService } = await import('./services/monitoringService');
    const pingService = new PingService();
    const results = await pingService.bulkPing(devices.map(d => d.ipAddress));

    for (const res of results) {
        const status = res.success ? 'ONLINE' : 'OFFLINE';
        const device = devices.find(d => d.ipAddress === res.ip);

        if (device) {
            // Sective exceptions for ping statuses:
            // 1) Se o ping falhou, mas o dispositivo foi visto há menos de 2 minutos por outro serviço (IPAM/SNMP),
            // ignoramos a mudança para OFFLINE para evitar flickering.
            // 2) Dispositivos do tipo INTERNET sempre são forçados como ONLINE.
            const recentlySeen = device.lastSeen && (Date.now() - new Date(device.lastSeen).getTime()) < 120000;
            const finalStatus = (device.type === 'INTERNET' || (status === 'OFFLINE' && recentlySeen)) ? 'ONLINE' : status;

            // Verificação de Status e Latência
            await monitoringService.checkStatus(device, finalStatus);
            if (res.success && res.latency) {
                await monitoringService.checkLatency(device, res.latency);
                
                // Grava latência histórica no InfluxDB para o Grafana
                const point = new Point('device_latency')
                    .tag('device', device.ipAddress)
                    .tag('name', device.name)
                    .floatField('value', res.latency);
                influxDB.writeApi.writePoint(point);
            }

            try {
                await prisma.device.updateMany({
                    where: { id: device.id },
                    data: {
                        status: finalStatus as any,
                        lastLatency: res.latency || (finalStatus === 'ONLINE' ? device.lastLatency : null),
                        lastSeen: res.success ? new Date() : device.lastSeen,
                        offlineSince: finalStatus === 'OFFLINE'
                            ? (device?.offlineSince || new Date())
                            : null
                    }
                });
            } catch (updateErr) {
                logDebug(`[Ping Poller] Error updating device ${device.ipAddress} (maybe deleted?): ${updateErr}`);
            }
        }
    }
    await influxDB.writeApi.flush();
    logDebug(`[Ping Poller] Updated ${results.length} devices`);
}, 30000); // Aumentado para 30s

// Daily System Maintenance (Cleanup Logs & Metrics)
import { MaintenanceService } from './services/maintenanceService';
const maintenanceService = new MaintenanceService();
setInterval(async () => {
    logDebug('[System] Running daily maintenance job...');
    try {
        const result = await maintenanceService.runCleanup();
        logDebug(`[System] Maintenance complete. Deleted ${result.logsDeleted} logs.`);

        // Auto-avaliação de tickets (15 dias)
        logDebug('[System] Running auto-evaluation for tickets...');
        const evalResult = await maintenanceService.autoEvaluateTickets();
        logDebug(`[System] Auto-evaluation complete. Processed ${evalResult.processed} tickets.`);

        // Weekly Syslog Backup & Cleanup (Executa no Domingo - Day 0)
        const now = new Date();
        if (now.getDay() === 0) {
            logDebug('[System] Running weekly Syslog maintenance...');
            const { syslogMaintenanceService } = await import('./services/syslogMaintenanceService');
            await syslogMaintenanceService.backupSyslog();
            await syslogMaintenanceService.cleanupAfterBackup();
        }
    } catch (e) {
        logDebug(`[System] Maintenance job failed: ${e}`);
    }
}, 24 * 60 * 60 * 1000); // 24 hours

// Socket.io Handlers for Remote Access
// const vncProxyService = new VncProxyService(io);
// 
// // Handle VNC / Remote Access Proxy upgrades
// server.on('upgrade', (request, socket, head) => {
//     vncProxyService.handleUpgrade(request, socket, head);
// });

// Debug connection attempts
io.engine.on("connection", (socket) => {
    logDebug(`[Socket ENGINE] New connection attempt: ${socket.id} from ${socket.remoteAddress}`);
});

io.engine.on("connection_error", (err) => {
    logDebug(`[Socket ENGINE] Connection error: ${err.req.url} - ${err.code} - ${err.message}`);
});

io.on('connection', (socket) => {
    // Setup Inventory Handlers
    import('./websocket/inventoryHandler').then(({ setupInventoryHandlers }) => setupInventoryHandlers(socket));

    const agentId = socket.handshake.query.agentId as string;
    const forwarded = socket.handshake.headers['x-forwarded-for'];
    const forwardedIp = typeof forwarded === 'string' ? forwarded.split(',')[0] : (Array.isArray(forwarded) ? forwarded[0] : null);
    const clientIp = (forwardedIp || socket.handshake.address).replace('::ffff:', '').replace('::1', '127.0.0.1');
    const transport = socket.conn.transport.name;

    logDebug(`[Socket] established: ${socket.id} from ${clientIp} (agentId: ${agentId}, transport: ${transport})`);

    if (agentId) {
        logDebug(`[Socket] Agent ${agentId} registered from ${clientIp}`);
        connectedAgents.set(agentId, {
            socketId: socket.id,
            ipAddress: clientIp
        });
        socket.join(`agent:${agentId}`);
        io.emit('agent-status-change', { agentId, status: 'online' });
    }

    /* DISABLED REMOTE ACCESS HANDLERS
    socket.on('join-session', (data: { agentId: string }) => {
        logDebug(`[Socket] User joining session for agent ${data.agentId}`);
        socket.join(`session:${data.agentId}`);

        // Notify user if agent is offline
        if (!connectedAgents.has(data.agentId)) {
            socket.emit('error', { message: 'Agent is offline' });
            return;
        }

        // Request agent to start streaming
        io.to(`agent:${data.agentId}`).emit('request-stream-start');
    });

    socket.on('leave-session', (data: { agentId: string }) => {
        logDebug(`[Socket] User leaving session for agent ${data.agentId}`);
        socket.leave(`session:${data.agentId}`);
        // If no more users in session, stop agent stream
        const room = io.sockets.adapter.rooms.get(`session:${data.agentId}`);
        if (!room || room.size === 0) {
            io.to(`agent:${data.agentId}`).emit('request-stream-stop');
        }
    });

    socket.on('stream-frame', (data: { agentId: string, frame: string }) => {
        // Broadcast frame to all users in the session room
        // if (Math.random() < 0.1) console.log(`[Socket] Received frame for agent ${data.agentId} (${data.frame.length} chars)`);
        io.to(`session:${data.agentId}`).emit('stream-frame', data.frame);
    });

    socket.on('access-response', async (data: { requestId: string, granted: boolean, vncConfig?: { port: number, password: string } }) => {
        const agentId = socket.handshake.query.agentId;
        console.log(`[Socket] Received access-response from Agent ${agentId} for request ${data.requestId}: ${data.granted ? 'GRANTED' : 'REJECTED'}`);
        logDebug(`[Socket] Received access-response for ${data.requestId}: ${data.granted ? 'GRANTED' : 'REJECTED'}`);
        const { activeRequests } = require('./routers/remoteRouter');

        const request = activeRequests.get(data.requestId);
        if (request) {
            request.status = data.granted ? 'granted' : 'rejected';

            if (data.granted && data.vncConfig) {
                request.password = data.vncConfig.password;
                // Inicia Proxy TCP para VNC Nativo
                vncProxyService.startTCPProxy(request.agentId).then(proxyPort => {
                    request.proxyPort = proxyPort;
                    logDebug(`[Socket] Native VNC Proxy allocated for ${request.agentId}: port ${proxyPort}`);
                }).catch(err => {
                    console.error(`[Socket] Failed to start native VNC proxy for ${request.agentId}:`, err);
                });
                logDebug(`[Socket] Access granted via VNC Tunnel for ${request.agentId} (PWD: ${request.password ? 'YES' : 'NO'})`);
            } else if (data.granted && !data.vncConfig) {
                // Caso não tenha VNC, o frontend usará o streaming via sockets (Native Stream)
                logDebug(`[Socket] Access granted without VNC for ${data.requestId}. Using native streaming.`);
            }
        }
    });

    socket.on('user-input', (data: { agentId: string, type: string, data: any }) => {
        // Forward input to the target agent
        io.to(`agent:${data.agentId}`).emit('user-input', data);
    });

    socket.on('action-result', async (data: { logId: string, status: 'SUCCESS' | 'FAILED', output?: string, error?: string, exitCode?: number }) => {
        logDebug(`[Socket] Received action-result for log ${data.logId}: ${data.status}`);
        await remoteActionService.handleResult(data);
    });
    */

    socket.on('disconnect', () => {
        if (agentId) {
            const currentAgent = connectedAgents.get(agentId);
            if (currentAgent && currentAgent.socketId === socket.id) {
                logDebug(`[Socket] Agent ${agentId} disconnected (Socket: ${socket.id})`);
                connectedAgents.delete(agentId);
                io.emit('agent-status-change', { agentId, status: 'offline' });
            } else {
                logDebug(`[Socket] Obsolete socket disconnected for agent ${agentId} (Socket: ${socket.id})`);
            }
        }
    });
});

// Inicia o servidor na porta definida
server.listen(port, '0.0.0.0', () => {
    logDebug(`Server running on http://0.0.0.0:${port}`, true);
    // Iniciar agendadores (varreduras agendadas)
    IPAMSchedulerService.start();
    DiscoverySchedulerService.start();
    CronService.start(io);
});
