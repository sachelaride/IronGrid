import { trpc } from '../utils/trpc';
import { X, Loader2, Cpu, MemoryStick as Memory, Activity, HardDrive, Zap, Clock, BarChart3 } from 'lucide-react';
import { MetricChart } from './MetricChart';
import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

interface DeviceMetricsModalProps {
    device: {
        id: string;
        ip: string;
        hostname: string;
        name?: string;
    };
    onClose: () => void;
}

export function DeviceMetricsModal({ device, onClose }: DeviceMetricsModalProps) {
    const { t } = useLanguage();
    const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('1h');

    const { data: metrics, isLoading: loadingSys, error: sysError } = trpc.metrics.getSystemMetrics.useQuery({
        deviceId: device.id,
        timeRange
    });

    const { data: diskMetrics } = (trpc as any).metrics.getDiskMetrics.useQuery({
        deviceId: device.id,
        timeRange
    });

    const { data: netMetrics } = (trpc as any).metrics.getInterfaceMetrics.useQuery({
        deviceIp: device.ip,
        interfaceIndex: 'all',
        timeRange
    });

    const isLoading = loadingSys;
    const error = sysError;

    interface MetricData {
        timestamp: string;
        cpu: number;
        memory: number;
    }

    // Prepare data for Recharts
    const cpuData = useMemo(() => (metrics as MetricData[] | undefined)?.map((m: MetricData) => ({
        time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: m.cpu
    })) || [], [metrics]);

    const memData = useMemo(() => (metrics as MetricData[] | undefined)?.map((m: MetricData) => ({
        time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: m.memory
    })) || [], [metrics]);

    const diskData = useMemo(() => (diskMetrics as any[])?.map((m: any) => {
        const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        let totalUsedGB = 0;
        Object.values(m.disks || {}).forEach((d: any) => {
            if (d.used) totalUsedGB += d.used / 1024 / 1024 / 1024;
        });
        return { time, value: totalUsedGB };
    }) || [], [diskMetrics]);

    const flowData = useMemo(() => {
        const groupedByTime = new Map<string, number>();
        (netMetrics as any[])?.forEach((m: any) => {
            const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const val = (m.bytesIn + m.bytesOut) * 8 / 1000 / 1000; // Mbps
            groupedByTime.set(time, (groupedByTime.get(time) || 0) + val);
        });
        return Array.from(groupedByTime.entries()).map(([time, value]) => ({ time, value: Number(value.toFixed(2)) }));
    }, [netMetrics]);

    return createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
            <div className="flex min-h-screen items-start justify-center p-2 sm:p-4">
                <div className="glass-panel rounded-[24px] sm:rounded-[32px] w-full max-w-7xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 shadow-[0_0_100px_rgba(0,0,0,0.5)] border-white/5 max-h-[95vh]">
                    
                    {/* Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 py-4 sm:px-8 sm:py-6 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-4 sm:gap-6">
                            <div className="w-14 h-14 bg-secondary-fixed/10 rounded-2xl flex items-center justify-center text-secondary-fixed border border-secondary-fixed/20 shadow-2xl">
                                <Activity className="w-7 h-7" />
                            </div>
                            <div className="space-y-0.5">
                                <h2 className="text-2xl font-black text-on-surface uppercase tracking-wider italic">{device.name || device.hostname || device.ip}</h2>
                                <div className="flex items-center gap-3">
                                    <span className="font-data-mono text-[10px] bg-white/5 px-2 py-0.5 rounded text-secondary-fixed font-black">{device.ip}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                    <p className="font-label-caps text-[10px] text-on-surface-variant/90 font-black uppercase tracking-widest">{t('ANALYTICS_MATRIX')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                            <div className="relative group">
                                <select
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value as any)}
                                    className="h-10 bg-white/5 border border-white/10 rounded-xl px-6 pr-10 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface focus:outline-none focus:border-secondary-fixed transition-all appearance-none cursor-pointer"
                                >
                                    <option value="1h" className="bg-surface-container-high text-on-surface">{t('LAST_1_HOUR') || 'Last 1 Hour'}</option>
                                    <option value="24h" className="bg-surface-container-high text-on-surface">{t('LAST_24_HOURS') || 'Last 24 Hours'}</option>
                                    <option value="7d" className="bg-surface-container-high text-on-surface">{t('LAST_7_DAYS') || 'Last 7 Days'}</option>
                                </select>
                                <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-secondary-fixed/80 pointer-events-none" />
                            </div>

                            <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group border border-white/5">
                                <X className="h-6 w-6 text-on-surface-variant/90 group-hover:text-on-surface transition-colors" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-8 overflow-y-auto scrollbar-hide max-h-[80vh]">
                        {isLoading ? (
                            <div className="h-96 flex flex-col items-center justify-center gap-4">
                                <div className="w-16 h-16 border-4 border-secondary-fixed border-t-transparent rounded-full animate-spin" />
                                <p className="font-label-caps text-xs text-secondary-fixed font-black uppercase tracking-[0.3em] animate-pulse">{t('FETCHING_FORENSIC_DATA') || 'FETCHING FORENSIC DATA'}</p>
                            </div>
                        ) : error ? (
                            <div className="h-96 flex flex-col items-center justify-center gap-6 p-10 bg-error/5 border border-error/20 rounded-[32px]">
                                <Activity className="w-16 h-16 text-error/80" />
                                <div className="text-center">
                                    <p className="text-error font-black uppercase tracking-widest text-sm mb-2">{t('METRIC_SYNC_ERROR') || 'METRIC SYNC ERROR'}</p>
                                    <p className="text-on-surface-variant/80 text-[10px] font-black uppercase">{error.message}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {/* CPU Chart */}
                                <div className="bg-surface-container-low/40 rounded-[24px] sm:rounded-[32px] border border-white/5 p-4 sm:p-8 backdrop-blur-sm group hover:border-primary/20 transition-all">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                <Cpu className="h-5 w-5" />
                                            </div>
                                            <h4 className="font-label-caps text-xs font-black text-on-surface uppercase tracking-[0.2em] italic">{t('CPU_LOAD')}</h4>
                                        </div>
                                        <span className="font-data-mono text-[10px] text-primary font-black bg-primary/10 px-3 py-1 rounded-lg">LIVE_STREAM</span>
                                    </div>
                                    <div className="h-[280px]">
                                        <MetricChart data={cpuData} color="var(--primary)" unit="%" />
                                    </div>
                                </div>

                                {/* Memory Chart */}
                                <div className="bg-surface-container-low/40 rounded-[24px] sm:rounded-[32px] border border-white/5 p-4 sm:p-8 backdrop-blur-sm group hover:border-emerald-500/20 transition-all">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                                <Memory className="h-5 w-5" />
                                            </div>
                                            <h4 className="font-label-caps text-xs font-black text-on-surface uppercase tracking-[0.2em] italic">{t('MEMORY_USAGE')}</h4>
                                        </div>
                                        <span className="font-data-mono text-[10px] text-emerald-500 font-black bg-emerald-500/10 px-3 py-1 rounded-lg">VOLATILE_DATA</span>
                                    </div>
                                    <div className="h-[280px]">
                                        <MetricChart data={memData} color="#10b981" unit="%" />
                                    </div>
                                </div>

                                {/* Disk Usage Chart */}
                                <div className="bg-surface-container-low/40 rounded-[24px] sm:rounded-[32px] border border-white/5 p-4 sm:p-8 backdrop-blur-sm group hover:border-amber-500/20 transition-all">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                                <HardDrive className="h-5 w-5" />
                                            </div>
                                            <h4 className="font-label-caps text-xs font-black text-on-surface uppercase tracking-[0.2em] italic">{t('DISK_USAGE')}</h4>
                                        </div>
                                        <span className="font-data-mono text-[10px] text-amber-500 font-black bg-amber-500/10 px-3 py-1 rounded-lg">STORAGE_FOOTPRINT</span>
                                    </div>
                                    <div className="h-[280px]">
                                        <MetricChart data={diskData} color="#f59e0b" unit=" GB" />
                                    </div>
                                </div>

                                {/* Network Throughput Chart */}
                                <div className="bg-surface-container-low/40 rounded-[24px] sm:rounded-[32px] border border-white/5 p-4 sm:p-8 backdrop-blur-sm group hover:border-secondary-fixed/20 transition-all">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-secondary-fixed/10 rounded-xl flex items-center justify-center text-secondary-fixed group-hover:scale-110 transition-transform">
                                                <Zap className="h-5 w-5" />
                                            </div>
                                            <h4 className="font-label-caps text-xs font-black text-on-surface uppercase tracking-[0.2em] italic">{t('NETWORK_TRAFFIC')}</h4>
                                        </div>
                                        <span className="font-data-mono text-[10px] text-secondary-fixed font-black bg-secondary-fixed/10 px-3 py-1 rounded-lg">THROUGHPUT</span>
                                    </div>
                                    <div className="h-[280px]">
                                        <MetricChart data={flowData} color="var(--secondary-fixed)" unit=" Mbps" />
                                    </div>
                                </div>

                                {(metrics?.length === 0 || !metrics) && (
                                    <div className="col-span-full py-20 text-center bg-white/[0.01] rounded-[32px] border border-dashed border-white/5 flex flex-col items-center gap-4">
                                        <Activity className="w-12 h-12 text-on-surface-variant/60" />
                                        <div className="space-y-1">
                                            <p className="font-label-caps text-xs text-on-surface-variant/90 font-black uppercase tracking-[0.2em]">{t('NO_DATA_PERIOD') || 'No data found for the selected period'}</p>
                                            <p className="font-data-mono text-[9px] text-on-surface-variant/80 uppercase tracking-widest">{t('ENSURE_AGENT_RUNNING') || 'Ensure the IronGrid Agent is active'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 sm:p-8 border-t border-white/5 bg-white/[0.01] flex justify-end">
                        <button
                            onClick={onClose}
                            className="cyber-button px-12 py-5 rounded-[20px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/20"
                        >
                            {t('CLOSE_PROTOCOL')}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
