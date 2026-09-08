import { useState } from 'react';
import { trpc } from '../../utils/trpc';
import { Trash2, AlertTriangle, Activity, Settings2, Loader2, Info, ShieldAlert, Zap, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SystemCleanup - Governança de Purga e Higienização de Cluster.
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
interface SystemCleanupProps {
    status: any;
}

export function SystemCleanup({ status: _status }: SystemCleanupProps) {
    const utils = trpc.useContext();
    const cleanupMutation = (trpc as any).system.triggerCleanup.useMutation();
    const clearInfluxMutation = (trpc as any).system.clearAllInfluxData.useMutation();
    const resetParamsMutation = (trpc as any).settings.resetAllParameters.useMutation();
    const syslogCleanupMutation = (trpc as any).system.cleanupSyslogDb.useMutation();
    const clearAllSyslogMutation = (trpc as any).system.clearAllSyslog.useMutation();
    const reclaimSyslogSpaceMutation = (trpc as any).system.reclaimSyslogSpace.useMutation();

    const cleanupStatus = (trpc as any).system.getSyslogCleanupStatus.useQuery(undefined, {
        refetchInterval: (data: any) => data?.isCleaning ? 2000 : false,
        enabled: true
    });

    const [syslogDays, setSyslogDays] = useState(30);

    const [targets, setTargets] = useState({
        audit: true,
        notification: true,
        remote: true,
        metrics: false
    });

    const handleCleanup = async () => {
        const selectedTargets = (Object.keys(targets) as (keyof typeof targets)[])
            .filter(key => targets[key]);

        if (selectedTargets.length === 0) {
            alert('NULL_TARGET: Select at least one operational module for sanitization.');
            return;
        }

        if (confirm('INITIATE_SANITIZATION: Do you wish to execute the cleanup protocols for the selected modules?')) {
            const result = await (cleanupMutation as any).mutateAsync({ targets: selectedTargets });
            (utils as any).system.getMaintenanceStatus.invalidate();
            const deleted = result?.result?.logsDeleted ?? 0;
            if (deleted === 0) {
                alert(`SANITIZATION_COMPLETE: No obsolete records found within the active retention window.`);
            } else {
                alert(`SANITIZATION_COMPLETE: ${deleted} records purged from cluster index.`);
            }
        }
    };

    const handleSyslogCleanup = async () => {
        if (!confirm(`⚠️ CRITICAL_PURGE: This will erase all SYSLOG nodes older than ${syslogDays} days. Irreversible action. Continue?`)) return;
        try {
            const result = await syslogCleanupMutation.mutateAsync({ daysOld: syslogDays });
            (utils as any).system.getSyslogCleanupStatus.invalidate();
            alert(result.message || 'PURGE_SEQUENCE_INITIATED: Processing in background.');
        } catch (e: any) {
            alert('PURGE_PROTOCOL_ERROR: ' + (e.message || e));
        }
    };

    const handleClearAllSyslog = async () => {
        if (!confirm('🚨 ATOMIC_WIPE_WARNING: This will purge ABSOLUTELY ALL logs from the forensic database immediately. Proceed?')) return;

        const confirmText = prompt('Confirm Atomic Wipe by typing "WIPE ALL":');
        if (confirmText !== 'WIPE ALL') return;

        try {
            await clearAllSyslogMutation.mutateAsync();
            (utils as any).system.getMaintenanceStatus.invalidate();
        } catch (e: any) {
            alert('WIPE_SEQUENCE_FAILURE: ' + (e.message || e));
        }
    };

    const handleReclaimSyslogSpace = async () => {
        if (!confirm('INITIATE_SPACE_RECLAMATION: Compact the forensic database? This will lock ingestion temporarily. Continue?')) return;

        try {
            await reclaimSyslogSpaceMutation.mutateAsync();
            (utils as any).system.getMaintenanceStatus.invalidate();
        } catch (e: any) {
            alert('RECLAMATION_FAILURE: ' + (e.message || e));
        }
    };

    const handleClearInflux = async () => {
        if (!confirm('⚠️ METRIC_WIPE_WARNING: This will erase all temporal monitoring data from InfluxDB. Irreversible action. Continue?')) return;

        const confirmText = prompt('Confirm Metric Wipe by typing "CLEAR METRICS":');
        if (confirmText !== 'CLEAR METRICS') return;

        try {
            await clearInfluxMutation.mutateAsync();
            (utils as any).system.getMaintenanceStatus.invalidate();
        } catch (e: any) {
            alert('METRIC_WIPE_FAILURE: ' + (e.message || e));
        }
    };

    const handleResetParams = async () => {
        if (!confirm('⚠️ SYSTEM_RESET_WARNING: Revert all system parameters to factory defaults? Users and nodes will persist.')) return;

        try {
            await resetParamsMutation.mutateAsync();
            (utils as any).settings.getParameters.invalidate();
        } catch (e: any) {
            alert('RESET_SEQUENCE_FAILURE: ' + (e.message || e));
        }
    }

    return (
        <div className="space-y-gutter animate-in fade-in duration-700 pt-4">
            {/* Selective Cleanup Card */}
            <div className="glass-panel p-10 border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <Trash2 size={180} className="text-error" />
                </div>

                <div className="flex flex-col gap-3 mb-10 ml-2 relative z-10">
                    <h3 className="font-display-lg text-3xl text-error uppercase tracking-tighter italic flex items-center gap-4">
                        <Trash2 size={28} /> SELECTIVE_SANITIZATION_HUB
                    </h3>
                    <p className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-[0.3em] italic">Módulo de Higienização Manual de Telemetria e Logs</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 relative z-10">
                    <SanitizationTarget label="AUDIT_TRAIL_LOGS" checked={targets.audit} onChange={(c) => setTargets(t => ({ ...t, audit: c }))} />
                    <SanitizationTarget label="NOTIFICATION_QUEUE" checked={targets.notification} onChange={(c) => setTargets(t => ({ ...t, notification: c }))} />
                    <SanitizationTarget label="REMOTE_ACCESS_AUDIT" checked={targets.remote} onChange={(c) => setTargets(t => ({ ...t, remote: c }))} />
                    <SanitizationTarget label="TEMPORAL_METRICS" checked={targets.metrics} onChange={(c) => setTargets(t => ({ ...t, metrics: c }))} warning />
                </div>

                <button
                    onClick={handleCleanup}
                    disabled={cleanupMutation.isPending}
                    className="cyber-button w-full h-16 !bg-error/10 border-error/20 text-error hover:bg-error hover:text-on-error transition-all flex items-center justify-center gap-4 shadow-xl font-display-lg text-lg uppercase tracking-tighter italic"
                >
                    {cleanupMutation.isPending ? <Loader2 size={24} className="animate-spin" /> : <Zap size={24} />}
                    EXECUTE_SANITIZATION_SEQUENCE
                </button>

                {/* Danger Zone */}
                <div className="mt-16 pt-10 border-t border-error/20 relative z-10">
                    <div className="flex items-center gap-4 text-error mb-8 ml-2">
                        <ShieldAlert size={24} />
                        <h4 className="font-display-lg text-2xl uppercase tracking-tighter italic">CRITICAL_DANGER_ZONE</h4>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-gutter">
                        {/* Parameter Reset */}
                        <div className="glass-panel p-8 bg-error/5 border-error/10 hover:border-error/30 transition-all group/item">
                            <h5 className="font-label-caps text-sm text-on-surface uppercase tracking-widest mb-2 group-hover/item:text-error transition-colors italic">FACTORY_RESET_PARAMETERS</h5>
                            <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest leading-relaxed mb-6 opacity-60">
                                Revert all system control tokens to factory default. User identities and node matrices are preserved.
                            </p>
                            <button
                                onClick={handleResetParams}
                                disabled={resetParamsMutation.isPending}
                                className="cyber-button w-full h-12 !bg-error/20 border-error/40 text-on-surface hover:bg-error hover:text-on-error transition-all flex items-center justify-center gap-3"
                            >
                                <Settings2 size={16} />
                                <span className="font-label-caps text-[10px] uppercase tracking-widest">REVERT_TO_DEFAULT</span>
                            </button>
                        </div>

                        {/* Syslog Wipe */}
                        <div className="glass-panel p-8 bg-error/5 border-error/10 hover:border-error/30 transition-all group/item relative overflow-hidden">
                            <h5 className="font-label-caps text-sm text-on-surface uppercase tracking-widest mb-2 group-hover/item:text-error transition-colors italic">FORENSIC_SHARD_WIPE</h5>
                            <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest leading-relaxed mb-6 opacity-60">
                                Selective purge of forensic node events by age threshold. Irreversible cluster archival action.
                            </p>

                            <AnimatePresence>
                                {cleanupStatus.data?.isCleaning ? (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-xl relative z-10"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-label-caps text-[10px] font-black text-primary uppercase tracking-[0.2em] animate-pulse">PURGE_IN_PROGRESS</span>
                                            <Loader2 size={14} className="text-primary animate-spin" />
                                        </div>
                                        <div className="font-data-mono text-[10px] text-on-surface-variant uppercase">
                                            RECORDS_PURGED: <span className="text-primary font-black">{cleanupStatus.data.totalDeleted.toLocaleString()}</span>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="flex items-center gap-4 mb-6 relative z-10">
                                        <label className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest shrink-0">WINDOW:</label>
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                min={1}
                                                value={syslogDays}
                                                onChange={e => setSyslogDays(Number(e.target.value))}
                                                className="w-full h-10 !bg-surface-container border-white/5 pl-4 font-data-mono text-xs uppercase"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-label-caps text-[8px] text-on-surface-variant/40 uppercase">DAYS</span>
                                        </div>
                                    </div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-3 relative z-10">
                                <button
                                    onClick={handleSyslogCleanup}
                                    disabled={syslogCleanupMutation.isPending || cleanupStatus.data?.isCleaning}
                                    className="cyber-button w-full h-12 !bg-error/20 border-error/40 text-on-surface hover:bg-error hover:text-on-error transition-all flex items-center justify-center gap-3"
                                >
                                    {syslogCleanupMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    <span className="font-label-caps text-[10px] uppercase tracking-widest">{cleanupStatus.data?.isCleaning ? 'PURGE_ACTIVE' : 'PURGE_BY_THRESHOLD'}</span>
                                </button>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={handleReclaimSyslogSpace}
                                        disabled={reclaimSyslogSpaceMutation.isPending}
                                        className="cyber-button h-10 !bg-surface-container border-white/10 text-on-surface hover:border-primary transition-all flex items-center justify-center gap-2"
                                    >
                                        <Activity size={12} className={reclaimSyslogSpaceMutation.isPending ? 'animate-spin' : ''} />
                                        <span className="font-label-caps text-[9px] uppercase tracking-widest">RECLAIM</span>
                                    </button>
                                    <button
                                        onClick={handleClearAllSyslog}
                                        disabled={clearAllSyslogMutation.isPending}
                                        className="cyber-button h-10 !bg-error text-on-error border-error shadow-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={12} className={clearAllSyslogMutation.isPending ? 'animate-pulse' : ''} />
                                        <span className="font-label-caps text-[9px] uppercase tracking-widest">ATOMIC_WIPE</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* InfluxDB Wipe */}
                        <div className="glass-panel p-8 bg-error/5 border-error/10 hover:border-error/30 transition-all group/item">
                            <h5 className="font-label-caps text-sm text-on-surface uppercase tracking-widest mb-2 group-hover/item:text-error transition-colors italic">TEMPORAL_METRIC_WIPE</h5>
                            <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest leading-relaxed mb-6 opacity-60">
                                Purge all historical monitoring telemetry from InfluxDB core. This action cannot be reverted.
                            </p>
                            <button
                                onClick={handleClearInflux}
                                disabled={clearInfluxMutation.isPending}
                                className="cyber-button w-full h-12 !bg-error/20 border-error/40 text-on-surface hover:bg-error hover:text-on-error transition-all flex items-center justify-center gap-3"
                            >
                                <Trash2 size={16} />
                                <span className="font-label-caps text-[10px] uppercase tracking-widest">ERASE_ALL_METRICS</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SanitizationTarget({ label, checked, onChange, warning }: { label: string, checked: boolean, onChange: (v: boolean) => void, warning?: boolean }) {
    return (
        <div
            onClick={() => onChange(!checked)}
            className={`
                flex items-center gap-4 p-5 rounded-2xl border cursor-pointer select-none transition-all group/target
                ${checked
                    ? (warning ? 'bg-error/10 border-error/30 shadow-[0_0_15px_rgba(var(--error),0.1)]' : 'bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(var(--primary-fixed),0.1)]')
                    : 'bg-surface-container-low border-white/5 hover:border-white/20 hover:bg-white/5'}
            `}
        >
            <div className={`
                w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all group-hover/target:scale-110
                ${checked
                    ? (warning ? 'bg-error border-error shadow-[0_0_10px_rgba(var(--error),0.5)]' : 'bg-primary border-primary shadow-[0_0_10px_rgba(var(--primary-fixed),0.5)]')
                    : 'border-white/10 bg-black/20'}
            `}>
                {checked && <div className="w-2 h-2 bg-on-primary rounded-full" />}
            </div>
            <span className={`font-label-caps text-[10px] uppercase tracking-widest font-black ${checked ? 'text-on-surface' : 'text-on-surface-variant/40'}`}>{label}</span>
        </div>
    )
}
