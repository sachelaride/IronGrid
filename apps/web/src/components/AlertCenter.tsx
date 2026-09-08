import { useState } from 'react';
import { trpc } from '../utils/trpc';
import { AlertCircle, Bell, CheckCircle, Clock, Trash2, MessageSquare, Terminal, Activity, ShieldAlert, Loader2, Filter, Zap, Target, Shield, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

/**
 * AlertCenter - Forensic Incident Feed and Threat Response.
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
export function AlertCenter() {
    const { t } = useLanguage();
    const [filter, setFilter] = useState<string>('ACTIVE');

    const { data: alerts = [], isLoading, refetch } = trpc.alerts.list.useQuery({
        status: filter === 'ALL' ? undefined : (filter as any)
    });

    const acknowledge = trpc.alerts.acknowledge.useMutation({ onSuccess: () => refetch() });
    const resolve = trpc.alerts.resolve.useMutation({ onSuccess: () => refetch() });

    return (
        <div className="space-y-gutter animate-in fade-in duration-700 pt-6">
            {/* Header and Filter Controls */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-12 mb-16 ml-2">
                <div className="space-y-4">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-error/10 rounded-2xl border border-error/20 flex items-center justify-center relative shadow-[0_0_40px_rgba(var(--error),0.1)] overflow-hidden">
                            <div className="absolute inset-0 bg-error/5 animate-pulse" />
                            <Activity size={42} className="text-error animate-pulse relative z-10" />
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                        </div>
                        <div>
                            <h1 className="font-display-lg text-6xl text-on-surface uppercase tracking-tighter italic leading-none">{t('AL_FORENSIC_STREAM')}</h1>
                            <div className="flex items-center gap-4 mt-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-error animate-ping" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-error absolute" />
                                </div>
                                <p className="font-label-caps text-[10px] text-primary/60 uppercase tracking-[0.4em] italic font-black">{t('LIVE_INFRA_TELEMETRY')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-surface-container-highest/20 p-2 rounded-2xl border border-white/5 backdrop-blur-3xl shadow-inner flex items-center gap-2">
                    <div className="px-4 text-on-surface-variant/40">
                        <Filter size={16} />
                    </div>
                    {['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'ALL'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-8 h-12 rounded-xl font-display-lg text-[11px] uppercase tracking-tighter transition-all relative overflow-hidden group italic ${filter === s ? 'text-black font-black' : 'text-on-surface-variant/60 hover:text-on-surface'}`}
                        >
                            <AnimatePresence>
                                {filter === s && (
                                    <motion.div 
                                        layoutId="alert-filter-bg"
                                        className="absolute inset-0 bg-primary shadow-[0_0_30px_rgba(var(--primary-fixed),0.4)]" 
                                    />
                                )}
                            </AnimatePresence>
                            <span className="relative z-10">
                                {s === 'ACTIVE' ? t('AL_LIVE') : s === 'ACKNOWLEDGED' ? t('AL_VALIDATED') : s === 'RESOLVED' ? t('AL_ARCHIVED') : t('AL_GLOBAL')}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Incident Feed */}
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="glass-panel p-40 flex flex-col items-center justify-center border-dashed border-white/5 bg-surface-container/5 rounded-3xl"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                            <Loader2 size={64} className="text-primary animate-spin relative z-10 opacity-60" />
                        </div>
                        <p className="font-label-caps text-[13px] text-on-surface-variant tracking-[0.6em] uppercase italic animate-pulse mt-12 font-black">{t('DECRYPTING_INCIDENT_SHARDS')}</p>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6 max-h-[calc(100vh-340px)] overflow-y-auto custom-scrollbar pr-6"
                    >
                        {alerts.map((alert: any, idx: number) => (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`
                                    glass-panel p-8 transition-all hover:bg-white/5 relative group border-l-4 overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]
                                    ${alert.severity === 'CRITICAL' ? 'border-l-error bg-error/[0.03]' : alert.severity === 'WARNING' ? 'border-l-warning bg-warning/[0.03]' : 'border-l-primary bg-primary/[0.03]'}
                                `}
                            >
                                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:opacity-[0.07] transition-opacity">
                                    {alert.severity === 'CRITICAL' ? <ShieldAlert size={200} /> : alert.severity === 'WARNING' ? <AlertTriangle size={200} /> : <Shield size={200} />}
                                </div>

                                <div className="flex justify-between items-start gap-12 relative z-10">
                                    <div className="flex-1 space-y-10">
                                        <div className="flex items-center gap-8">
                                            <div className={`w-16 h-16 rounded-2xl bg-surface-container-highest/60 border border-white/5 flex items-center justify-center relative overflow-hidden shadow-inner group-hover:border-white/10 transition-colors`}>
                                                <div className={`absolute inset-0 opacity-10 ${alert.severity === 'CRITICAL' ? 'bg-error animate-pulse' : alert.severity === 'WARNING' ? 'bg-warning' : 'bg-primary'}`} />
                                                <Target size={28} className={`${alert.severity === 'CRITICAL' ? 'text-error' : alert.severity === 'WARNING' ? 'text-warning' : 'text-primary'}`} />
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-6">
                                                    <span className={`font-black text-[10px] uppercase tracking-[0.3em] px-4 py-1.5 rounded-lg border italic ${
                                                        alert.severity === 'CRITICAL' ? 'bg-error/10 text-error border-error/20 shadow-[0_0_20px_rgba(var(--error),0.1)]' : 
                                                        alert.severity === 'WARNING' ? 'bg-warning/10 text-warning border-warning/20' : 
                                                        'bg-primary/10 text-primary border-primary/20'
                                                    }`}>
                                                        {t(`${alert.severity}_THREAT_DETECTED`)}
                                                    </span>
                                                    <div className="h-px w-12 bg-white/10" />
                                                    <span className="font-data-mono text-[11px] text-on-surface-variant/40 flex items-center gap-3 uppercase tracking-widest font-black italic">
                                                        <Clock size={16} className="opacity-30" /> {new Date(alert.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h3 className="font-display-lg text-3xl text-on-surface uppercase tracking-tight italic group-hover:text-primary transition-colors leading-none">{alert.title}</h3>
                                            <p className="font-label-caps text-[13px] text-on-surface-variant/60 tracking-[0.1em] leading-relaxed max-w-5xl italic font-medium">{alert.message}</p>
                                        </div>

                                        <div className="flex flex-wrap gap-6 pt-2">
                                            {alert.device && (
                                                <div className="flex items-center gap-4 px-6 py-3 bg-surface-container-highest/40 rounded-xl border border-white/5 font-data-mono text-[12px] text-on-surface uppercase tracking-tight shadow-inner group-hover:border-primary/20 transition-colors">
                                                    <Terminal size={16} className="text-primary/40" />
                                                    <span className="opacity-30 font-black italic">{t('SOURCE_NODE')}:</span>
                                                    <span className="font-black text-primary italic">{alert.device.name} // {alert.device.ipAddress}</span>
                                                </div>
                                            )}

                                            {alert.tickets && alert.tickets.length > 0 && (
                                                <div className="flex gap-4">
                                                    {alert.tickets.map((t: any) => (
                                                        <div key={t.id} className="bg-secondary-fixed/5 border border-secondary-fixed/10 text-secondary-fixed font-data-mono text-[12px] px-6 py-3 rounded-xl flex items-center gap-4 uppercase tracking-tight shadow-inner">
                                                            <MessageSquare size={16} className="opacity-30" />
                                                            <span className="opacity-30 font-black italic">{t('INCIDENT_UID')}:</span>
                                                            <span className="font-black italic">#{t.ticketNumber} // {t.status}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 pt-2">
                                        {alert.status === 'ACTIVE' && (
                                            <button
                                                onClick={() => acknowledge.mutate({ id: alert.id })}
                                                className="w-16 h-16 bg-primary/10 hover:bg-primary text-primary hover:text-black rounded-2xl border border-primary/20 transition-all shadow-2xl flex items-center justify-center group/btn relative overflow-hidden"
                                                title={t('ACKNOWLEDGE_THREAT')}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                                <CheckCircle size={32} className="group-hover/btn:scale-110 transition-transform relative z-10" />
                                            </button>
                                        )}
                                        {alert.status !== 'RESOLVED' && (
                                            <button
                                                onClick={() => resolve.mutate({ id: alert.id })}
                                                className="w-16 h-16 bg-error/10 hover:bg-error text-error hover:text-white rounded-2xl border border-error/20 transition-all shadow-2xl flex items-center justify-center group/btn relative overflow-hidden"
                                                title={t('EXECUTE_RESOLUTION')}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                                <Zap size={32} className="group-hover/btn:scale-110 transition-transform relative z-10" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Status Progress Tracker */}
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: alert.status === 'ACTIVE' ? '33%' : alert.status === 'ACKNOWLEDGED' ? '66%' : '100%' }}
                                        className={`h-full shadow-[0_0_10px_rgba(255,255,255,0.2)] ${alert.status === 'ACTIVE' ? 'bg-error' : alert.status === 'ACKNOWLEDGED' ? 'bg-warning' : 'bg-primary'}`} 
                                    />
                                </div>
                            </motion.div>
                        ))}

                        {alerts.length === 0 && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="glass-panel p-40 flex flex-col items-center justify-center border-dashed border-white/5 opacity-40 bg-surface-container/5 rounded-3xl"
                            >
                                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-10">
                                    <Bell size={48} className="text-on-surface-variant/20" />
                                </div>
                                <h3 className="font-display-lg text-4xl text-on-surface-variant uppercase tracking-tighter italic leading-none">{t('AL_THREAT_ZERO')}</h3>
                                <p className="font-label-caps text-[12px] text-on-surface-variant/30 tracking-[0.5em] uppercase mt-6 italic font-black">{t('AL_NOMINAL_STATUS')}</p>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
