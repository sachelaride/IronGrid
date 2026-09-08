import { useState } from 'react';
import { trpc } from '../utils/trpc';
import { Mail, Bell, Shield, Save, Trash2, Send, CheckCircle2, XCircle, Plus, Loader2, Edit2, Globe, MessageSquare, Terminal, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/**
 * NotificationChannelManager - Central de Governança de Alertas.
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
export function NotificationChannelManager() {
    const { t } = useLanguage();
    const utils = trpc.useContext();
    const { data: channels = [], isLoading } = trpc.notifications.listChannels.useQuery();
    const [isCreating, setIsCreating] = useState(false);

    return (
        <div className="space-y-gutter">
            {/* Section Header */}
            <div className="flex justify-between items-end mb-8">
                <div className="space-y-1">
                    <h3 className="font-display-lg text-2xl text-primary uppercase tracking-tighter">{t('SET_CHANNELS')}</h3>
                    <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.3em] italic">{t('SET_REDUNDANT')}</p>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="cyber-button px-6 h-11 !bg-primary text-on-primary-container border-primary flex items-center gap-2"
                    >
                        <Plus size={16} /> {t('SET_NEW_CHANNEL')}
                    </button>
                )}
            </div>

            {/* Creation Form */}
            {isCreating && (
                <ChannelForm
                    onCancel={() => setIsCreating(false)}
                    onSuccess={() => {
                        setIsCreating(false);
                        utils.notifications.listChannels.invalidate();
                    }}
                />
            )}

            {/* Channel Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                {channels.map((channel: any) => (
                    <ChannelCard
                        key={channel.id}
                        channel={channel}
                        onUpdate={() => utils.notifications.listChannels.invalidate()}
                    />
                ))}
            </div>

            {/* Empty State */}
            {!isLoading && channels.length === 0 && !isCreating && (
                <div className="p-16 border-2 border-dashed border-white/5 rounded flex flex-col items-center justify-center text-center group hover:border-primary/20 transition-all bg-surface-container/10">
                    <Bell size={48} className="text-on-surface-variant/20 mb-6 group-hover:scale-110 transition-transform" />
                    <p className="font-label-caps text-xs text-on-surface-variant uppercase tracking-[0.2em] font-black italic">{t('SET_NO_PROTOCOLS')}</p>
                </div>
            )}
        </div>
    );
}

function ChannelCard({ channel, onUpdate }: { channel: any, onUpdate: () => void }) {
    const { t } = useLanguage();
    const [isEditing, setIsEditing] = useState(false);
    const deleteMutation = trpc.notifications.deleteChannel.useMutation({ onSuccess: onUpdate });
    const toggleMutation = trpc.notifications.updateChannel.useMutation({ onSuccess: onUpdate });
    const testMutation = trpc.notifications.testChannel.useMutation();

    const icons: any = {
        EMAIL: Mail,
        WEBHOOK: Globe,
        TELEGRAM: MessageSquare,
        SLACK: Terminal,
        DISCORD: MessageSquare
    };

    const Icon = icons[channel.type] || Bell;

    const handleTest = async () => {
        try {
            const res = await testMutation.mutateAsync({ id: channel.id });
            // Simplified feedback for this context
        } catch (e: any) {}
    };

    return (
        <div className="glass-panel p-8 border-white/5 hover:border-primary/20 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-6 min-w-0">
                    <div className="p-4 bg-surface-container rounded border border-white/5 group-hover:border-primary/30 transition-colors">
                        <Icon size={24} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-display-lg text-lg text-on-surface uppercase tracking-tighter truncate">{channel.name}</h4>
                        <span className="font-data-mono text-[9px] text-primary uppercase tracking-[0.2em]">{channel.type}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Toggle Switch */}
                    <button
                        onClick={() => toggleMutation.mutate({ id: channel.id, enabled: !channel.enabled })}
                        className={`w-11 h-6 rounded-full relative transition-all border border-white/10 ${channel.enabled ? 'bg-primary' : 'bg-surface-container-high'}`}
                    >
                        <div className={`absolute top-1 w-3.5 h-3.5 bg-on-surface rounded-full transition-all ${channel.enabled ? 'left-6 shadow-[0_0_10px_white]' : 'left-1'}`} />
                    </button>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-2 text-on-surface-variant hover:text-primary transition-all"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={() => { if (confirm(t('SET_CONFIRM_DELETE'))) deleteMutation.mutate({ id: channel.id }); }}
                        className="p-2 text-on-surface-variant hover:text-error transition-all"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className="space-y-6 mb-8">
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest mr-2 flex items-center gap-1.5">
                        <Shield size={12} /> {t('SET_SEVERITIES')}
                    </span>
                    {channel.severities.map((s: string) => (
                        <span key={s} className="px-2.5 py-0.5 bg-white/5 rounded border border-white/5 font-data-mono text-[8px] text-on-surface uppercase">{s}</span>
                    ))}
                </div>
                {channel.lastTested && (
                    <div className="flex items-center gap-2 font-data-mono text-[8px] uppercase tracking-widest border-t border-white/5 pt-4">
                        {channel.testStatus === 'success' ? <CheckCircle2 size={10} className="text-primary" /> : <XCircle size={10} className="text-error" />}
                        <span className={channel.testStatus === 'success' ? 'text-primary' : 'text-error'}>
                            {t('SET_LAST_TEST')} {new Date(channel.lastTested).toLocaleTimeString()} [{channel.testStatus.toUpperCase()}]
                        </span>
                    </div>
                )}
            </div>

            <button
                onClick={handleTest}
                disabled={testMutation.isPending}
                className="w-full h-11 bg-white/5 hover:bg-primary hover:text-on-primary-container text-on-surface-variant font-label-caps text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 rounded border border-white/5"
            >
                {testMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
                {t('SET_EXEC_TEST')}
            </button>

            {isEditing && (
                <EditChannelModal
                    channel={channel}
                    onClose={() => setIsEditing(false)}
                    onSuccess={() => {
                        setIsEditing(false);
                        onUpdate();
                    }}
                />
            )}
        </div>
    );
}

function ChannelForm({ onCancel, onSuccess }: { onCancel: () => void, onSuccess: () => void }) {
    const { t, language } = useLanguage();
    const createMutation = trpc.notifications.createChannel.useMutation({ onSuccess });
    const [name, setName] = useState('');
    const [type, setType] = useState('EMAIL');
    const currencyCode = language === 'PT-BR' ? 'BRL' : (language === 'ES' ? 'EUR' : 'USD');
    const currencyLocale = language === 'PT-BR' ? 'pt-BR' : (language === 'ES' ? 'es-ES' : 'en-US');
    const [config, setConfig] = useState<any>({
        host: '',
        port: '587',
        user: '',
        pass: '',
        from: '',
        to: '',
        secure: false
    });
    const [severities, setSeverities] = useState(['CRITICAL', 'WARNING']);

    const handleSave = () => {
        createMutation.mutate({
            name,
            type: type as any,
            config,
            severities: severities as any
        });
    };

    const handleGmailPreset = () => {
        setConfig({
            host: 'smtp.gmail.com',
            port: '587',
            user: config.user,
            pass: config.pass,
            from: config.from,
            secure: false
        });
    };

    return (
        <div className="glass-panel p-10 border-white/10 space-y-10 animate-in zoom-in-95 duration-200 bg-surface-container/95">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1">{t('SET_PROTOCOL_ID')}</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase"
                            placeholder="SMTP_CORE_RELAY"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1">{t('SET_SERVICE_MATRIX')}</label>
                        <select
                            value={type}
                            onChange={e => setType(e.target.value)}
                            className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase h-12"
                        >
                            <option value="EMAIL">{t('SET_TYPE_EMAIL')}</option>
                            <option value="WEBHOOK">{t('SET_TYPE_WEBHOOK')}</option>
                            <option value="TELEGRAM">{t('SET_TYPE_TELEGRAM')}</option>
                            <option value="SLACK">{t('SET_TYPE_SLACK')}</option>
                            <option value="DISCORD">{t('SET_TYPE_DISCORD')}</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1">{t('SET_ACTIVE_SEVERITIES')}</label>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {['INFO', 'WARNING', 'CRITICAL'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setSeverities(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                                    className={`px-4 py-2 rounded font-label-caps text-[10px] uppercase tracking-widest border transition-all ${severities.includes(s) ? 'bg-primary border-primary text-on-primary shadow-lg shadow-primary/20' : 'bg-surface-container-high border-white/5 text-on-surface-variant'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {type === 'EMAIL' && (
                <div className="p-8 bg-black/20 rounded border border-white/5 space-y-8">
                    <div className="flex justify-between items-center">
                        <label className="font-label-caps text-[10px] text-primary uppercase tracking-[0.3em]">{t('SET_SMTP_CONFIG')}</label>
                        <button
                            type="button"
                            onClick={handleGmailPreset}
                            className="font-label-caps text-[9px] text-on-surface-variant hover:text-primary uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                            <Mail size={12} className="text-error" /> {t('SET_GMAIL_PRESET')}
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="col-span-2 space-y-2">
                            <label className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">{t('SET_SMTP_HOST')}</label>
                            <input value={config.host} onChange={e => setConfig({ ...config, host: e.target.value })} className="w-full !bg-surface-container border-white/5 font-data-mono text-xs uppercase" placeholder="smtp.servidor.com" />
                        </div>
                        <div className="space-y-2">
                            <label className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">{t('SET_PORT')}</label>
                            <input value={config.port} onChange={e => setConfig({ ...config, port: e.target.value })} className="w-full !bg-surface-container border-white/5 font-data-mono text-xs uppercase" placeholder="587" />
                        </div>
                        <div className="space-y-2">
                            <label className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">{t('SET_AUTH_USER')}</label>
                            <input value={config.user} onChange={e => setConfig({ ...config, user: e.target.value })} className="w-full !bg-surface-container border-white/5 font-data-mono text-xs uppercase" placeholder="USER_ID" />
                        </div>
                        <div className="space-y-2">
                            <label className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">{t('SET_AUTH_SECRET')}</label>
                            <input value={config.pass} onChange={e => setConfig({ ...config, pass: e.target.value })} type="password" className="w-full !bg-surface-container border-white/5 font-data-mono text-xs uppercase" placeholder="••••••••" />
                        </div>
                        <div className="space-y-2">
                            <label className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">{t('SET_RECIPIENTS')}</label>
                            <input value={config.to || ''} onChange={e => setConfig({ ...config, to: e.target.value })} className="w-full !bg-surface-container border-white/5 font-data-mono text-xs uppercase" placeholder="alert@grid.com, admin@grid.com" />
                        </div>
                        <div className="space-y-2">
                            <label className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">{t('SET_SENDER_ALIAS')}</label>
                            <input value={config.from} onChange={e => setConfig({ ...config, from: e.target.value })} className="w-full !bg-surface-container border-white/5 font-data-mono text-xs uppercase" placeholder="IronGrid <noreply@irongrid.com>" />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex gap-6 pt-4 border-t border-white/5">
                <button onClick={onCancel} className="flex-1 h-12 font-label-caps text-xs text-on-surface-variant hover:text-on-surface uppercase tracking-widest transition-all">{t('SET_ABORT_SYNC')}</button>
                <button
                    onClick={handleSave}
                    disabled={!name || createMutation.isPending}
                    className="cyber-button flex-[2] h-14 !bg-primary text-on-primary-container border-primary flex items-center justify-center gap-3"
                >
                    {createMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {t('SET_INIT_PROTOCOL')}
                </button>
            </div>
        </div>
    );
}

function EditChannelModal({ channel, onClose, onSuccess }: { channel: any, onClose: () => void, onSuccess: () => void }) {
    const { t } = useLanguage();
    const updateMutation = trpc.notifications.updateChannel.useMutation({ onSuccess });
    const [name, setName] = useState(channel.name);
    const [config, setConfig] = useState<any>({
        ...channel.config,
        to: channel.config.to || channel.config.recipients || ''
    });
    const [severities, setSeverities] = useState(channel.severities || []);

    const handleUpdate = () => {
        updateMutation.mutate({
            id: channel.id,
            name,
            config,
            severities: severities as any
        });
    };

    return (
        <div className="fixed inset-0 bg-surface/95 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
            <div className="glass-panel p-10 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto border-white/5">
                <button onClick={onClose} className="absolute top-8 right-8 p-3 text-on-surface-variant hover:text-primary transition-all">
                    <X size={24} />
                </button>

                <h3 className="font-display-lg text-2xl text-primary uppercase tracking-tighter mb-10">{t('SET_EDIT_PROTOCOL')}</h3>

                <div className="space-y-10">
                    <div className="space-y-2">
                        <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1">{t('PROTOCOL_IDENTIFIER')}</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1">{t('ACTIVE_SEVERITIES')}</label>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {['INFO', 'WARNING', 'CRITICAL'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setSeverities((prev: string[]) => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                                    className={`px-4 py-2 rounded font-label-caps text-[10px] uppercase tracking-widest border transition-all ${severities.includes(s) ? 'bg-primary border-primary text-on-primary shadow-lg shadow-primary/20' : 'bg-surface-container-high border-white/5 text-on-surface-variant'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {channel.type === 'EMAIL' && (
                        <div className="p-8 bg-black/20 rounded border border-white/5 space-y-8">
                            <label className="font-label-caps text-[10px] text-primary uppercase tracking-[0.3em]">{t('SMTP_CONFIGURATION_BLOCK')}</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <label className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">{t('SMTP_HOST')}</label>
                                    <input value={config.host || ''} onChange={e => setConfig({ ...config, host: e.target.value })} className="w-full !bg-surface-container border-white/5 font-data-mono text-xs uppercase" />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">{t('SET_PORT')}</label>
                                    <input value={config.port || ''} onChange={e => setConfig({ ...config, port: e.target.value })} className="w-full !bg-surface-container border-white/5 font-data-mono text-xs uppercase" />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">{t('SET_AUTH_USER')}</label>
                                    <input value={config.user || ''} onChange={e => setConfig({ ...config, user: e.target.value })} className="w-full !bg-surface-container border-white/5 font-data-mono text-xs uppercase" />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">{t('SET_AUTH_SECRET')}</label>
                                    <input value={config.pass || ''} onChange={e => setConfig({ ...config, pass: e.target.value })} type="password" className="w-full !bg-surface-container border-white/5 font-data-mono text-xs uppercase" />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">{t('RECIPIENT_LIST_CSV')}</label>
                                    <input value={config.to || ''} onChange={e => setConfig({ ...config, to: e.target.value })} className="w-full !bg-surface-container border-white/5 font-data-mono text-xs uppercase" />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">{t('SET_SENDER_ALIAS')}</label>
                                    <input value={config.from || ''} onChange={e => setConfig({ ...config, from: e.target.value })} className="w-full !bg-surface-container border-white/5 font-data-mono text-xs uppercase" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-6 pt-10 border-t border-white/5">
                        <button onClick={onClose} className="flex-1 h-14 font-label-caps text-xs text-on-surface-variant hover:text-on-surface uppercase tracking-widest transition-all">{t('SET_ABORT_CHANGES')}</button>
                        <button
                            onClick={handleUpdate}
                            disabled={!name || updateMutation.isPending}
                            className="cyber-button flex-1 h-14 !bg-primary text-on-primary-container border-primary uppercase tracking-widest"
                        >
                            {updateMutation.isPending ? t('SET_COMMITTING') : t('SET_COMMIT_UPDATE')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
