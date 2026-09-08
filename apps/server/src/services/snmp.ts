/**
 * Serviço de Comunicação SNMP (Simple Network Management Protocol)
 * 
 * Responsável pela coleta de informações detalhadas de ativos de rede, como
 * Switches, Roteadores e Servidores. O serviço realiza varreduras via OIDs
 * padronizadas (RFC 1213 / MIB-II) para identificar inventário e métricas.
 * 
 * Funcionalidades:
 * - Descoberta de ativos via SNMP Probe.
 * - Coleta de inventário de Interfaces (MAC, Status, Alias).
 * - Monitoramento de tráfego (Octets In/Out) via contadores 32-bit e 64-bit (HC).
 * - Identificação de Sêrie, Nome de Sistema e Descrição.
 * 
 * @module services/snmp
 */

import snmp from 'net-snmp';
import { sanitizeSnmpString } from '../utils/string';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/** Interface de Rede identificada via SNMP */
export interface NetworkInterface {
    /** Índice único da interface na MIB (ifIndex) */
    index: number;
    /** Descrição textual do fabricante (ifDescr) */
    description: string;
    /** Nome amigável configurado manualmente (ifAlias) */
    alias?: string;
    /** Endereço físico da interface */
    mac: string;
    /** Estado operacional (1=Up, 2=Down) */
    operStatus: number;
    /** Estado administrativo (desejado) */
    adminStatus: number;
    /** Velocidade nominal da porta */
    speed?: number;
}

/** Conjunto de dados extraídos de um dispositivo via SNMP */
export interface SnmpData {
    /** Descrição completa do sistema */
    sysDescr?: string;
    /** Nome de rede do dispositivo */
    sysName?: string;
    /** Número de série (se disponível via Entity MIB) */
    serialNumber?: string;
    /** Lista de interfaces de rede encontradas */
    interfaces: NetworkInterface[];
    /** Comunidade SNMP que respondeu ao probe */
    community?: string;
}

/** OIDs Padronizadas utilizadas no sistema */
const OIDS = {
    sysDescr: '1.3.6.1.2.1.1.1.0',
    sysName: '1.3.6.1.2.1.1.5.0',
    sysObjectID: '1.3.6.1.2.1.1.2.0',
    hrDeviceDescr: '1.3.6.1.2.1.25.3.2.1.3',
    entPhysicalSerialNum: '1.3.6.1.2.1.47.1.1.1.1.11',
    ifDescr: '1.3.6.1.2.1.2.2.1.2',
    ifAlias: '1.3.6.1.2.1.31.1.1.1.18',
    ifPhysAddress: '1.3.6.1.2.1.2.2.1.6',
    ifOperStatus: '1.3.6.1.2.1.2.2.1.8',
    ifAdminStatus: '1.3.6.1.2.1.2.2.1.7',
    ifInOctets: '1.3.6.1.2.1.2.2.1.10',
    ifOutOctets: '1.3.6.1.2.1.2.2.1.16',
    ifHCInOctets: '1.3.6.1.2.1.31.1.1.1.6',
    ifHCOutOctets: '1.3.6.1.2.1.31.1.1.1.10',
};

export class SnmpService {
    /** Comunidades SNMP padrão para tentativa automática */
    private communities: string[] = ['IronGrid', 'public', 'irongrid', 'unigran'];

    /**
     * Probe Device - Tentar descoberta de dados via SNMP
     * 
     * Itera sobre uma lista de comunidades até obter sucesso na leitura do sysDescr.
     * Caso tenha sucesso, coleta também o número de série e as interfaces.
     * 
     * @param {string} ip - Endereço IP do dispositivo
     * @param {string[]} [customCommunities] - Comunidades específicas para este IP
     * @returns {Promise<SnmpData | null>} Dados coletados ou null em caso de falha de comunicação
     */
    async probeDevice(ip: string, customCommunities?: string[]): Promise<SnmpData | null> {
        const targetCommunities = customCommunities && customCommunities.length > 0
            ? customCommunities
            : this.communities;

        for (const community of targetCommunities) {
            try {
                const session = snmp.createSession(ip, community, {
                    timeout: 2000,
                    retries: 1
                });

                // 1. Coleta Informações Básicas de Sistema
                const sysInfo = await new Promise<any[]>((resolve) => {
                    session.get([OIDS.sysDescr, OIDS.sysName], (error, varbinds) => {
                        if (error) {
                            console.log(`[SNMP probeDevice] System Info failed for ${ip} on ${community}: ${error.message}`);
                            resolve([]);
                        } else resolve(varbinds);
                    });
                });

                if (sysInfo.length < 2) {
                    session.close();
                    continue;
                }

                // 2. Coleta Número de Série (Via Entity MIB)
                let serialNumber: string | undefined;
                try {
                    serialNumber = await new Promise<string | undefined>((resolve) => {
                        session.get([OIDS.entPhysicalSerialNum], (error, varbinds) => {
                            if (!error && varbinds[0] && !snmp.isVarbindError(varbinds[0])) {
                                resolve(varbinds[0].value.toString());
                            } else resolve(undefined);
                        });
                    });
                } catch (e) { /* ignorar falha de serial */ }

                const interfaces = await this.getInterfaces(session);
                session.close();

                return {
                    sysDescr: sanitizeSnmpString(sysInfo[0]?.value?.toString() || 'Unknown Device'),
                    sysName: sanitizeSnmpString(sysInfo[1]?.value?.toString() || ip),
                    serialNumber,
                    interfaces,
                    community
                };
            } catch (error) {
                console.log(`Failed with community ${community} on ${ip}`);
            }
        }
        return null;
    }

    /**
     * Bulk Probe - Testar conectividade de múltiplos dispositivos
     * 
     * Utilizado para validação em massa de comunidades SNMP.
     */
    async bulkProbeDevices(ips: string[], community: string): Promise<Array<{ ip: string; success: boolean; sysName?: string; error?: string }>> {
        const results = await Promise.all(
            ips.map(async (ip) => {
                try {
                    const data = await this.probeDevice(ip, [community]);
                    if (data) {
                        return { ip, success: true, sysName: data.sysName };
                    } else {
                        return { ip, success: false, error: 'SNMP timeout or wrong community' };
                    }
                } catch (error: any) {
                    return { ip, success: false, error: error.message || 'Unknown error' };
                }
            })
        );
        return results;
    }

    /**
     * Manual Probe - Varredura com comunidade explícita
     */
    async manualProbe(ip: string, community: string): Promise<SnmpData | null> {
        try {
            const session = snmp.createSession(ip, community, {
                timeout: 5000,
                retries: 2
            });

            const sysInfo = await new Promise<any>((resolve) => {
                session.get([OIDS.sysDescr, OIDS.sysName], (error, varbinds) => {
                    if (error) {
                        console.warn(`[SNMP manualProbe] sysInfo error: ${error.message}`);
                        resolve([{ value: 'Unknown' }, { value: 'Unknown' }]);
                    } else {
                        resolve(varbinds);
                    }
                });
            });

            const interfaces = await this.getInterfaces(session);
            session.close();

            if (sysInfo.length > 0 || interfaces.length > 0) {
                return {
                    sysDescr: sanitizeSnmpString(sysInfo[0]?.value?.toString() || 'Unknown'),
                    sysName: sanitizeSnmpString(sysInfo[1]?.value?.toString() || ip),
                    interfaces,
                    community
                };
            }
        } catch (e) {
            console.log(`[SNMP manualProbe] Error:`, e);
            return null;
        }
        return null;
    }

    /**
     * Get Interfaces - Coleta recursiva de interfaces (Subtree)
     * 
     * Implementa lógica robusta para switches com muitas portas, dividindo a coleta
     * em chunks (lotes) para evitar erros de 'TooBig' (PDU maior que buffer).
     * 
     * @private
     */
    private async getInterfaces(session: any): Promise<NetworkInterface[]> {
        return new Promise((resolve) => {
            const interfaces: Map<number, Partial<NetworkInterface>> = new Map();

            // Passo 1: Descobrir índices e descrições via Walk (Subtree)
            session.subtree(OIDS.ifDescr, 10, (varbinds: any[]) => {
                for (const vb of varbinds) {
                    const parts = vb.oid.split('.');
                    const index = parseInt(parts[parts.length - 1]);
                    if (!interfaces.has(index)) interfaces.set(index, { index });
                    interfaces.get(index)!.description = vb.value.toString();
                }
            }, async (error: any) => {
                if (error) {
                    console.error('Subtree ifDescr error:', error);
                    resolve([]);
                    return;
                }

                const indices = Array.from(interfaces.keys());
                if (indices.length === 0) {
                    resolve([]);
                    return;
                }

                // Passo 2: Coletar atributos detalhados em lotes de 10
                const chunkSize = 10;
                for (let i = 0; i < indices.length; i += chunkSize) {
                    const chunk = indices.slice(i, i + chunkSize);
                    const batchOids: string[] = [];
                    chunk.forEach(idx => {
                        batchOids.push(`${OIDS.ifAlias}.${idx}`);
                        batchOids.push(`${OIDS.ifPhysAddress}.${idx}`);
                        batchOids.push(`${OIDS.ifOperStatus}.${idx}`);
                        batchOids.push(`${OIDS.ifAdminStatus}.${idx}`);
                    });

                    await new Promise<void>((resolveChunk) => {
                        session.get(batchOids, (err: any, vbs: any[]) => {
                            if (err) {
                                // Fallback em caso de erro no lote: Tenta pelo menos o status básico
                                const fallbackOids = chunk.map(idx => `${OIDS.ifOperStatus}.${idx}`);
                                session.get(fallbackOids, (errF: any, vbsF: any[]) => {
                                    if (!errF) {
                                        chunk.forEach((idx, j) => {
                                            if (vbsF[j] && !snmp.isVarbindError(vbsF[j])) {
                                                interfaces.get(idx)!.operStatus = vbsF[j].value;
                                            }
                                        });
                                    }
                                    resolveChunk();
                                });
                            } else {
                                // Mapeia os 4 atributos por interface do chunk
                                chunk.forEach((idx, j) => {
                                    const vbAlias = vbs[j * 4];
                                    const vbPhys = vbs[j * 4 + 1];
                                    const vbOper = vbs[j * 4 + 2];
                                    const vbAdmin = vbs[j * 4 + 3];

                                    if (vbAlias && !snmp.isVarbindError(vbAlias)) {
                                        const aliasStr = sanitizeSnmpString(vbAlias.value.toString());
                                        if (aliasStr) {
                                            interfaces.get(idx)!.alias = aliasStr;
                                        }
                                    }
                                    if (vbPhys && !snmp.isVarbindError(vbPhys)) {
                                        interfaces.get(idx)!.mac = vbPhys.value.toString('hex').match(/.{1,2}/g)?.join(':') || '';
                                    }
                                    if (vbOper && !snmp.isVarbindError(vbOper)) {
                                        interfaces.get(idx)!.operStatus = vbOper.value;
                                    }
                                    if (vbAdmin && !snmp.isVarbindError(vbAdmin)) {
                                        interfaces.get(idx)!.adminStatus = vbAdmin.value;
                                    }
                                });
                                resolveChunk();
                            }
                        });
                    });
                }

                resolve(Array.from(interfaces.values()) as NetworkInterface[]);
            });
        });
    }

    /**
     * Get Interface List - Listagem estruturada para o Discovery
     */
    async getInterfaceList(ip: string, community: string): Promise<Array<{ index: number, name: string, description: string, alias: string, type: string, mac: string, speed: number, status: string }>> {
        try {
            const session = snmp.createSession(ip, community, { timeout: 3000, retries: 1 });
            const interfaces = await this.getInterfaces(session);
            session.close();

            return interfaces.map(iface => ({
                index: iface.index,
                name: iface.alias || iface.description || `if${iface.index}`,
                description: iface.description || '',
                alias: iface.alias || '',
                type: 'ethernet',
                mac: iface.mac || '',
                speed: iface.speed || 0,
                status: iface.operStatus === 1 ? 'up' : 'down'
            }));
        } catch (err) {
            console.error(`[SNMP getInterfaceList] Error for ${ip}:`, err);
            return [];
        }
    }

    /**
     * Get Traffic Metrics - Coleta de contadores de tráfego
     * 
     * Suporta contadores de alta capacidade (HC - 64-bit) para interfaces Gigabit/10G.
     * 
     * @param {string} ip - IP do destino
     * @param {string} community - Comunidade SNMP
     * @param {number[]} interfaces - Lista de índices (ifIndex) para coleta
     */
    async getTrafficMetrics(ip: string, community: string, interfaces: number[], logger?: (msg: string) => void): Promise<Array<{ index: number, in: number, out: number, status: string }>> {
        // Increase timeout and retries to handle slow/Windows SNMP agents better
        const session = snmp.createSession(ip, community, { timeout: 10000, retries: 3 });
        const results: Array<{ index: number, in: number, out: number, status: string }> = [];
        const validInterfaces = [...new Set(interfaces)]
            .filter(i => Number.isInteger(i) && i > 0)
            .sort((a, b) => a - b);

        if (validInterfaces.length !== interfaces.length && logger) {
            logger(`[SNMP Poller] Ignoring invalid interface indexes for ${ip}: ${interfaces.filter(i => !Number.isInteger(i) || i <= 0).join(',')}`);
        }

        const parseCounter = (vb: any): bigint | null => {
            if (!vb || snmp.isVarbindError(vb)) return null;
            const val = vb.value;
            if (Buffer.isBuffer(val)) {
                return val.length > 0 ? BigInt('0x' + val.toString('hex')) : 0n;
            }
            return BigInt(val.toString());
        };
        const isReadableVarbind = (vb: any) => !!vb && !snmp.isVarbindError(vb);
        const parseSnmpGetNumber = (output: string): number | null => {
            const match = output.match(/(?:Counter32|Counter64|Gauge32|INTEGER):\s*(?:[a-zA-Z]+\()?(\d+)/);
            return match ? Number(match[1]) : null;
        };
        const communityFallbacks = [...new Set([community, 'IronGrid', 'irongrid', 'IRONGRID', 'unigran', 'UNIGRAN', 'public'].filter(Boolean))];
        const runSnmpGet = async (comm: string, oid: string) =>
            execFileAsync('snmpget', ['-v2c', '-c', comm, ip, oid], { timeout: 8000 });

        const collectOneWithCli = async (idx: number): Promise<{ index: number, in: number, out: number, status: string } | null> => {
            let lastError: any = null;
            for (const comm of communityFallbacks) {
            try {
                const [inResult, outResult, statusResult] = await Promise.all([
                    runSnmpGet(comm, `${OIDS.ifInOctets}.${idx}`),
                    runSnmpGet(comm, `${OIDS.ifOutOctets}.${idx}`),
                    runSnmpGet(comm, `${OIDS.ifOperStatus}.${idx}`).catch(() => null),
                ]);

                const inValue = parseSnmpGetNumber(inResult.stdout);
                const outValue = parseSnmpGetNumber(outResult.stdout);
                if (inValue === null && outValue === null) return null;

                const statusValue = statusResult ? parseSnmpGetNumber(statusResult.stdout) : null;
                const status = statusValue === 1 ? 'up' : statusValue === 2 ? 'down' : 'unknown';
                if (logger) logger(`[SNMP Poller] Interface ${ip}:${idx} collected via snmpget fallback (${comm})`);
                return {
                    index: idx,
                    in: inValue ?? 0,
                    out: outValue ?? 0,
                    status,
                };
            } catch (error: any) {
                lastError = error;
            }
            }

            if (logger) {
                logger(`[SNMP Poller] Interface ${ip}:${idx} snmpget fallback error: ${lastError?.message || lastError}`);
            }
            return null;
        };

        const collectOne = async (idx: number): Promise<{ index: number, in: number, out: number, status: string } | null> => {
            return new Promise((resolve) => {
                const oids32 = [`${OIDS.ifInOctets}.${idx}`, `${OIDS.ifOutOctets}.${idx}`];
                const oidsExtra = [`${OIDS.ifHCInOctets}.${idx}`, `${OIDS.ifHCOutOctets}.${idx}`, `${OIDS.ifOperStatus}.${idx}`];

                session.get(oids32, (err32: any, vbs32: any[]) => {
                    if (err32) {
                        if (logger) logger(`[SNMP Poller] Interface ${ip}:${idx} 32-bit error: ${err32.message}. Trying snmpget fallback.`);
                        collectOneWithCli(idx).then(resolve);
                        return;
                    }

                    session.get(oidsExtra, (_errExtra: any, vbsExtra: any[]) => {
                        const valIn = parseCounter(vbsExtra?.[0]) ?? parseCounter(vbs32?.[0]);
                        const valOut = parseCounter(vbsExtra?.[1]) ?? parseCounter(vbs32?.[1]);

                        if (valIn === null && valOut === null) {
                            if (logger) logger(`[SNMP Poller] Interface ${ip}:${idx} has no readable traffic counters`);
                            resolve(null);
                            return;
                        }

                        const statusValue = (vbsExtra?.[2] && !snmp.isVarbindError(vbsExtra[2])) ? vbsExtra[2].value : 0;
                        const status = statusValue === 1 ? 'up' : statusValue === 2 ? 'down' : 'unknown';
                        resolve({
                            index: idx,
                            in: Number(valIn ?? 0n),
                            out: Number(valOut ?? 0n),
                            status,
                        });
                    });
                });
            });
        };

        // Some SNMP agents time out when multiple interfaces are queried at once.
        // Keep this conservative; stability matters more than raw polling speed here.
        const chunkSize = 1;
        const chunks: number[][] = [];
        for (let i = 0; i < validInterfaces.length; i += chunkSize) {
            chunks.push(validInterfaces.slice(i, i + chunkSize));
        }

        for (const chunk of chunks) {
            try {
                const batchResults = await new Promise<Array<{ index: number, in: number, out: number, status: string }>>((resolveBatch) => {
                    const oids32: string[] = [];
                    const oids64: string[] = [];
                    const oidsStatus: string[] = [];
                    chunk.forEach(i => {
                        oids32.push(`${OIDS.ifInOctets}.${i}`);
                        oids32.push(`${OIDS.ifOutOctets}.${i}`);
                        oids64.push(`${OIDS.ifHCInOctets}.${i}`);
                        oids64.push(`${OIDS.ifHCOutOctets}.${i}`);
                        oidsStatus.push(`${OIDS.ifOperStatus}.${i}`);
                    });

                    // Lote 1: Contadores padrão 32-bit
                    session.get(oids32, async (err32: any, vbs32: any[]) => {
                        if (err32) {
                            if (logger) logger(`[SNMP Poller] Batch 32-bit error for ${ip}: ${err32.message}. Falling back to per-interface collection.`);
                            const items: Array<{ index: number, in: number, out: number, status: string }> = [];
                            for (const idx of chunk) {
                                const item = await collectOne(idx);
                                if (item) items.push(item);
                            }
                            resolveBatch(items);
                            return;
                        }

                        const chunkMetrics: Array<{ index: number, in: number, out: number, status: string }> = [];

                        // Lote 2: Tenta contadores 64-bit (Opcionais) e Status
                        session.get([...oids64, ...oidsStatus], (errExtra: any, vbsExtra: any[]) => {
                            for (let j = 0; j < chunk.length; j++) {
                                const idx = chunk[j];
                                const vbIn = vbs32[j * 2];
                                const vbOut = vbs32[j * 2 + 1];

                                let valIn = 0n;
                                let valOut = 0n;

                                // Prioridade para o contador de 64 bits (Buffer ou BigInt)
                                const vbHCIn = vbsExtra ? vbsExtra[j * 2] : null;
                                const vbHCOut = vbsExtra ? vbsExtra[j * 2 + 1] : null;

                                valIn = parseCounter(vbHCIn) ?? parseCounter(vbIn) ?? 0n;

                                valOut = parseCounter(vbHCOut) ?? parseCounter(vbOut) ?? 0n;

                                // Status operacional (sempre após os 2 OIDs HC no chunk de extra)
                                const vbStatus = vbsExtra ? vbsExtra[chunk.length * 2 + j] : null;
                                const statusValue = (vbStatus && !snmp.isVarbindError(vbStatus)) ? vbStatus.value : 0;
                                const status = statusValue === 1 ? 'up' : statusValue === 2 ? 'down' : 'unknown';

                                if (isReadableVarbind(vbIn) || isReadableVarbind(vbOut) || isReadableVarbind(vbHCIn) || isReadableVarbind(vbHCOut)) {
                                    chunkMetrics.push({ index: idx, in: Number(valIn), out: Number(valOut), status });
                                } else if (logger) {
                                    logger(`[SNMP Poller] Interface ${ip}:${idx} has no readable traffic counters`);
                                }
                            }
                            resolveBatch(chunkMetrics);
                        });
                    });
                });
                results.push(...batchResults);
            } catch (e) {
                if (logger) logger(`[SNMP Poller] Chunk processing failed for ${ip}: ${e}`);
            }
        }

        session.close();
        return results;
    }
}
