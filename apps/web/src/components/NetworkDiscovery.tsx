import { useState } from 'react';
import { trpc } from '../utils/trpc';
import { Play, Loader2, CheckCircle2, XCircle, Network as NetworkIcon, Search, PlusCircle, Globe, Cpu, Server, Shield, Zap, Activity, ScanLine, Radar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

/**
 * Componente NetworkDiscovery - Centro de Descoberta de Rede
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
export function NetworkDiscovery({ onNavigate }: { onNavigate?: (tab: any, subTab?: string) => void }) {
    const { t } = useLanguage();
    const [intensity, setIntensity] = useState<'quick' | 'deep'>('deep');
    const [selectedRangeId, setSelectedRangeId] = useState('');
    const [subnet, setSubnet] = useState('');
    const [snmpCommunity, setSnmpCommunity] = useState('irongrid');
    const [snmpCommunityId, setSnmpCommunityId] = useState('');
    const [activeScanId, setActiveScanId] = useState<string | null>(null);
    const [hoveredScanInfo, setHoveredScanInfo] = useState<{ title: string; desc: string; details: string[] } | null>(null);

    const utils = trpc.useContext();

    const { data: ranges = [] } = (trpc as any).snmp.listRanges.useQuery(undefined, {
        staleTime: 30000
    });

    const { data: snmpCommunities = [] } = (trpc as any).snmp.listCommunities.useQuery();
    const selectedCommunity = snmpCommunities.find((comm: any) => comm.id === snmpCommunityId);

    const { data: scanStatus } = (trpc as any).discovery.getScanResults.useQuery(
        { scanId: activeScanId || '' },
        {
            enabled: !!activeScanId,
            refetchInterval: (data: any) => {
                if (data?.status === 'completed' || data?.status === 'failed') return false;
                return 2000;
            }
        }
    );

    const rangeScanMutation = (trpc as any).discovery.scanRange.useMutation({
        onSuccess: (data: any) => {
            setActiveScanId(data.scanId);
        }
    });

    const quickScanMutation = (trpc as any).discovery.quickScan.useMutation({
        onSuccess: (data: any) => {
            setActiveScanId(data.scanId);
            setTimeout(() => {
                utils.scan.getDevices.invalidate();
                utils.inventory.getSoftwareInventoryFull.invalidate();
            }, 500);
        }
    });

    const scanInfo = {
        quick: {
            title: "FAST_SYNC_SCAN",
            desc: "Prioritize throughput and basic node identification.",
            details: ["ICMP ECHO DISCOVERY", "TCP_100_PORT_PROBE", "HOSTNAME_RESOLUTION"]
        },
        deep: {
            title: "DEEP_CORE_ANALYSIS",
            desc: "Comprehensive heuristic investigation and service mapping.",
            details: ["EXTENDED_PORT_MATRIX", "OS_FINGERPRINTING", "SNMP_HARDWARE_WALK"]
        },
        scheduled: {
            title: "PERSISTENT_RANGE_SYNC",
            desc: "Differential analysis for established network sectors.",
            details: ["FULL_CIDR_TRAVERSAL", "IPAM_SYNCHRONIZATION", "SCHEDULING_COMPLIANCE"]
        }
    };

    const getScanStatusIcon = () => {
        if (!scanStatus) return null;
        switch (scanStatus.status) {
            case 'running': return <Radar className="w-8 h-8 text-primary animate-spin" />;
            case 'completed': return <CheckCircle2 className="w-8 h-8 text-primary" />;
            case 'failed': return <XCircle className="w-8 h-8 text-error" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-gutter animate-in fade-in duration-700 pt-4 min-w-0">
            <div className="glass-panel p-4 sm:p-6 md:p-8 lg:p-12 border-white/5 bg-surface-container/95 backdrop-blur-none relative overflow-hidden shadow-2xl min-w-0">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
                
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 sm:gap-6 md:gap-8 lg:gap-12 mb-8 sm:mb-12 md:mb-16 relative z-10 min-w-0">
                    <div className="space-y-4 min-w-0">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 lg:gap-8 min-w-0">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-center shadow-[0_0_50px_rgba(var(--primary-fixed),0.1)] relative overflow-hidden group shrink-0">
                                <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                                <NetworkIcon className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-primary relative z-10 group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="min-w-0 max-w-full">
                                <h2 className="font-display-lg text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-primary uppercase tracking-tight italic leading-none break-words">{t('DISCOVERY_CONTROL')}</h2>
                                <div className="flex items-center gap-2 sm:gap-4 mt-2 flex-wrap">
                                    <span className="w-2 h-2 rounded-full bg-primary animate-ping shrink-0" />
                                    <p className="font-label-caps text-[9px] sm:text-[10px] md:text-[11px] lg:text-[12px] text-on-surface-variant uppercase tracking-[0.08em] sm:tracking-[0.14em] md:tracking-[0.22em] lg:tracking-[0.3em] italic opacity-70 break-words">Automated Asset Ingestion Protocol // Sector Delta Override</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-4 md:gap-6 w-full xl:w-auto min-w-0">
                        <div className="bg-surface-container-high/40 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-xl border border-white/5 flex items-center gap-2 sm:gap-4 md:gap-6 overflow-hidden w-full xl:w-auto min-w-0">
                            <div className="space-y-1 min-w-0 flex-1">
                                <span className="font-label-caps text-[7px] sm:text-[8px] md:text-[9px] text-on-surface-variant uppercase tracking-widest opacity-40 line-clamp-1">{t('ACTIVE_RESOURCES')}</span>
                                <p className="font-data-mono text-xs sm:text-sm md:text-lg text-primary font-black truncate">2.4k_NODES</p>
                            </div>
                            <div className="w-px h-8 sm:h-10 bg-white/10 shrink-0" />
                            <div className="space-y-1 min-w-0 flex-1">
                                <span className="font-label-caps text-[7px] sm:text-[8px] md:text-[9px] text-on-surface-variant uppercase tracking-widest opacity-40 line-clamp-1">{t('GRID_STABILITY')}</span>
                                <p className="font-data-mono text-xs sm:text-sm md:text-lg text-secondary-fixed font-black truncate">99.8%</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 md:gap-8 lg:gap-10">
                    <div className="xl:col-span-8 grid grid-cols-1 2xl:grid-cols-2 gap-px bg-white/10 border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative min-w-0">
                        {/* MANUAL SYNC */}
                        <div className="bg-surface-container-high/40 p-6 sm:p-8 md:p-12 space-y-6 sm:space-y-8 md:space-y-10 relative group transition-all hover:bg-surface-container-highest/60">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                                <Search size={120} className="text-primary" />
                            </div>
                            
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <h3 className="font-display-lg text-sm sm:text-base md:text-lg text-primary uppercase tracking-tighter italic flex items-center gap-2 sm:gap-4 flex-wrap">
                                    <Zap size={16} className="sm:w-5 sm:h-5 md:w-[20px] md:h-[20px] animate-pulse" /> {t('MANUAL_SYNC_INIT')}
                                </h3>
                                <div className="px-2 sm:px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg">
                                    <span className="font-data-mono text-[7px] sm:text-[8px] md:text-[9px] text-primary font-black">SEC_LEVEL_01</span>
                                </div>
                            </div>
                            
                            <div className="space-y-8">
                                <div className="space-y-2 sm:space-y-3">
                                    <label className="font-label-caps text-[8px] sm:text-[9px] md:text-[10px] text-on-surface-variant/40 uppercase tracking-[0.2em] sm:tracking-[0.25em] md:tracking-[0.3em] ml-1 italic">{t('NETWORK_CIDR_MATRIX')}</label>
                                    <input
                                        value={subnet}
                                        onChange={e => setSubnet(e.target.value)}
                                        placeholder="192.168.1.0/24"
                                        className="h-10 sm:h-12 md:h-16 !bg-surface-container-highest/60 border-white/5 font-data-mono text-[9px] sm:text-xs uppercase tracking-widest px-3 sm:px-4 md:px-6 focus:border-primary/50 transition-all rounded-xl w-full"
                                    />
                                </div>
                                <div className="space-y-2 sm:space-y-3">
                                    <label className="font-label-caps text-[8px] sm:text-[9px] md:text-[10px] text-on-surface-variant/40 uppercase tracking-[0.2em] sm:tracking-[0.25em] md:tracking-[0.3em] ml-1 italic">Comunidade SNMP existente</label>
                                    <select
                                        value={snmpCommunityId}
                                        onChange={e => {
                                            const id = e.target.value;
                                            setSnmpCommunityId(id);
                                            const comm = snmpCommunities.find((c: any) => c.id === id);
                                            if (comm) {
                                                setSnmpCommunity(comm.community || '');
                                            }
                                        }}
                                        className="h-10 sm:h-12 md:h-16 w-full bg-surface-container-highest/60 border-white/5 text-[9px] sm:text-xs uppercase tracking-widest px-3 sm:px-4 md:px-6 focus:border-primary/50 transition-all rounded-xl"
                                    >
                                        <option value="">Escolher comunidade existente</option>
                                        {snmpCommunities.map((comm: any) => (
                                            <option key={comm.id} value={comm.id}>{comm.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2 sm:space-y-3">
                                    <label className="font-label-caps text-[8px] sm:text-[9px] md:text-[10px] text-on-surface-variant/40 uppercase tracking-[0.2em] sm:tracking-[0.25em] md:tracking-[0.3em] ml-1 italic">Comunidade SNMP customizada</label>
                                    <input
                                        value={snmpCommunity}
                                        onChange={e => {
                                            const value = e.target.value;
                                            if (snmpCommunityId && selectedCommunity?.community !== value) {
                                                setSnmpCommunityId('');
                                            }
                                            setSnmpCommunity(value);
                                        }}
                                        placeholder="Ex: public / private"
                                        className="h-10 sm:h-12 md:h-16 !bg-surface-container-highest/60 border-white/5 font-data-mono text-[9px] sm:text-xs uppercase tracking-widest px-3 sm:px-4 md:px-6 focus:border-primary/50 transition-all rounded-xl w-full"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 sm:space-y-4">
                                <label className="font-label-caps text-[8px] sm:text-[9px] md:text-[10px] text-on-surface-variant/40 uppercase tracking-[0.2em] sm:tracking-[0.25em] md:tracking-[0.3em] ml-1 italic">{t('SCAN_INTENSITY_PROTOCOL')}</label>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                                    <button
                                        onClick={() => setIntensity('quick')}
                                        onMouseEnter={() => setHoveredScanInfo(scanInfo.quick)}
                                        onMouseLeave={() => setHoveredScanInfo(null)}
                                        className={`p-4 sm:p-5 md:p-6 rounded-xl border transition-all text-left flex flex-col items-stretch gap-2 relative overflow-hidden min-w-0 ${intensity === 'quick' ? 'bg-primary/10 border-primary/40 shadow-[0_0_20px_rgba(var(--primary-fixed),0.1)]' : 'bg-surface-container-highest border-white/5 hover:border-white/20'}`}
                                    >
                                        <div className="flex items-center justify-between gap-2 min-w-0">
                                            <span className={`font-display-lg text-[12px] sm:text-[13px] uppercase italic tracking-tight whitespace-normal break-words min-w-0 leading-tight ${intensity === 'quick' ? 'text-primary font-black' : 'text-on-surface-variant'}`}>{t('FAST_SYNC')}</span>
                                            <ScanLine size={14} className={intensity === 'quick' ? 'text-primary' : 'text-on-surface-variant/20'} />
                                        </div>
                                        <span className="font-data-mono text-[8px] sm:text-[9px] text-on-surface-variant/60 uppercase italic tracking-[0.08em] break-words leading-tight">THROUGHPUT_MAX</span>
                                    </button>
                                    <button
                                        onClick={() => setIntensity('deep')}
                                        onMouseEnter={() => setHoveredScanInfo(scanInfo.deep)}
                                        onMouseLeave={() => setHoveredScanInfo(null)}
                                        className={`p-4 sm:p-5 md:p-6 rounded-xl border transition-all text-left flex flex-col items-stretch gap-2 relative overflow-hidden min-w-0 ${intensity === 'deep' ? 'bg-secondary-fixed/10 border-secondary-fixed/40 shadow-[0_0_20px_rgba(var(--secondary-fixed),0.1)]' : 'bg-surface-container-highest border-white/5 hover:border-white/20'}`}
                                    >
                                        <div className="flex items-center justify-between gap-2 min-w-0">
                                            <span className={`font-display-lg text-[12px] sm:text-[13px] uppercase italic tracking-tight whitespace-normal break-words min-w-0 leading-tight ${intensity === 'deep' ? 'text-secondary-fixed font-black' : 'text-on-surface-variant'}`}>{t('DEEP_PROBE')}</span>
                                            <Activity size={14} className={intensity === 'deep' ? 'text-secondary-fixed' : 'text-on-surface-variant/20'} />
                                        </div>
                                        <span className="font-data-mono text-[8px] sm:text-[9px] text-on-surface-variant/60 uppercase italic tracking-[0.08em] break-words leading-tight">HEURISTIC_MODE</span>
                                    </button>
                                </div>
                            </div>

                            <div className="pt-6 space-y-4">
                                <button
                                    onClick={() => subnet && quickScanMutation.mutate({ subnet, intensity, snmpCommunity })}
                                    disabled={!subnet || quickScanMutation.isPending}
                                    className="cyber-button w-full min-h-12 sm:min-h-14 md:min-h-16 h-auto flex items-center justify-center gap-2 sm:gap-4 !bg-primary text-black border-primary font-display-lg text-sm sm:text-base md:text-lg uppercase italic tracking-tight shadow-[0_0_30px_rgba(var(--primary-fixed),0.3)] whitespace-normal leading-snug px-4 sm:px-6 py-3 sm:py-4 text-center"
                                >
                                    {quickScanMutation.isPending ? <Loader2 size={24} className="animate-spin shrink-0" /> : <Play size={24} className="shrink-0" />}
                                    <span className="min-w-0 break-words">{t('INITIALIZE_SYNC_STREAM')}</span>
                                </button>
                                
                                <button 
                                    onClick={() => onNavigate?.('networkMgmt', 'communities')}
                                    className="w-full min-h-10 sm:min-h-12 h-auto font-label-caps text-[8px] sm:text-[9px] md:text-[10px] text-primary/60 hover:text-primary uppercase tracking-[0.12em] sm:tracking-[0.24em] md:tracking-[0.32em] bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-xl transition-all italic px-3 py-3 whitespace-normal leading-snug text-center break-words"
                                >
                                    {t('AUTH_MATRIX_MGMT')}
                                </button>
                            </div>
                        </div>

                        {/* RANGE SYNC */}
                        <div className="bg-surface-container-high/40 p-6 sm:p-8 md:p-12 space-y-6 sm:space-y-8 md:space-y-10 relative group transition-all hover:bg-surface-container-highest/60 border-l border-white/10">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                                <Shield size={120} className="text-secondary-fixed" />
                            </div>
                            
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <h3 className="font-display-lg text-sm sm:text-base md:text-lg text-secondary-fixed uppercase tracking-tighter italic flex items-center gap-2 sm:gap-4 flex-wrap">
                                    <PlusCircle size={16} className="sm:w-5 sm:h-5 md:w-[20px] md:h-[20px]" /> {t('SECTOR_RANGE_SYNC')}
                                </h3>
                                <div className="px-2 sm:px-3 py-1 bg-secondary-fixed/10 border border-secondary-fixed/20 rounded-lg">
                                    <span className="font-data-mono text-[7px] sm:text-[8px] md:text-[9px] text-secondary-fixed font-black">SEC_LEVEL_02</span>
                                </div>
                            </div>

                            <div className="space-y-6 sm:space-y-8 md:space-y-8">
                                <div className="space-y-2 sm:space-y-3">
                                    <label className="font-label-caps text-[8px] sm:text-[9px] md:text-[10px] text-on-surface-variant/40 uppercase tracking-[0.2em] sm:tracking-[0.25em] md:tracking-[0.3em] ml-1 italic">{t('TARGET_OPERATIONAL_SECTOR')}</label>
                                    <div className="relative group">
                                        <select
                                            value={selectedRangeId}
                                            onChange={e => setSelectedRangeId(e.target.value)}
                                            className="h-10 sm:h-12 md:h-16 w-full !bg-surface-container-highest/60 border-white/5 font-data-mono text-[9px] sm:text-xs uppercase tracking-widest px-3 sm:px-4 md:px-6 focus:border-secondary-fixed/50 transition-all rounded-xl appearance-none pr-10 sm:pr-12"
                                        >
                                            <option value="">SELECT_DEFINED_RANGE_PROTOCOL</option>
                                            {(ranges as any[])?.filter((r: any) => r.enabled).map((r: any) => (
                                                <option key={r.id} value={r.id}>{r.name.toUpperCase()} // CIDR:{r.subnet}</option>
                                            ))}
                                        </select>
                                        <PlusCircle className="absolute right-3 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-secondary-fixed opacity-40 pointer-events-none" />
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {selectedRangeId && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-8 bg-surface-container-highest/60 border border-secondary-fixed/10 rounded-2xl space-y-6 shadow-xl relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-secondary-fixed/5 rounded-bl-[100px] border-b border-l border-secondary-fixed/10" />
                                            
                                            <div className="flex justify-between items-center relative z-10">
                                                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest italic opacity-60">{t('LAST_CORE_EXECUTION')}</span>
                                                <span className="font-data-mono text-[11px] text-on-surface uppercase font-black">
                                                    {(() => {
                                                        const range = ranges.find((r: any) => r.id === selectedRangeId);
                                                        return range?.lastScanAt ? new Date(range.lastScanAt).toLocaleTimeString() : t('GRID_NEVER_SYNCED');
                                                    })()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center relative z-10">
                                                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest italic opacity-60">{t('AUTO_SYNC_INTERVAL')}</span>
                                                <span className="font-data-mono text-[11px] text-secondary-fixed uppercase font-black bg-secondary-fixed/10 px-2 py-0.5 rounded">
                                                    {(() => {
                                                        const range = ranges.find((r: any) => r.id === selectedRangeId);
                                                        return `${range?.scanIntervalDays || 7}D_CYCLE_PERSISTENT`;
                                                    })()}
                                                </span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="pt-4 sm:pt-6 space-y-3 sm:space-y-4">
                                <button
                                    onClick={() => selectedRangeId && rangeScanMutation.mutate({ rangeId: selectedRangeId })}
                                    disabled={!selectedRangeId || rangeScanMutation.isPending}
                                    className="cyber-button w-full min-h-12 sm:min-h-14 md:min-h-16 h-auto flex items-center justify-center gap-2 sm:gap-4 !bg-secondary-fixed text-black border-secondary-fixed font-display-lg text-sm sm:text-base uppercase italic tracking-tight shadow-[0_0_30px_rgba(var(--secondary-fixed),0.3)] whitespace-normal leading-snug px-4 sm:px-6 py-3 sm:py-4 text-center"
                                >
                                    {rangeScanMutation.isPending ? <Loader2 size={24} className="animate-spin shrink-0" /> : <Play size={24} className="shrink-0" />}
                                    <span className="min-w-0 break-words">{t('EXECUTE_SECTOR_SYNC')}</span>
                                </button>
                                
                                <button 
                                    onClick={() => onNavigate?.('networkMgmt', 'ranges')}
                                    className="w-full min-h-10 sm:min-h-12 h-auto font-label-caps text-[8px] sm:text-[9px] md:text-[10px] text-secondary-fixed/60 hover:text-secondary-fixed uppercase tracking-[0.12em] sm:tracking-[0.24em] md:tracking-[0.32em] bg-secondary-fixed/5 hover:bg-secondary-fixed/10 border border-secondary-fixed/10 rounded-xl transition-all italic px-3 py-3 whitespace-normal leading-snug text-center break-words"
                                >
                                    {t('SECTOR_GRID_MGMT')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SCAN MONITOR */}
                    <div className="xl:col-span-4 bg-surface-container-high/20 border border-white/5 rounded-2xl p-6 sm:p-8 md:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-inner min-h-[300px] sm:min-h-[400px] md:min-h-[500px]">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                        
                        <AnimatePresence mode="wait">
                            {!activeScanId ? (
                                <motion.div 
                                    key="idle"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.1 }}
                                    className="space-y-6 sm:space-y-8 md:space-y-10 min-w-0"
                                >
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-surface-container-highest rounded-full flex items-center justify-center border border-white/10 mx-auto relative group-hover:border-primary/40 transition-all shadow-2xl">
                                        <div className="absolute inset-0 bg-primary/5 rounded-full animate-ping opacity-20" />
                                        <Globe size={32} className="sm:w-10 sm:h-10 md:w-12 md:h-12 text-on-surface-variant/20 group-hover:text-primary transition-all group-hover:scale-110" />
                                    </div>
                                    <div className="space-y-3 sm:space-y-4">
                                        <p className="font-display-lg text-base sm:text-lg md:text-xl text-on-surface-variant/40 uppercase tracking-[0.08em] sm:tracking-[0.16em] md:tracking-[0.24em] italic font-black break-words">{t('AWAITING_SYNC_PROTOCOL')}</p>
                                        <p className="font-label-caps text-[8px] sm:text-[9px] md:text-[10px] text-on-surface-variant/20 uppercase tracking-[0.12em] sm:tracking-[0.22em] md:tracking-[0.32em] italic break-words">{t('INITIALIZE_SCAN_SUBTITLE') || 'Initialize Scan Matrix to Begin'}</p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="active"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="w-full h-full flex flex-col"
                                >
                                    <div className="flex items-center justify-between text-left mb-6 sm:mb-8 md:mb-12 gap-4 flex-wrap">
                                        <div className="min-w-0">
                                            <h3 className="font-display-lg text-lg sm:text-xl md:text-2xl text-on-surface uppercase tracking-tighter italic">{t('PROTOCOL_ACTIVE')}</h3>
                                            <p className="font-data-mono text-[8px] sm:text-[9px] md:text-[10px] text-primary uppercase tracking-widest font-black opacity-60 truncate">{activeScanId ? `CID: ${activeScanId.slice(0, 24).toUpperCase()}` : ''}</p>
                                        </div>
                                        <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl border border-primary/20 shadow-[0_0_20px_rgba(var(--primary-fixed),0.2)] shrink-0">
                                            {getScanStatusIcon()}
                                        </div>
                                    </div>

                                    <div className="space-y-4 sm:space-y-6 md:space-y-6 mb-6 sm:mb-8 md:mb-12">
                                        <div className="flex justify-between items-end px-2 gap-4 flex-wrap">
                                            <span className="font-label-caps text-[9px] sm:text-[10px] md:text-[11px] text-on-surface-variant uppercase tracking-[0.1em] sm:tracking-[0.15em] md:tracking-[0.2em] italic font-black opacity-40">{t('GRID_INGESTION')}</span>
                                            <span className="font-display-lg text-3xl sm:text-4xl md:text-5xl text-primary italic font-black">{scanStatus?.progress || 0}%</span>
                                        </div>
                                        <div className="w-full h-4 bg-surface-container-highest rounded-full overflow-hidden border border-white/10 p-[2px] shadow-inner relative">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${scanStatus?.progress || 0}%` }}
                                                className="bg-gradient-to-r from-primary/80 to-primary h-full rounded-full transition-all shadow-[0_0_20px_rgba(var(--primary-fixed),0.4)] relative"
                                            >
                                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                            </motion.div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-12">
                                        <div className="bg-surface-container-highest/40 p-4 sm:p-5 md:p-6 rounded-2xl border border-white/5 text-left relative overflow-hidden group/card">
                                            <div className="absolute top-0 right-0 p-2 sm:p-3 opacity-[0.05]">
                                                <ScanLine size={24} className="sm:w-8 sm:h-8 md:w-8 md:h-8 text-primary" />
                                            </div>
                                            <p className="font-label-caps text-[7px] sm:text-[8px] md:text-[9px] text-on-surface-variant uppercase tracking-widest mb-2 sm:mb-3 italic opacity-40 line-clamp-1">{t('ENGINE_MODE')}</p>
                                            <p className="font-data-mono text-[10px] sm:text-[11px] md:text-[12px] text-primary uppercase font-black tracking-tighter truncate">{scanStatus?.status || 'INITIALIZING...'}</p>
                                        </div>
                                        <div className="bg-surface-container-highest/40 p-4 sm:p-5 md:p-6 rounded-2xl border border-white/5 text-left relative overflow-hidden group/card">
                                            <div className="absolute top-0 right-0 p-2 sm:p-3 opacity-[0.05]">
                                                <Radar size={24} className="sm:w-8 sm:h-8 md:w-8 md:h-8 text-secondary-fixed" />
                                            </div>
                                            <p className="font-label-caps text-[7px] sm:text-[8px] md:text-[9px] text-on-surface-variant uppercase tracking-widest mb-2 sm:mb-3 italic opacity-40 line-clamp-1">{t('NODES_IDENTIFIED')}</p>
                                            <p className="font-display-lg text-2xl sm:text-2xl md:text-3xl text-secondary-fixed italic font-black">{scanStatus?.found || 0}</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-hidden flex flex-col">
                                        <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                                            <div className="h-px flex-1 bg-white/5" />
                                            <span className="font-label-caps text-[7px] sm:text-[8px] md:text-[10px] text-on-surface-variant/40 uppercase tracking-[0.2em] sm:tracking-[0.3em] md:tracking-[0.4em] italic">{t('INGESTION_STREAM')}</span>
                                            <div className="h-px flex-1 bg-white/5" />
                                        </div>
                                        
                                        <div className="flex-1 overflow-y-auto pr-2 sm:pr-3 custom-scrollbar space-y-2 sm:space-y-3">
                                            {scanStatus?.results?.length ? (
                                                scanStatus.results.map((device: any, idx: number) => (
                                                    <motion.div 
                                                        key={idx} 
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className="flex items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-surface-container-highest/20 border border-white/5 rounded-xl hover:bg-primary/5 hover:border-primary/20 transition-all group/item min-w-0"
                                                    >
                                                        <div className="flex items-center gap-2 sm:gap-4 text-left min-w-0 flex-1">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-surface-container-highest rounded-xl flex items-center justify-center border border-white/5 group-hover/item:border-primary/40 transition-all group-hover/item:scale-105 shrink-0">
                                                                <Server size={14} className="sm:w-5 sm:h-5 md:w-5 md:h-5 text-on-surface-variant/40 group-hover/item:text-primary transition-colors" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className="font-display-lg text-[12px] text-on-surface uppercase tracking-tight truncate italic">{device.hostname || 'UNDEFINED_NODE'}</h4>
                                                                <p className={`font-data-mono text-[7px] sm:text-[8px] md:text-[9px] uppercase tracking-widest font-black ${device.snmpAvailable ? 'text-emerald-400' : 'text-rose-400'} line-clamp-1`}>{device.snmpAvailable ? 'SNMP ATIVO' : 'SNMP INATIVO'}</p>
                                                                <p className="font-data-mono text-[7px] sm:text-[8px] md:text-[9px] text-primary/60 uppercase tracking-widest font-black group-hover/item:text-primary transition-colors truncate">{device.ip}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 sm:gap-2 shrink-0 flex-wrap justify-end max-w-[35%] sm:max-w-none">
                                            {device.agentId && <span className="px-1.5 sm:px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md font-data-mono text-[7px] sm:text-[8px] font-black uppercase tracking-tighter shadow-sm whitespace-nowrap">AGENT</span>}
                                                            {device.snmpAvailable && <span className="px-1.5 sm:px-2 py-0.5 bg-secondary-fixed/10 text-secondary-fixed border border-secondary-fixed/20 rounded-md font-data-mono text-[7px] sm:text-[8px] font-black uppercase tracking-tighter shadow-sm whitespace-nowrap">SNMP</span>}
                                                        </div>
                                                    </motion.div>
                                                ))
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20 py-20 italic">
                                                    <Loader2 size={32} className="animate-spin" />
                                                    <span className="font-label-caps text-[9px] sm:text-[11px] uppercase tracking-[0.14em] sm:tracking-[0.3em] break-words text-center">SYNCHRONIZING_BUFFERS...</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {scanStatus?.status === 'completed' && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="pt-6 sm:pt-8 border-t border-white/10 w-full"
                                        >
                                            <p className="font-display-lg text-[11px] sm:text-[13px] text-primary uppercase italic flex items-center justify-center gap-2 sm:gap-3 font-black shadow-primary/20 text-center break-words">
                                                <CheckCircle2 size={18} className="shrink-0" /> {t('INVENTORY_SYNC_SYNCHRONIZED')}
                                            </p>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* INFO GLOSSARY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 min-w-0">
                <DiscoveryInfoCard
                    number="01"
                    title={t('PHYSICAL_MAPPING')}
                    desc={t('PHYSICAL_MAPPING_DESC') || 'Broadcast ICMP echo requests to identify hardware active in the grid grid-topology.'}
                    icon={Globe}
                    color="text-primary"
                />
                <DiscoveryInfoCard
                    number="02"
                    title={t('HEURISTIC_PROBE')}
                    desc={t('HEURISTIC_PROBE_DESC') || 'Service fingerprinting to classify nodes by protocol availability and security level.'}
                    icon={Cpu}
                    color="text-secondary-fixed"
                />
                <DiscoveryInfoCard
                    number="03"
                    title={t('AUTO_INGESTION')}
                    desc={t('AUTO_INGESTION_DESC') || 'Direct commit to central inventory with timestamped existence tracking and history.'}
                    icon={Server}
                    color="text-primary"
                />
            </div>

            {/* FOOTER FEEDBACK (HOVER) */}
            <AnimatePresence>
                {hoveredScanInfo && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        className="fixed bottom-4 sm:bottom-6 lg:bottom-12 left-4 right-4 sm:left-gutter sm:right-gutter z-50 max-h-[45vh] sm:h-auto lg:h-32 glass-panel p-4 sm:p-6 lg:p-10 flex items-start lg:items-center shadow-[0_-20px_60px_rgba(0,0,0,0.5)] border-primary/20 bg-black/80 backdrop-blur-none overflow-y-auto lg:overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-12 w-full min-w-0">
                            <div className="flex items-center gap-4 lg:gap-8 lg:border-r border-white/10 lg:pr-12 lg:h-16 min-w-0">
                                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(var(--primary-fixed),0.2)] relative overflow-hidden shrink-0">
                                    <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                                    <Radar className="w-6 h-6 lg:w-8 lg:h-8 text-primary relative z-10" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-display-lg text-base sm:text-lg lg:text-2xl text-primary uppercase tracking-tight italic leading-tight break-words">{t(hoveredScanInfo.title) || hoveredScanInfo.title}</p>
                                    <p className="font-label-caps text-[9px] sm:text-[10px] lg:text-[12px] text-on-surface-variant uppercase tracking-[0.08em] sm:tracking-[0.14em] lg:tracking-[0.2em] mt-2 italic opacity-60 break-words">{t(hoveredScanInfo.desc) || hoveredScanInfo.desc}</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 lg:gap-12 flex-1 lg:justify-around min-w-0">
                                {hoveredScanInfo.details.map((detail, idx) => (
                                    <div key={idx} className="flex items-center gap-3 lg:gap-4 group/detail min-w-0">
                                        <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-fixed),0.8)] group-hover/detail:scale-150 transition-transform shrink-0" />
                                        <span className="font-data-mono text-[9px] sm:text-[10px] lg:text-[11px] text-on-surface uppercase tracking-[0.08em] sm:tracking-[0.16em] lg:tracking-[0.3em] font-black italic break-words min-w-0">{t(detail) || detail}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function DiscoveryInfoCard({ number, title, desc, icon: Icon, color }: any) {
    return (
        <div className="glass-panel p-5 sm:p-8 lg:p-12 hover:bg-primary/5 transition-all group border-white/5 relative overflow-hidden bg-surface-container/95 backdrop-blur-none min-w-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[150px] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start gap-4 mb-6 sm:mb-8 lg:mb-10 relative z-10">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-surface-container-highest rounded-2xl border border-white/5 flex items-center justify-center ${color} shadow-2xl group-hover:scale-110 group-hover:border-primary/20 transition-all shrink-0`}>
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9" />
                </div>
                <span className="font-display-lg text-4xl sm:text-5xl lg:text-6xl text-on-surface-variant/5 italic group-hover:text-primary/10 transition-colors font-black leading-none">{number}</span>
            </div>
            <h4 className="font-display-lg text-lg sm:text-xl lg:text-2xl text-on-surface uppercase tracking-tight mb-3 sm:mb-4 italic group-hover:text-primary transition-colors break-words">{title}</h4>
            <p className="font-label-caps text-[10px] sm:text-[11px] lg:text-[12px] text-on-surface-variant uppercase tracking-[0.06em] sm:tracking-[0.08em] lg:tracking-[0.1em] leading-relaxed italic opacity-60 group-hover:opacity-100 transition-opacity break-words">{desc}</p>
        </div>
    );
}
