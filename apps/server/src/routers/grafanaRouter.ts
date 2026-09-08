import { z } from 'zod';
import { router, adminProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { influxDB } from '../services/influxdb';
import { prisma } from '../utils/prisma';
import { assertGrafanaChartLimit } from '../utils/productEdition';

import { tmpdir } from 'os';
const execPromise = promisify(exec);
const CONFIG_PATH = path.join(tmpdir(), 'irongrid_gen_config.json');
const DASHBOARD_PATH = path.join(tmpdir(), 'irongrid_gen_dashboard.json');
const GENERATOR_PATH = path.join(process.cwd(), '../../tools/gen_dashboard.js');
const GRAFANA_URL = process.env.GRAFANA_URL || 'http://grafana:3000';

const DeviceSchema = z.object({
    name: z.string(),
    ip: z.string(),
    interfaces: z.array(z.string())
});

export const grafanaRouter = router({
    // Busca a configuração atual
    getConfig: protectedProcedure.query(async () => {
        try {
            if (fs.existsSync(CONFIG_PATH)) {
                const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('Erro ao ler config do Grafana:', e);
        }
        return { devices: [] };
    }),

    // Retorna dispositivos e interfaces que estão ATIVOS na Seleção de Gráficos
    getDiscoveryData: protectedProcedure.query(async () => {
        try {
            // 1. Busca todos os dispositivos no monitoramento ativo
            const monitoredEntries = await prisma.monitoredDevice.findMany();
            const result: Record<string, { name: string; interfaces: string[] }> = {};

            for (const entry of monitoredEntries) {
                // 2. Para cada um, busca o dispositivo correspondente no inventário
                const device = await prisma.device.findFirst({
                    where: {
                        OR: [
                            { id: entry.deviceId || undefined },
                            { ipAddress: entry.ip }
                        ]
                    },
                    include: {
                        networkInterfaces: true
                    }
                });

                if (!device) continue;

                // 3. Filtra interfaces que:
                // - Estão na lista de monitoramento (entry.interfaces)
                // - E estão marcadas como habilitadas (ni.enabled === true)
                const enabledInterfaces = device.networkInterfaces
                    .filter(ni => entry.interfaces.includes(ni.index) && ni.enabled === true)
                    .map(ni => ni.name || ni.description || `Interface #${ni.index}`);

                if (enabledInterfaces.length > 0) {
                    result[entry.ip] = {
                        name: (device as any).deviceName || device.name || entry.ip,
                        interfaces: enabledInterfaces
                    };
                }
            }

            return result;
        } catch (error) {
            console.error('Erro na descoberta para Grafana:', error);
            return {};
        }
    }),

    // Atualiza a configuração e gera o Dashboard
    generate: adminProcedure
        .input(z.object({
            devices: z.array(DeviceSchema),
            dashboardName: z.string().optional(),
            autoImport: z.boolean().optional(),
            grafanaToken: z.string().optional()
        }))
        .mutation(async ({ input }) => {
            try {
                const chartCount = input.devices.reduce((total, device) => total + device.interfaces.length, 0);
                assertGrafanaChartLimit(chartCount);

                let datasourceUid = 'IronGrid-InfluxDB';
                if (input.grafanaToken) {
                    try {
                        const dsResponse = await fetch(`${GRAFANA_URL}/api/datasources`, {
                            headers: { 'Authorization': `Bearer ${input.grafanaToken.trim()}` }
                        });
                        if (dsResponse.ok) {
                            const dss = await dsResponse.json();
                            const influxDs = dss.find((d: any) => d.name === 'IronGrid-InfluxDB') 
                                          || dss.find((d: any) => d.type === 'influxdb' && d.isDefault)
                                          || dss.find((d: any) => d.type === 'influxdb');
                            if (influxDs) datasourceUid = influxDs.uid;
                        }
                    } catch (e) {
                        console.error('Failed to fetch datasource UID', e);
                    }
                }

                // 1. Salva o arquivo de configuração JSON com o nome incluído
                fs.writeFileSync(CONFIG_PATH, JSON.stringify({
                    title: input.dashboardName || 'IronGrid NOC Dashboard',
                    devices: input.devices,
                    datasourceUid: datasourceUid
                }, null, 2));

                // 2. Executa o script gerador para criar o arquivo irongrid_grafana_dashboard.json
                const { stdout } = await execPromise(`node "${GENERATOR_PATH}"`);

                let importMessage = '';

                // 3. Se autoImport estiver ativo, envia para a API do Grafana
                if (input.autoImport && input.grafanaToken) {
                    if (fs.existsSync(DASHBOARD_PATH)) {
                        let dashboardJson = JSON.parse(fs.readFileSync(DASHBOARD_PATH, 'utf-8'));

                        // Garante que o título do JSON seja o que o usuário escolheu
                        if (input.dashboardName) {
                            dashboardJson.title = input.dashboardName;
                        }

                        const token = (input.grafanaToken || '').trim();
                        console.log(`[Grafana] Tentando importar para ${GRAFANA_URL}/api/dashboards/db com token: ${token.substring(0, 4)}...${token.substring(token.length - 4)}`);

                        const response = await fetch(`${GRAFANA_URL}/api/dashboards/db`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                dashboard: dashboardJson,
                                overwrite: true
                            })
                        });

                        if (response.ok) {
                            importMessage = ` e importado como "${input.dashboardName}"!`;
                            // 4. Limpa o arquivo de configuração após o sucesso total
                            fs.writeFileSync(CONFIG_PATH, JSON.stringify({ devices: [] }, null, 2));
                        } else {
                            let errorMessage = `Erro ${response.status}`;
                            try {
                                const contentType = response.headers.get("content-type");
                                if (contentType && contentType.includes("application/json")) {
                                    const errData = await response.json();
                                    errorMessage = errData.message || errorMessage;
                                } else {
                                    const text = await response.text();
                                    if (text.includes("<title>")) {
                                        const titleMatch = text.match(/<title>(.*?)<\/title>/);
                                        if (titleMatch) errorMessage += `: ${titleMatch[1]}`;
                                    }
                                }
                            } catch (e) {
                                errorMessage += `: ${response.statusText}`;
                            }
                            importMessage = ` (Erro no Auto-Import: ${errorMessage})`;
                        }
                    }
                } else {
                    // Se não houver auto-import, mas gerou o JSON, também limpamos
                    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ devices: [] }, null, 2));
                }

                return {
                    success: true,
                    message: `Dashboard gerado${importMessage}`,
                    output: stdout
                };
            } catch (error: any) {
                console.error('Erro ao gerar dashboard:', error);
                throw new Error('Falha ao gerar dashboard: ' + error.message);
            }
        }),

    // Deleta um dashboard do Grafana via UID
    deleteDashboard: adminProcedure
        .input(z.object({
            uid: z.string(),
            grafanaToken: z.string()
        }))
        .mutation(async ({ input }) => {
            try {
                const response = await fetch(`${GRAFANA_URL}/api/dashboards/uid/${input.uid}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${input.grafanaToken.trim()}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    return { success: true, message: 'Dashboard removido com sucesso do Grafana!' };
                } else {
                    const errData = await response.json();
                    throw new Error(errData.message || 'Erro ao deletar no Grafana');
                }
            } catch (error: any) {
                throw new Error('Erro ao deletar dashboard: ' + error.message);
            }
        }),

    // Lista dashboards do Grafana para gerenciar
    listDashboards: protectedProcedure
        .input(z.object({ grafanaToken: z.string() }))
        .query(async ({ input }) => {
            try {
                const response = await fetch(`${GRAFANA_URL}/api/search?tag=IronGrid&type=dash-db`, {
                    headers: {
                        'Authorization': `Bearer ${input.grafanaToken.trim()}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    return await response.json();
                }
                return [];
            } catch (error) {
                return [];
            }
        }),

    // Importa um dashboard JSON bruto diretamente
    importRaw: adminProcedure
        .input(z.object({
            dashboard: z.any(),
            grafanaToken: z.string()
        }))
        .mutation(async ({ input }) => {
            try {
                const response = await fetch(`${GRAFANA_URL}/api/dashboards/db`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${input.grafanaToken.trim()}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        dashboard: input.dashboard,
                        overwrite: true
                    })
                });

                const contentType = response.headers.get("content-type");
                if (response.ok) {
                    if (contentType && contentType.includes("application/json")) {
                        const data = await response.json();
                        return { success: true, message: `Dashboard "${input.dashboard.title}" importado com sucesso!`, uid: data.uid };
                    } else {
                        return { success: true, message: `Dashboard "${input.dashboard.title}" importado (Resposta não-JSON)` };
                    }
                } else {
                    let errorMessage = `Erro ${response.status}: ${response.statusText}`;
                    try {
                        if (contentType && contentType.includes("application/json")) {
                            const errData = await response.json();
                            errorMessage = errData.message || errorMessage;
                        } else {
                            const text = await response.text();
                            // Se for HTML, tenta extrair o título ou algo útil
                            if (text.includes("<title>")) {
                                const titleMatch = text.match(/<title>(.*?)<\/title>/);
                                if (titleMatch) errorMessage += ` (${titleMatch[1]})`;
                            }
                        }
                    } catch (e) {
                        console.error('Falha ao parsear erro do Grafana:', e);
                    }
                    throw new Error(errorMessage);
                }
            } catch (error: any) {
                console.error('Erro ao importar dashboard:', error);
                throw new Error('Falha na comunicação com Grafana: ' + (error.message || 'Erro Desconhecido'));
            }
        }),

    // Testa a conexão com o Grafana usando o token fornecido
    testConnection: protectedProcedure
        .input(z.object({
            grafanaToken: z.string()
        }))
        .mutation(async ({ input }) => {
            const token = input.grafanaToken.trim();
            if (!token) throw new Error('Token não fornecido');

            try {
                // Tenta buscar a organização atual, que requer autenticação
                const response = await fetch(`${GRAFANA_URL}/api/org`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    return { 
                        success: true, 
                        message: `Conexão bem-sucedida! Organização: ${data.name} (ID: ${data.id})` 
                    };
                } else {
                    const status = response.status;
                    let detail = '';
                    try {
                        const errData = await response.json();
                        detail = errData.message || '';
                    } catch (e) {}

                    if (status === 401) {
                        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Não autorizado (401): O token é inválido ou expirou.' });
                    } else if (status === 403) {
                        throw new TRPCError({ code: 'FORBIDDEN', message: 'Proibido (403): O token não tem permissões suficientes (Admin necessário).' });
                    } else {
                        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Erro ${status}: ${detail || response.statusText}` });
                    }
                }
            } catch (error: any) {
                console.error('Erro ao testar conexão com Grafana:', error);
                if (error instanceof TRPCError) throw error;
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Falha na comunicação com o servidor Grafana local.' });
            }
        })
});
