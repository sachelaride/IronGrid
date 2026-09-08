import { useState, useEffect, useRef } from 'react';
import { trpc } from '../utils/trpc';
import {
    Terminal, Search, Trash2, Play, Square,
    Info, RefreshCw, Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useLanguage } from '../context/LanguageContext';

/**
 * AuditSyslogView - Remote Log Ingestion & Forensic Auditing.
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
export function AuditSyslogView({ onNavigateSubTab }: { onNavigateSubTab?: (sub: string) => void }) {
    const { t } = useLanguage();
    const [isLive, setIsLive] = useState(true);
    const [search, setSearch] = useState('');
    const [minSeverity, setMinSeverity] = useState<number>(7);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('all');
    const [logs, setLogs] = useState<any[]>([]);
    const [customPort, setCustomPort] = useState<number>(1514);
    const [isEditingPort, setIsEditingPort] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Get devices for filter
    const { data: devicesData = [] } = (trpc as any).scan.getDevices.useQuery({});
    const devices = Array.isArray(devicesData) ? devicesData : (devicesData as any)?.devices ?? [];

    // Get initial logs and poll for updates every 3 seconds
    const recentLogsQuery = (trpc as any).syslog.getRecentMessages.useQuery(
        { limit: 100 },
        {
            enabled: isLive,
            refetchInterval: isLive ? 3000 : false,
            refetchOnWindowFocus: false
        }
    );

    const statusQuery = (trpc as any).syslog.getStatus.useQuery(undefined, {
        refetchInterval: 5000,
        onSuccess: (data: any) => {
            if (!isEditingPort) setCustomPort(data.port);
        }
    });

    const startMutation = (trpc as any).syslog.start.useMutation({ onSuccess: () => statusQuery.refetch() });
    const stopMutation = (trpc as any).syslog.stop.useMutation({ onSuccess: () => statusQuery.refetch() });
    const updateConfigMutation = (trpc as any).syslog.updateConfig.useMutation({
        onSuccess: () => {
            statusQuery.refetch();
            setIsEditingPort(false);
            setIsLive(true);
        }
    });

    const triggerCleanup = (trpc as any).syslog.triggerCleanup.useMutation({
        onSuccess: () => {
            cleanupStatusQuery.refetch();
        }
    });

    const cleanupStatusQuery = (trpc as any).syslog.getCleanupStatus.useQuery(undefined, {
        enabled: true,
        refetchInterval: (data: any) => data?.isCleaning ? 2000 : false
    });

    const clearAllMutation = (trpc as any).syslog.clearAll.useMutation({
        onSuccess: () => {
            setLogs([]);
            statusQuery.refetch();
        }
    });

    const reclaimSpaceMutation = (trpc as any).syslog.reclaimSpace.useMutation({
        onSuccess: () => {
            statusQuery.refetch();
        }
    });

    useEffect(() => {
        if (recentLogsQuery.data) {
            setLogs(recentLogsQuery.data.slice().reverse());
        }
    }, [recentLogsQuery.data]);

    const getSeverityStyle = (sev: number) => {
        switch (sev) {
            case 0: // Emergency
            case 1: // Alert
            case 2: // Critical
                return 'text-error bg-error/10 border-error/20';
            case 3: // Error
                return 'text-error/80 bg-error/5 border-error/10';
            case 4: // Warning
                return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            default:
                return 'text-primary bg-primary/10 border-primary/20';
        }
    };

    const getSeverityLabel = (sev: number) => {
        const labels = ['EMERGENCY', 'ALERT', 'CRITICAL', 'ERROR', 'WARNING', 'NOTICE', 'INFO', 'DEBUG'];
        return labels[sev] || 'UNKNOWN';
    };

    const filteredLogs = logs.filter(log => {
        const matchSearch = !search ||
            log.message.toLowerCase().includes(search.toLowerCase()) ||
            log.hostname.toLowerCase().includes(search.toLowerCase()) ||
            log.tag.toLowerCase().includes(search.toLowerCase());
        const matchSeverity = log.severity <= minSeverity;

        const device = devices.find((d: any) => d.id === selectedDeviceId);
        const matchDevice = selectedDeviceId === 'all' ||
            log.deviceId === selectedDeviceId ||
            (device && (
                log.hostname === device.ipAddress ||
                log.hostname === device.hostname ||
                log.hostname === device.name ||
                log.hostname.startsWith(device.name || '') ||
                log.hostname.startsWith(device.hostname || '')
            ));

        return matchSearch && matchSeverity && matchDevice;
    });

    const rowVirtualizer = useVirtualizer({
        count: filteredLogs.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 40,
        overscan: 20,
    });

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] min-h-[500px] space-y-gutter animate-in fade-in duration-700">
            {/* Header & Controls */}
            <div className="glass-panel p-10 border-white/5 bg-surface-container/95 shrink-0">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-5 bg-primary/10 border border-primary/20 rounded shadow-[0_0_20px_rgba(var(--primary-fixed),0.1)]">
                            <Terminal size={32} className="text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="font-display-lg text-3xl text-primary uppercase tracking-tighter italic">{t('SYSLOG_FORENSIC_STREAM')}</h2>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full ${statusQuery.data?.isRunning ? 'bg-primary status-glow-primary' : 'bg-error shadow-[0_0_10px_rgba(var(--error),0.5)]'}`}></div>
                                    <span className={`font-data-mono text-[10px] uppercase tracking-widest ${statusQuery.data?.isRunning ? 'text-primary' : 'text-error'}`}>
                                        {statusQuery.data?.isRunning ? `${t('SERVICE_ACTIVE_PORT')} ${statusQuery.data?.port}` : t('SERVICE_OFFLINE')}
                                    </span>
                                </div>
                                {statusQuery.data?.lastError && (
                                    <span className="font-data-mono text-[9px] text-error uppercase font-black animate-pulse bg-error/10 px-3 py-1 rounded border border-error/20 truncate max-w-md">ERR_{statusQuery.data.lastError}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* PORT CONTROL */}
                        <div className="h-14 flex items-center gap-4 px-6 bg-surface-container rounded border border-white/5 group hover:border-primary/20 transition-all">
                            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest opacity-60">{t('PORT_IDENTIFIER')}:</span>
                            {isEditingPort ? (
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        value={customPort}
                                        onChange={(e) => setCustomPort(Number(e.target.value))}
                                        className="w-24 h-8 !bg-surface-container-high border-white/10 font-data-mono text-xs uppercase px-2 text-primary text-center focus:border-primary rounded transition-all"
                                    />
                                    <button
                                        onClick={() => updateConfigMutation.mutate({ port: customPort })}
                                        className="p-1.5 bg-primary/10 text-primary rounded border border-primary/20 hover:bg-primary hover:text-on-primary-container transition-all"
                                    >
                                        <RefreshCw size={14} className={updateConfigMutation.isLoading ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsEditingPort(true)}
                                    className="font-data-mono text-xs font-black text-primary hover:scale-110 transition-transform"
                                >
                                    {statusQuery.data?.port || '1514'}
                                </button>
                            )}
                        </div>

                        {/* DEVICE FILTER */}
                        <div className="h-14 flex items-center gap-4 px-6 bg-surface-container rounded border border-white/5 group hover:border-primary/20 transition-all">
                            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest opacity-60">{t('TARGET_ENTITY')}:</span>
                            <select
                                value={selectedDeviceId}
                                onChange={(e) => setSelectedDeviceId(e.target.value)}
                                className="bg-transparent border-none font-data-mono text-[11px] font-black text-on-surface outline-none focus:ring-0 cursor-pointer p-0 uppercase"
                            >
                                <option value="all" className="bg-surface-container-high">{t('GLOBAL_GRID_BROADCAST')}</option>
                                {devices.map((d: any) => (
                                    <option key={d.id} value={d.id} className="bg-surface-container-high">{d.name.toUpperCase()} [{d.ipAddress}]</option>
                                ))}
                            </select>
                        </div>

                        {/* MAIN ACTION */}
                        <button
                            onClick={() => {
                                if (statusQuery.data?.isRunning) {
                                    stopMutation.mutate();
                                    setIsLive(false);
                                } else {
                                    startMutation.mutate();
                                    setIsLive(true);
                                }
                            }}
                            disabled={startMutation.isPending || stopMutation.isPending}
                            className={`cyber-button h-14 px-8 flex items-center gap-4 shadow-xl ${statusQuery.data?.isRunning
                                ? '!bg-error text-on-error-container border-error shadow-error/20'
                                : '!bg-primary text-on-primary-container border-primary shadow-primary/20'}`}
                        >
                            {statusQuery.data?.isRunning ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                            <span className="font-label-caps text-xs font-black uppercase tracking-widest">
                                {statusQuery.data?.isRunning ? t('TERMINATE_INGESTION') : t('INITIALIZE_INGESTION')}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between mt-10 pt-10 border-t border-white/5 gap-6">
                    <div className="flex items-center gap-6">
                        <div className="relative w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary opacity-40 group-focus-within:opacity-100 transition-opacity" size={16} />
                            <input
                                type="text"
                                placeholder={t('SEARCH_LOG_METADATA')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-11 !bg-surface-container border-white/5 rounded pl-12 pr-4 font-data-mono text-[10px] uppercase tracking-widest focus:border-primary transition-all shadow-inner"
                            />
                        </div>

                        <select
                            value={minSeverity}
                            onChange={(e) => setMinSeverity(Number(e.target.value))}
                            className="h-11 !bg-surface-container border-white/5 rounded px-6 font-data-mono text-[10px] uppercase tracking-widest focus:border-primary transition-all shadow-inner"
                        >
                            <option value={7}>{t('ALL_SEVERITIES')}</option>
                            <option value={4}>{t('WARNING_LEVEL_&_ABOVE')}</option>
                            <option value={3}>{t('ERROR_LEVEL_&_ABOVE')}</option>
                            <option value={2}>{t('CRITICAL_LEVEL_ONLY')}</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setLogs([])}
                            className="p-3.5 bg-surface-container border border-white/5 hover:border-error/20 hover:text-error rounded transition-all group"
                            title={t('CLEAR_LOCAL_BUFFER')}
                        >
                            <Trash2 size={18} className="opacity-40 group-hover:opacity-100" />
                        </button>

                        <div className="h-10 w-px bg-white/5 mx-2"></div>

                        <button
                            onClick={() => {
                                if (confirm(t('INITIATE_CLEANUP_CONFIRM'))) {
                                    triggerCleanup.mutate({ daysOld: 7 });
                                }
                            }}
                            disabled={cleanupStatusQuery.data?.isCleaning}
                            className={`px-6 h-11 rounded border font-label-caps text-[10px] uppercase tracking-widest transition-all flex items-center gap-4 ${cleanupStatusQuery.data?.isCleaning
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 animate-pulse'
                                : 'bg-surface-container border-white/5 text-on-surface-variant hover:text-on-surface hover:border-white/10'}`}
                        >
                            <Info size={16} />
                            {cleanupStatusQuery.data?.isCleaning ? `${t('CLEANING_IN_PROGRESS')}: ${cleanupStatusQuery.data.totalDeleted}` : t('SCHEDULED_PURGE')}
                        </button>

                        <button
                            onClick={() => {
                                if (confirm(t('INITIATE_COMPACT_CONFIRM'))) {
                                    reclaimSpaceMutation.mutate();
                                }
                            }}
                            disabled={reclaimSpaceMutation.isPending}
                            className="p-3.5 bg-surface-container border border-white/5 hover:border-primary/20 hover:text-primary rounded transition-all group"
                            title={t('COMPACT_STORAGE_MATRIX')}
                        >
                            <RefreshCw size={18} className={`${reclaimSpaceMutation.isPending ? 'animate-spin' : 'opacity-40 group-hover:opacity-100'}`} />
                        </button>

                        <button
                            onClick={() => {
                                if (confirm(t('INITIATE_WIPE_CONFIRM'))) {
                                    clearAllMutation.mutate();
                                }
                            }}
                            disabled={clearAllMutation.isPending}
                            className="p-3.5 bg-error/10 border border-error/20 hover:bg-error hover:text-on-error-container rounded transition-all group"
                            title={t('GLOBAL_WIPE_EXTERMINATE')}
                        >
                            <Trash2 size={18} className={clearAllMutation.isPending ? 'animate-pulse' : 'opacity-60 group-hover:opacity-100'} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Logs Area - Terminal Interface */}
            <div className="flex-1 overflow-hidden glass-panel border-white/5 bg-black/90 relative flex flex-col group/terminal">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0 opacity-40 group-hover/terminal:opacity-100 transition-opacity"></div>
                <div className="flex-1 overflow-auto p-10 font-data-mono text-[11px] leading-relaxed custom-scrollbar" ref={scrollRef}>
                    <AnimatePresence>
                        {filteredLogs.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-on-surface-variant/20 space-y-6">
                                <Terminal size={80} className="opacity-5" />
                                <div className="text-center space-y-2">
                                    <p className="font-label-caps text-xs uppercase tracking-[0.4em] font-black opacity-40">AWAITING_INGESTION_STREAM</p>
                                    <p className="font-label-caps text-[9px] uppercase tracking-[0.2em] italic opacity-20">No matching telemetry packets detected in local buffer</p>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="relative w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
                                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                    const log = filteredLogs[virtualRow.index];
                                    return (
                                        <div
                                            key={virtualRow.index}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: `${virtualRow.size}px`,
                                                transform: `translateY(${virtualRow.start}px)`,
                                            }}
                                        >
                                            <div className="group flex gap-6 hover:bg-white/5 p-2 px-3 rounded transition-all whitespace-pre-wrap break-all border border-transparent hover:border-white/5">
                                                <span className="text-on-surface-variant/40 shrink-0 select-none font-bold">[{format(new Date(log.timestamp), 'HH:mm:ss')}]</span>
                                                <span className="text-primary font-black shrink-0 italic">{log.hostname.toUpperCase()}</span>
                                                <div className={`px-2 py-0.5 border rounded font-label-caps text-[8px] font-black shrink-0 flex items-center shadow-sm ${getSeverityStyle(log.severity)}`}>
                                                    {getSeverityLabel(log.severity)}
                                                </div>
                                                <span className="text-primary-fixed-dim shrink-0 font-bold tracking-tighter uppercase opacity-60">{log.tag}:</span>
                                                <span className="text-on-surface/80 flex-1 font-medium">{log.message}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Live Stats Overlay */}
                <div className="absolute bottom-6 right-10 flex items-center gap-6 p-4 glass-panel border-white/10 bg-surface-container/95 backdrop-blur-none animate-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center gap-4 pr-6 border-r border-white/10">
                        <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest opacity-60">STREAM_BUFFER:</span>
                        <span className="font-data-mono text-xs font-black text-primary">{logs.length}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Activity size={14} className="text-primary animate-pulse" />
                        <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest opacity-60">LATENCY_SYNC:</span>
                        <span className="font-data-mono text-xs font-black text-on-surface italic">{logs[0] ? format(new Date(logs[0].timestamp), 'HH:mm:ss') : 'SEARCHING...'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
