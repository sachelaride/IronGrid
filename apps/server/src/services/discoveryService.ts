/**
 * Serviço de Descoberta de Rede (Network Discovery)
 * 
 * Responsável por varrer subredes e faixas de IP em busca de novos ativos.
 * Integra diversas técnicas para identificação e enriquecimento de dados:
 * - Varredura NMAP (Portas abertas, detecção de OS/Vendor)
 * - Probing SNMP (Hostnames, Interfaces, Números de Série)
 * - Detecção de Agentes IronGrid ativos (via agentId)
 * - Resolução de DNS (nslookup)
 * - Cadastro automático de novos ativos descobertos
 * 
 * @module services/discoveryService
 */

import { prisma } from '../utils/prisma';
import { exec } from 'child_process';
import { promisify } from 'util';
import { SnmpService } from './snmp';
import { sanitizeSnmpString } from '../utils/string';
import { scanNetwork } from './nmap';
import { connectedAgents } from '../agentState';
import { assertCanCreateAsset } from '../utils/productEdition';

const execAsync = promisify(exec);
const snmpService = new SnmpService();

/** Resultados padronizados de um host descoberto */
interface DiscoveryResult {
    ip: string;
    hostname?: string;
    isAlive: boolean;
    openPorts: number[];
    snmpAvailable: boolean;
    snmpInterfaces?: any[];
    model?: string;
    serialNumber?: string;
    macAddress?: string;
    agentId?: string;
    snmpCommunity?: string;
}

export class DiscoveryService {
    /**
     * Get Eligible Communities - Obter comunidades SNMP válidas
     * 
     * Busca comunidades cadastradas na tabela específica e também nos
     * parâmetros globais do sistema.
     * 
     * @private
     */
    private async getEligibleCommunities(): Promise<string[]> {
        const communities = await prisma.snmpCommunity.findMany({ select: { community: true } });

        return communities
            .map(c => c.community?.trim())
            .filter((community): community is string => Boolean(community));

    }

    /**
     * Scan Network Range - Varredura de Faixa Cadastrada
     * 
     * Percorre uma faixa de rede configurada no banco de dados e tenta
     * identificar todos os hosts ativos.
     * 
     * @param {string} rangeId - ID da faixa de rede (NetworkRange)
     * @param {function} [onProgress] - Callback para reportar progresso iterativo
     */
    async scanNetworkRange(rangeId: string, onProgress?: (progress: number, found: number) => void): Promise<DiscoveryResult[]> {
        const range = await prisma.networkRange.findUnique({
            where: { id: rangeId },
            include: { snmpCommunity: true, location: true }
        });

        if (!range) {
            throw new Error(`Network range ${rangeId} not found`);
        }

        console.log(`[Discovery] Starting scan of ${range.subnet}`);
        const hosts = this.expandSubnet(range.subnet);
        const results: DiscoveryResult[] = [];

        // Prepara lista de comunidades para probing
        const allCommunities = await this.getEligibleCommunities();
        const communityList = range.snmpCommunity?.community
            ? [range.snmpCommunity.community, ...allCommunities.filter(c => c !== range.snmpCommunity?.community)]
            : allCommunities;

        // Processa em lotes (pools) para não sobrecarregar a rede ou o processo
        const batchSize = 25;
        let processed = 0;
        
        for (let i = 0; i < hosts.length; i += batchSize) {
            const batch = hosts.slice(i, i + batchSize);
            const batchResults = await Promise.all(
                batch.map(ip => this.scanHost(ip, communityList))
            );
            results.push(...batchResults.filter(r => r.isAlive));
            processed += batch.length;
            
            if (onProgress) {
                onProgress(Math.round((processed / hosts.length) * 100), results.length);
            }
        }

        console.log(`[Discovery] Found ${results.length} active hosts in ${range.subnet}`);

        // Persistência automática
        for (const result of results) {
            await this.createOrUpdateDevice(result, range.locationId || undefined);
        }

        // Atualiza a data do último scan no NetworkRange
        await prisma.networkRange.update({
            where: { id: rangeId },
            data: { lastScanAt: new Date() }
        });

        return results;
    }

    /**
     * Scan Raw Network - Varredura Direta Iterativa (NMAP/Ping + SNMP)
     * 
     * Realiza uma varredura sob demanda em uma subrede informada iterando
     * pelos IPs para fornecer um progresso linear na interface.
     * 
     * @param {string} subnet - Subrede em formato CIDR (ex: 192.168.1.0/24)
     * @param {'quick'|'deep'} intensity - Nível de detalhamento da varredura
     * @param {string} [snmpCommunity] - Comunidade específica para teste
     * @param {function} [onProgress] - Callback para reportar progresso
     */
    async scanRawNetwork(subnet: string, intensity: 'quick' | 'deep' = 'quick', snmpCommunity?: string, onProgress?: (progress: number, found: number) => void): Promise<any[]> {
        console.log(`[Discovery] Starting ${intensity} Scan of ${subnet}`);
        try {
            const allCommunities = await this.getEligibleCommunities();
            const communityList = snmpCommunity
                ? [snmpCommunity, ...allCommunities.filter(c => c !== snmpCommunity)]
                : allCommunities;

            const hosts = this.expandSubnet(subnet);
            const enrichedResults: DiscoveryResult[] = [];
            const batchSize = intensity === 'quick' ? 30 : 10;
            let processed = 0;

            for (let i = 0; i < hosts.length; i += batchSize) {
                const batch = hosts.slice(i, i + batchSize);
                
                // Em modo quick usamos nosso scanHost (Ping + Resolução + Portas Básicas + SNMP). Em deep, tentamos um scan mais completo e tolerante a firewall.
                const batchResults = await Promise.all(
                    batch.map(ip => this.scanHost(ip, intensity === 'deep' ? communityList : undefined, intensity))
                );
                
                const aliveHosts = batchResults.filter(r => r.isAlive);
                
                // Processar SNMP se quick (pois scanHost as vezes só pingou). Aliás, o scanHost já faz probe SNMP se a porta 161 responde!
                // Mas para garantir:
                const enrichedBatch = await Promise.all(aliveHosts.map(async (item) => {
                    const agent = Array.from(connectedAgents.entries()).find(([_, info]) => info.ipAddress === item.ip);
                    if (agent) {
                        item.agentId = agent[0];
                    }

                    // Se não tiver checado SNMP no scanHost (ex, porta bloqueada pro nmap/ping mas snmp habilitado), tentar aqui se for deep
                    if (intensity === 'deep' && communityList.length > 0 && !item.snmpAvailable && item.openPorts.includes(161)) {
                        try {
                            const snmpData = await snmpService.probeDevice(item.ip, communityList);
	                            if (snmpData) {
	                                item.snmpAvailable = true;
	                                item.snmpInterfaces = snmpData.interfaces;
	                                item.snmpCommunity = snmpData.community;
	                                item.hostname = snmpData.sysName || item.hostname;
                                (item as any).serialNumber = snmpData.serialNumber;
                                (item as any).model = snmpData.sysDescr || item.model;
                                if (snmpData.interfaces && snmpData.interfaces.length > 0) {
                                    const mainIface = snmpData.interfaces.find(i => i.operStatus === 1 && i.mac) || snmpData.interfaces[0];
                                    if (mainIface.mac) item.macAddress = mainIface.mac;
                                }
                            }
                        } catch (e) {}
                    }
                    
                    await this.createOrUpdateDevice(item);
                    return item;
                }));

                enrichedResults.push(...enrichedBatch);
                processed += batch.length;
                
                if (onProgress) {
                    onProgress(Math.round((processed / hosts.length) * 100), enrichedResults.length);
                }
            }

            return enrichedResults;
        } catch (error) {
            console.error('[Discovery] Raw scan error:', error);
            throw error;
        }
    }

    /**
     * Scan Host - Varredura de host individual
     * 
     * @private
     */
    private async scanHost(ip: string, snmpCommunities?: string[], intensity: 'quick' | 'deep' = 'quick'): Promise<DiscoveryResult> {
        const result: DiscoveryResult = {
            ip,
            isAlive: false,
            openPorts: [],
            snmpAvailable: false
        };

        // Teste de Ping (não é obrigatório para considerar o host vivo, pois firewalls podem bloquear ICMP)
        let pingSucceeded = false;
        try {
            const pingCmd = process.platform === 'win32'
                ? `ping -n 1 -w 1000 ${ip}`
                : `ping -c 1 -W 1 ${ip}`;

            await execAsync(pingCmd);
            pingSucceeded = true;
        } catch {
            pingSucceeded = false;
        }

        if (pingSucceeded) {
            result.isAlive = true;
        }

        // Verifica Agente
        const agent = Array.from(connectedAgents.entries()).find(([_, info]) => info.ipAddress === ip);
        if (agent) {
            result.agentId = agent[0];
        }

        // Resolução de Nome (Inversa)
        try {
            const { stdout } = await execAsync(`nslookup ${ip}`);
            const match = stdout.match(/name\s*=\s*([^\s]+)/i);
            if (match) result.hostname = match[1];
        } catch { }

        // Em modo deep, tenta identificar o host via NetBIOS/SMB quando o firewall bloqueia ICMP
        // e a resolução DNS é fraca. Não faz isso em quick scan para evitar tráfego broadcast
        if (intensity === 'deep' && (!result.hostname || result.hostname === ip)) {
            try {
                const netbiosName = await this.probeNetbiosName(ip);
                if (netbiosName) result.hostname = netbiosName;
            } catch { }
        }

        // Portas mais relevantes para descoberta de hosts Windows/Linux com firewall parcial
        const portsToCheck = intensity === 'deep'
            ? [22, 23, 53, 80, 88, 135, 139, 443, 445, 161, 3389, 5357, 5900, 5985, 5986, 8080, 8443, 3306, 5432]
            : [22, 80, 443, 161, 135, 139, 445, 3389, 5985, 5986, 5357];

        for (const port of portsToCheck) {
            if (await this.isPortOpen(ip, port)) {
                result.openPorts.push(port);
                result.isAlive = true;
            }
        }

        // Em modo deep, tentamos um scan mais agressivo com nmap se nenhuma porta ficou aberta
        if (intensity === 'deep' && result.openPorts.length === 0) {
            try {
                const nmapPorts = await this.probeHostWithNmap(ip);
                if (nmapPorts.length > 0) {
                    result.openPorts = nmapPorts;
                    result.isAlive = true;
                }
            } catch (err) {
                console.log(`[Discovery] nmap fallback failed for ${ip}:`, err);
            }
        }

        // SNMP Probe
        if (snmpCommunities && snmpCommunities.length > 0 && (result.openPorts.includes(161) || intensity === 'deep')) {
            try {
                const snmpData = await snmpService.probeDevice(ip, snmpCommunities);
	                if (snmpData) {
	                    result.snmpAvailable = true;
	                    result.snmpInterfaces = snmpData.interfaces;
	                    result.snmpCommunity = snmpData.community;
	                    result.hostname = snmpData.sysName || result.hostname;
                    (result as any).serialNumber = snmpData.serialNumber;
                    (result as any).model = snmpData.sysDescr;

                    // Set MAC from first active interface if possible
                    if (snmpData.interfaces && snmpData.interfaces.length > 0) {
                        const mainIface = snmpData.interfaces.find(i => i.operStatus === 1 && i.mac) || snmpData.interfaces[0];
                        if (mainIface.mac) result.macAddress = mainIface.mac;
                    }
                    result.isAlive = true;
                }
            } catch (err) {
                console.log(`[Discovery] SNMP failed for ${ip}:`, err);
            }
        }

        return result;
    }

    /**
     * Probe Host With Nmap - tenta um scan TCP mais completo para hosts que não respondem a ping
     * e que possuem firewall ou filtragem parcial.
     *
     * @private
     */
    private async probeHostWithNmap(ip: string): Promise<number[]> {
        const command = `nmap -Pn -T4 --host-timeout 8s --open -sT -p 22,23,53,80,88,135,139,443,445,161,3389,5357,5900,5985,5986,8080,8443,3306,5432 ${ip}`;
        const { stdout } = await execAsync(command);
        const ports = new Set<number>();

        for (const line of stdout.split(/\r?\n/)) {
            const match = line.match(/^(\d+)\/tcp\s+open\b/);
            if (match) {
                ports.add(Number(match[1]));
            }
        }

        return Array.from(ports).sort((a, b) => a - b);
    }

    /**
     * Probe NetBIOS/SMB Name - tenta descobrir um nome de host em ambientes Windows
     * mesmo sem DNS ou ICMP.
     *
     * @private
     */
    private async probeNetbiosName(ip: string): Promise<string | undefined> {
        const commands = [
            `nmblookup -A ${ip}`,
            `nmap -Pn -T4 --host-timeout 8s -p 139,445 --script smb-os-discovery ${ip}`
        ];

        for (const command of commands) {
            try {
                const { stdout } = await execAsync(command);
                const match = stdout.match(/name\s*=\s*([^\s]+)/i)
                    || stdout.match(/Computer name:\s*([^\s]+)/i)
                    || stdout.match(/NetBIOS name:\s*([^\s]+)/i)
                    || stdout.match(/name\s*<([^>]+)>/i);

                if (match?.[1]) {
                    const hostName = match[1].replace(/[()]/g, '').trim();
                    if (hostName && hostName.toLowerCase() !== 'unknown') {
                        return hostName;
                    }
                }
            } catch {
                // Ignora e tenta o próximo mecanismo
            }
        }

        return undefined;
    }

    /**
     * Is Port Open - Verificar se uma porta está aberta (Socket TCP)
     * 
     * @private
     */
    private async isPortOpen(ip: string, port: number): Promise<boolean> {
        return new Promise((resolve) => {
            const net = require('net');
            const socket = new net.Socket();

            const timeout = setTimeout(() => {
                socket.destroy();
                resolve(false);
            }, 1000);

            socket.connect(port, ip, () => {
                clearTimeout(timeout);
                socket.destroy();
                resolve(true);
            });

            socket.on('error', () => {
                clearTimeout(timeout);
                resolve(false);
            });
        });
    }

    /**
     * Expand Subnet - Expandir CIDR para lista de IPs
     * 
     * @private
     */
    private expandSubnet(subnet: string): string[] {
        const [baseIp, cidr] = subnet.split('/');
        const cidrNum = parseInt(cidr);

        if (cidrNum < 16 || cidrNum > 32) {
            throw new Error('Only /16 to /32 subnets are supported');
        }

        const parts = baseIp.split('.').map(Number);
        const hosts: string[] = [];
        const hostBits = 32 - cidrNum;
        const numHosts = Math.pow(2, hostBits);

        const start = cidrNum === 32 ? 0 : 1;
        const end = cidrNum === 32 ? 1 : numHosts - 1;

        for (let i = start; i < end; i++) {
            const lastOctet = (parts[3] + i) % 256;
            hosts.push(`${parts[0]}.${parts[1]}.${parts[2]}.${lastOctet}`);
        }

        return hosts;
    }

    /**
     * Create or Update Device - Persistir ativo descoberto
     * 
     * Se o dispositivo já existe (por IP ou AgentId), atualiza os dados.
     * Caso contrário, cria um novo registro e popula tabelas auxiliares (Hardware, Interfaces).
     * 
     * @private
     */
    private async createOrUpdateDevice(result: DiscoveryResult, locationId?: string) {
        let existing = null;

        // 1. Tentar por AgentId (Mais estável)
        if (result.agentId) {
            existing = await prisma.device.findUnique({
                where: { agentId: result.agentId }
            });
        }

        // 2. Se for agentless, tentar por Serial Number (SNMP)
        if (!existing && result.serialNumber) {
            existing = await prisma.device.findFirst({
                where: { assetNumber: result.serialNumber } // Mapeamos Serial para assetNumber no DB? Ou SerialNumber existe?
                // Verificando schema: SerialNumber está em Hardware, assetNumber está em Device.
                // Mas Device tem serialNumber? Não, Hardware tem.
            });
            
            // Re-verificando schema: Hardware.serialNumber, Device.assetNumber.
            // Vamos tentar buscar no Hardware primeiro se Serial for o identificador.
            if (!existing) {
                const hwMatch = await prisma.hardware.findFirst({
                    where: { serialNumber: result.serialNumber },
                    include: { device: true }
                });
                if (hwMatch) existing = hwMatch.device;
            }
        }

        // 3. Tentar por MAC Address
        if (!existing && result.macAddress) {
            existing = await prisma.device.findFirst({
                where: { macAddress: result.macAddress }
            });
        }

        // 4. Fallback por IP (Última opção, pode mudar)
        if (!existing) {
            existing = await prisma.device.findFirst({
                where: { ipAddress: result.ip }
            });
        }

        const deviceType = this.guessDeviceType(result);
        const snmpCommunity = result.snmpCommunity
            ? await prisma.snmpCommunity.findFirst({
                where: { community: { equals: result.snmpCommunity, mode: 'insensitive' } }
            })
            : null;

        if (existing) {
            // ATUALIZAÇÃO
            await prisma.device.update({
                where: { id: existing.id },
                data: {
                    status: 'ONLINE',
                    lastSeen: new Date(),
                    name: result.hostname && (existing.name.startsWith('Device-') || !existing.name)
                        ? result.hostname
                        : existing.name,
                    hostname: result.hostname || existing.hostname,
                    model: result.model || existing.model,
                    ipAddress: result.ip,
	                    agentId: result.agentId || existing.agentId,
	                    snmpCommunityId: snmpCommunity?.id || existing.snmpCommunityId
	                }
	            });
	        } else {
            // CRIACAO
            await assertCanCreateAsset();
            const device = await prisma.device.create({
                data: {
                    name: sanitizeSnmpString(result.hostname || `Device-${result.ip}`),
                    type: deviceType as any,
                    ipAddress: result.ip,
                    hostname: sanitizeSnmpString(result.hostname),
                    model: sanitizeSnmpString(result.model),
                    agentId: result.agentId,
	                    status: 'ONLINE',
	                    lastSeen: new Date(),
	                    locationId: locationId || undefined,
	                    snmpCommunityId: snmpCommunity?.id || undefined
	                }
	            });

            // Persiste Número de Série se encontrado
            if (result.serialNumber) {
                await prisma.hardware.upsert({
                    where: { deviceId: device.id },
                    create: {
                        deviceId: device.id,
                        serialNumber: result.serialNumber
                    },
                    update: {
                        serialNumber: result.serialNumber
                    }
                });
            }
        }

        // Atualização de Interfaces de Rede (SNMP)
        if (result.snmpInterfaces && result.snmpInterfaces.length > 0) {
            const device = await prisma.device.findFirst({
                where: { ipAddress: result.ip }
            });

            if (device) {
                await prisma.networkInterface.deleteMany({
                    where: { deviceId: device.id }
                });

                await prisma.networkInterface.createMany({
                    data: result.snmpInterfaces.map((iface: any) => ({
                        deviceId: device.id,
                        index: iface.index,
                        name: sanitizeSnmpString(iface.alias || iface.description || `if${iface.index}`),
                        description: sanitizeSnmpString(iface.description || ''),
                        type: iface.type || 'unknown',
                        macAddress: iface.mac || null,
                        speed: BigInt(iface.speed || 0),
                        status: iface.status || 'unknown'
                    }))
                });
            }
        }
    }

    /**
     * Guess Device Type - Heurística para tipo de dispositivo
     * 
     * @private
     */
    private guessDeviceType(result: DiscoveryResult): string {
        if (result.openPorts.includes(161)) return 'ROUTER';
        if (result.openPorts.includes(22)) return 'SERVER';
        if (result.openPorts.includes(80) || result.openPorts.includes(443)) return 'SERVER';
        return 'OTHER';
    }
}
