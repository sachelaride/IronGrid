import { useState, useEffect } from 'react';
import { trpc } from '../../utils/trpc';
import { Database, Activity, Terminal, Save, Loader2, Info, Sliders } from 'lucide-react';

/**
 * RetentionPolicy - Governança de Ciclo de Vida de Dados.
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
interface RetentionPolicyProps {
    status: any;
}

export function RetentionPolicy({ status }: RetentionPolicyProps) {
    const utils = trpc.useContext();
    const saveMutation = (trpc as any).system.updateRetentionSettings.useMutation();

    const [logsDays, setLogsDays] = useState(90);
    const [metricsDays, setMetricsDays] = useState(30);
    const [syslogDays, setSyslogDays] = useState(3);

    useEffect(() => {
        if (status?.settings) {
            setLogsDays(status.settings.retentionLogsDays);
            setMetricsDays(status.settings.retentionMetricsDays);
            setSyslogDays(status.settings.syslogRetentionDays || 3);
        }
    }, [status]);

    const handleSave = async () => {
        try {
            await (saveMutation as any).mutateAsync({
                logsDays: logsDays,
                metricsDays: metricsDays,
                syslogDays: syslogDays
            });
            (utils as any).system.getMaintenanceStatus.invalidate();
        } catch (e) {
            alert('RETENTION_COMMIT_FAILURE: Access denied or network error.');
        }
    };

    return (
        <div className="space-y-gutter animate-in fade-in duration-700 pt-4">
            <div className="glass-panel p-10 border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <Sliders size={180} className="text-primary" />
                </div>

                <div className="flex flex-col gap-3 mb-12 ml-2 relative z-10">
                    <h3 className="font-display-lg text-3xl text-primary uppercase tracking-tighter italic flex items-center gap-4">
                        <Database size={28} /> DATA_LIFECYCLE_GOVERNANCE
                    </h3>
                    <p className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-[0.3em] italic">Políticas de Retenção e Ciclo de Vida de Telemetria</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 relative z-10">
                    {/* PostgreSQL Config */}
                    <div className="glass-panel p-8 border-white/5 bg-surface-container/95 group/card hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-4 mb-8 text-primary">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <Database size={20} />
                            </div>
                            <h4 className="font-display-lg text-lg uppercase tracking-tight italic">RELATIONAL_POSTGRES</h4>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest block opacity-60">SYSTEM_LOGS_RETENTION</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={logsDays}
                                        onChange={(e) => setLogsDays(parseInt(e.target.value))}
                                        className="w-full h-14 !bg-surface-container-high border-white/5 pl-6 font-data-mono text-xs uppercase focus:border-primary transition-all shadow-inner pr-16"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-caps text-[9px] text-on-surface-variant/40 uppercase tracking-widest">DAYS</span>
                                </div>
                                <p className="font-label-caps text-[8px] text-on-surface-variant uppercase tracking-widest italic opacity-40 mt-2 px-1">Audit Trail, Notification Queues, Remote Sessions</p>
                            </div>
                        </div>
                    </div>

                    {/* InfluxDB Config */}
                    <div className="glass-panel p-8 border-white/5 bg-surface-container/95 group/card hover:border-amber-500/20 transition-all">
                        <div className="flex items-center gap-4 mb-8 text-amber-500">
                            <div className="p-3 bg-amber-500/10 rounded-lg">
                                <Activity size={20} />
                            </div>
                            <h4 className="font-display-lg text-lg uppercase tracking-tight italic">TEMPORAL_INFLUXDB</h4>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest block opacity-60">METRIC_HISTORICAL_INDEX</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={metricsDays}
                                        onChange={(e) => setMetricsDays(parseInt(e.target.value))}
                                        className="w-full h-14 !bg-surface-container-high border-white/5 pl-6 font-data-mono text-xs uppercase focus:border-amber-500 transition-all shadow-inner pr-16"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-caps text-[9px] text-on-surface-variant/40 uppercase tracking-widest">DAYS</span>
                                </div>
                                <p className="font-label-caps text-[8px] text-on-surface-variant uppercase tracking-widest italic opacity-40 mt-2 px-1">CPU/MEM Load, Traffic IO, Operational Health</p>
                            </div>
                        </div>
                    </div>

                    {/* Syslog Config */}
                    <div className="glass-panel p-8 border-white/5 bg-surface-container/95 group/card hover:border-cyan-500/20 transition-all">
                        <div className="flex items-center gap-4 mb-8 text-cyan-400">
                            <div className="p-3 bg-cyan-400/10 rounded-lg">
                                <Terminal size={20} />
                            </div>
                            <h4 className="font-display-lg text-lg uppercase tracking-tight italic">FORENSIC_SYSLOG</h4>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest block opacity-60">EVENT_SHARD_ROTATION</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={syslogDays}
                                        onChange={(e) => setSyslogDays(parseInt(e.target.value))}
                                        className="w-full h-14 !bg-surface-container-high border-white/5 pl-6 font-data-mono text-xs uppercase focus:border-cyan-400 transition-all shadow-inner pr-16"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-caps text-[9px] text-on-surface-variant/40 uppercase tracking-widest">DAYS</span>
                                </div>
                                <p className="font-label-caps text-[8px] text-on-surface-variant uppercase tracking-widest italic opacity-40 mt-2 px-1">Node Events, Security Warnings, Infrastructure Logs</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-10 border-t border-white/5 pt-10 relative z-10">
                    <div className="flex items-start gap-6 max-w-2xl opacity-50 italic">
                        <Info size={20} className="text-primary shrink-0 mt-1" />
                        <p className="font-label-caps text-[10px] text-on-surface-variant leading-relaxed uppercase tracking-widest">
                            Policy Enforcement Notice: These parameters define the automatic purge cycle for each telemetry hub. Reducing retention days will trigger immediate cluster cleanup to optimize storage volume.
                        </p>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saveMutation.isPending}
                        className="cyber-button px-12 h-16 !bg-primary text-on-primary-container border-primary flex items-center gap-4 shadow-2xl font-display-lg text-lg uppercase tracking-tighter italic"
                    >
                        {saveMutation.isPending ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                        COMMIT_RETENTION_POLICIES
                    </button>
                </div>
            </div>
        </div>
    );
}
