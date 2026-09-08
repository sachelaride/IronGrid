import { Mail, Plus, Trash2, Power, PowerOff, RefreshCw, CheckCircle2, X, Loader2, Database, Shield } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { trpc } from '../utils/trpc';
import { useState } from 'react';

/**
 * MailCollectorSettings - Automated Ticket Ingestion Governance.
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
export function MailCollectorSettings() {
    const { t } = useLanguage();
    const utils = trpc.useContext();
    const { data: configs = [], isLoading } = (trpc as any).mailCollector.list.useQuery();
    const [isAdding, setIsAdding] = useState(false);

    const createMutation = (trpc as any).mailCollector.create.useMutation({
        onSuccess: () => {
            utils.mailCollector.list.invalidate();
            setIsAdding(false);
        }
    });

    const updateMutation = (trpc as any).mailCollector.update.useMutation({
        onSuccess: () => utils.mailCollector.list.invalidate()
    });

    const deleteMutation = (trpc as any).mailCollector.delete.useMutation({
        onSuccess: () => utils.mailCollector.list.invalidate()
    });

    if (isLoading) {
        return (
            <div className="flex items-center gap-4 text-on-surface-variant font-label-caps text-[11px] uppercase tracking-[0.3em] pt-4">
                <Loader2 size={18} className="animate-spin text-primary" /> {t('SCANNING_TIER_INVENTORY')}
            </div>
        );
    }

    return (
        <div className="space-y-gutter">
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div className="space-y-1">
                    <h3 className="font-display-lg text-2xl text-primary uppercase tracking-tighter flex items-center gap-4">
                        <Mail size={24} /> {t('MAIL_INGESTION_COLLECTOR')}
                    </h3>
                    <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.3em] italic mt-1">{t('MAIL_INGESTION_SUBTITLE')}</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="cyber-button px-6 h-11 !bg-primary text-on-primary-container border-primary flex items-center gap-2"
                >
                    <Plus size={16} /> {t('NEW_COLLECTOR')}
                </button>
            </div>

            {/* Config Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                {configs.map((config: any) => (
                    <div key={config.id} className={`glass-panel p-8 border-white/5 hover:border-primary/20 transition-all group relative overflow-hidden ${config.enabled ? 'bg-primary/5' : 'bg-surface-container/95'}`}>
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-6 min-w-0">
                                <div className={`p-4 rounded border border-white/5 ${config.enabled ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface-container-high text-on-surface-variant'}`}>
                                    <Mail size={24} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-display-lg text-lg text-on-surface uppercase tracking-tighter truncate">{config.name}</h4>
                                    <p className="font-data-mono text-[9px] text-on-surface-variant uppercase tracking-[0.2em] truncate">{config.user} @ {config.host}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => updateMutation.mutate({ id: config.id, enabled: !config.enabled })}
                                    className={`p-2 rounded transition-all border border-white/5 ${config.enabled ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-on-surface-variant hover:bg-white/5'}`}
                                >
                                    {config.enabled ? <Power size={18} /> : <PowerOff size={18} />}
                                </button>
                                <button
                                    onClick={() => { if (confirm(t('DELETE_COLLECTOR'))) deleteMutation.mutate(config.id) }}
                                    className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 border border-white/5 rounded transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 border-t border-white/5 pt-6 mt-6">
                            <div className="flex justify-between items-center font-data-mono text-[9px] uppercase tracking-widest">
                                <span className="text-on-surface-variant/60">{t('SYNC_STATUS')}</span>
                                {config.lastSync ? (
                                    <span className="text-primary flex items-center gap-2">
                                        <CheckCircle2 size={12} /> {t('MATRIX_SYNCHRONIZED')} {new Date(config.lastSync).toLocaleTimeString()}
                                    </span>
                                ) : (
                                    <span className="text-on-surface-variant/30 italic">{t('NEVER_SYNCED')}</span>
                                )}
                            </div>
                            <div className="flex justify-between items-center font-data-mono text-[9px] uppercase tracking-widest">
                                <span className="text-on-surface-variant/60">{t('TICKET_TARGET')}</span>
                                <span className="text-primary-fixed-dim border border-primary-fixed-dim/20 px-2 py-0.5 rounded">{config.category}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {configs.length === 0 && !isAdding && (
                    <div className="col-span-full border-2 border-dashed border-white/5 rounded p-16 flex flex-col items-center justify-center text-center group hover:border-primary/20 transition-all bg-surface-container/10">
                        <Mail size={48} className="text-on-surface-variant/20 mb-6 group-hover:scale-110 transition-transform" />
                        <p className="font-label-caps text-xs text-on-surface-variant uppercase tracking-[0.2em] font-black italic">{t('NO_INGESTION_PROTOCOLS')}</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isAdding && (
                <div className="fixed inset-0 bg-surface/95 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
                    <div className="glass-panel p-10 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 border-white/5">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="font-display-lg text-2xl text-primary uppercase tracking-tighter">{t('NEW_MAIL_COLLECTOR')}</h3>
                            <button onClick={() => setIsAdding(false)} className="text-on-surface-variant hover:text-primary transition-all p-2">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            createMutation.mutate({
                                name: formData.get('name') as string,
                                host: formData.get('host') as string,
                                port: Number(formData.get('port')),
                                user: formData.get('user') as string,
                                password: formData.get('password') as string,
                                category: formData.get('category') as any,
                                enabled: true
                            });
                        }} className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                            <div className="md:col-span-2 space-y-2">
                                <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Database size={12} /> {t('PROTOCOL_IDENTIFIER')}
                                </label>
                                <input name="name" required className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase" placeholder="SUPPORT_CENTRAL_IMAP" />
                            </div>
                            <div className="space-y-2">
                                <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1">IMAP_HOST</label>
                                <input name="host" required className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase" placeholder="imap.gmail.com" />
                            </div>
                            <div className="space-y-2">
                                <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1">PORT</label>
                                <input name="port" type="number" defaultValue={993} required className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase" />
                            </div>
                            <div className="space-y-2">
                                <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1">{t('USER_CREDENTIAL') || 'USER_CREDENTIAL'}</label>
                                <input name="user" required className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase" placeholder="user@domain.com" />
                            </div>
                            <div className="space-y-2">
                                <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Shield size={12} /> {t('AUTH_SECRET') || 'AUTH_SECRET'}
                                </label>
                                <input name="password" type="password" required className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase" />
                            </div>
                            <div className="md:col-span-2 flex justify-end gap-6 mt-10 pt-8 border-t border-white/5">
                                <button type="button" onClick={() => setIsAdding(false)} className="font-label-caps text-xs text-on-surface-variant hover:text-on-surface uppercase tracking-widest transition-all">{t('ABORT')}</button>
                                <button type="submit" disabled={createMutation.isPending} className="cyber-button px-10 h-12 !bg-primary text-on-primary-container border-primary flex items-center gap-3">
                                    {createMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={16} />}
                                    {t('INITIALIZE_COLLECTOR')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function Save({ size, className }: { size: number, className?: string }) {
    return <CheckCircle2 size={size} className={className} />;
}
