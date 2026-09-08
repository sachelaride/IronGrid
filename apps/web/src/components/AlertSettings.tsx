import { useState, useEffect } from 'react';
import { trpc } from '../utils/trpc';
import { Activity, Zap, CheckCircle, Save, Clock, Mail, Bell, Shield, Server, ArrowRightLeft, Search, Loader2, Info } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/**
 * AlertSettings - Unified Criticality Matrix & Monitoring Thresholds.
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
export function AlertSettings() {
    const { t } = useLanguage();
    const utils = trpc.useContext();
    const { data: configs, isLoading: isConfigsLoading } = trpc.monitoring.getMonitoringConfigs.useQuery();
    const { data: devices = [], isLoading: isDevicesLoading } = trpc.monitoring.getDevicesWithLevels.useQuery();

    const updateConfig = trpc.monitoring.updateMonitoringConfig.useMutation({
        onSuccess: () => {
            utils.monitoring.getMonitoringConfigs.invalidate();
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
    });

    const setLevelMutation = trpc.monitoring.setDeviceMonitoringLevel.useMutation({
        onSuccess: () => {
            utils.monitoring.getDevicesWithLevels.invalidate();
        }
    });

    const [localConfigs, setLocalConfigs] = useState<any[]>([]);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<'config' | 0 | 1 | 2 | 3>(1);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (configs) {
            setLocalConfigs(configs);
        }
    }, [configs]);

    const handleUpdateLocal = (level: number, field: string, value: any) => {
        setLocalConfigs(prev => prev.map(c =>
            c.level === level ? { ...c, [field]: value } : c
        ));
    };

    const handleSave = (level: number) => {
        const config = localConfigs.find(c => c.level === level);
        if (config) {
            updateConfig.mutate({
                level: config.level,
                downtimeThreshold: Number(config.downtimeThreshold),
                uptimeThreshold: Number(config.uptimeThreshold),
                latencyThreshold: Number(config.latencyThreshold),
                email: config.email,
                enabled: config.enabled
            });
        }
    };

    if (isConfigsLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-32 glass-panel border-white/5 border-dashed rounded bg-surface-container/5">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
                <p className="font-label-caps text-xs text-on-surface-variant uppercase tracking-[0.4em] italic animate-pulse">{t('SCANNING_TIER_INVENTORY')}</p>
            </div>
        );
    }

    const filteredDevices = activeTab === 'config'
        ? []
        : devices.filter((d: any) => {
            const matchesLevel = (d.monitoringLevel || 0) === activeTab;
            const matchesSearch = d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                d.ipAddress?.includes(searchQuery);
            return matchesLevel && matchesSearch;
        });

    return (
        <div className="space-y-gutter animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="glass-panel p-10 border-white/5 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <Bell size={160} className="text-primary" />
                </div>
                <div className="flex items-center gap-8 relative z-10">
                    <div className="w-20 h-20 bg-primary/10 rounded border border-primary/20 flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary-fixed),0.1)]">
                        <Activity size={32} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="font-display-lg text-4xl text-primary uppercase tracking-tighter">{t('NAV_ALERT_SETTINGS')}</h2>
                        <p className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-[0.3em] mt-1 italic">{t('INCIDENT_ENGINE_SUBTITLE')}</p>
                    </div>
                </div>
                {saved && (
                    <div className="flex items-center gap-4 bg-primary text-on-primary-container px-6 py-3 rounded border border-white/20 shadow-2xl animate-bounce relative z-10">
                        <CheckCircle size={18} />
                        <span className="font-label-caps text-[10px] uppercase tracking-widest font-black">{t('POLICIES_SYNCED_SUCCESSFULLY')}</span>
                    </div>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap bg-surface-container/20 p-2 rounded border border-white/5 backdrop-blur-xl gap-2">
                {[1, 2, 3, 0].map((level) => (
                    <button
                        key={level}
                        onClick={() => { setActiveTab(level as any); setSearchQuery(''); }}
                        className={`flex-1 min-w-[160px] h-12 rounded font-label-caps text-[10px] uppercase tracking-widest transition-all border
                            ${activeTab === level
                                ? 'bg-primary text-on-primary border-primary shadow-[0_0_20px_rgba(var(--primary-fixed),0.3)]'
                                : 'text-on-surface-variant border-transparent hover:bg-white/5'}`}
                    >
                        {level === 0 ? 'OFF' : `L${level}`}
                    </button>
                ))}
                <button
                    onClick={() => { setActiveTab('config'); setSearchQuery(''); }}
                    className={`flex-1 min-w-[160px] h-12 rounded font-label-caps text-[10px] uppercase tracking-widest transition-all border
                        ${activeTab === 'config'
                            ? 'bg-primary-fixed text-on-primary-fixed-container border-primary-fixed shadow-[0_0_20px_rgba(var(--tertiary-fixed),0.3)]'
                            : 'text-on-surface-variant border-transparent hover:bg-white/5'}`}
                >
                    {t('GLOBAL_THRESHOLD_CONFIG')}
                </button>
            </div>

            {/* Global Threshold Content */}
            {activeTab === 'config' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter animate-in slide-in-from-bottom-6 duration-700">
                    {localConfigs.map((config) => {
                        const levelColors: any = {
                            1: 'text-primary border-primary/20 bg-primary/5',
                            2: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
                            3: 'text-error border-error/20 bg-error/5 shadow-[inset_0_0_30px_rgba(var(--error),0.05)]'
                        };
                        const glowColors: any = {
                            1: 'bg-primary',
                            2: 'bg-amber-500',
                            3: 'bg-error'
                        };

                        return (
                            <div key={config.level} className={`glass-panel border-white/5 p-10 flex flex-col transition-all group hover:border-white/20 relative overflow-hidden ${!config.enabled ? 'opacity-30 grayscale' : ''}`}>
                                <div className={`absolute -right-16 -top-16 w-48 h-48 rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity ${glowColors[config.level]}`} />
                                
                                <div className="flex justify-between items-start mb-10 relative z-10">
                                    <div className={`p-4 rounded border ${levelColors[config.level]}`}>
                                        <Bell size={28} />
                                    </div>
                                    <div className="text-right">
                                        <h4 className="font-display-lg text-2xl text-on-surface uppercase tracking-tighter italic leading-none">L{config.level}</h4>
                                        <p className={`font-label-caps text-[9px] uppercase tracking-[0.3em] mt-2 ${levelColors[config.level].split(' ')[0]}`}>
                                            {config.level === 1 ? t('STANDARD_OPS') : config.level === 2 ? t('CRITICAL_INFRA') : t('EMERGENCY_NODES')}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-8 flex-1 relative z-10">
                                    <div className="space-y-3">
                                        <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Clock size={12} className="opacity-40" /> {t('DOWNTIME_LATENCY_MAX')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={config.downtimeThreshold}
                                                onChange={(e) => handleUpdateLocal(config.level, 'downtimeThreshold', e.target.value)}
                                                className="w-full editable-field font-data-mono text-lg text-on-surface p-4 pr-14"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">MINS</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Zap size={12} className="opacity-40" /> {t('PING_JITTER_THRESHOLD')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={config.latencyThreshold}
                                                onChange={(e) => handleUpdateLocal(config.level, 'latencyThreshold', e.target.value)}
                                                className="w-full editable-field font-data-mono text-lg text-on-surface p-4 pr-14"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">MS</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Mail size={12} className="opacity-40" /> {t('ALERT_TRANSMISSION_NODES')}
                                        </label>
                                        <textarea
                                            value={config.email || ''}
                                            onChange={(e) => handleUpdateLocal(config.level, 'email', e.target.value)}
                                            placeholder="operator@irongrid.net, admin@irongrid.net"
                                            className="w-full editable-field font-data-mono text-[10px] uppercase p-4 min-h-[80px] resize-none custom-scrollbar"
                                        />
                                    </div>
                                </div>

                                <div className="mt-10 pt-8 border-t border-white/5 flex gap-4 relative z-10">
                                    <button
                                        onClick={() => handleUpdateLocal(config.level, 'enabled', !config.enabled)}
                                        className={`flex-1 h-12 rounded font-label-caps text-[9px] uppercase tracking-widest border transition-all 
                                            ${config.enabled
                                                ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                                                : 'bg-white/5 text-on-surface-variant border-white/10 hover:bg-white/10'}`}
                                    >
                                        {config.enabled ? t('ACTIVE_STATE') : t('OFFLINE_STATE')}
                                    </button>
                                    <button
                                        onClick={() => handleSave(config.level)}
                                        disabled={updateConfig.isPending}
                                        className="cyber-button flex-[2] h-12 !bg-primary text-on-primary-container border-primary flex items-center justify-center gap-3"
                                    >
                                        {updateConfig.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        {(t('SYNC_L') || 'SYNC_L')} {config.level}
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    <div className="lg:col-span-3 p-10 bg-primary/5 border border-primary/20 rounded flex items-center gap-10 shadow-inner group">
                        <div className="w-20 h-20 bg-primary/10 rounded-full border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_30px_rgba(var(--primary-fixed),0.1)] group-hover:scale-110 transition-transform">
                            <Shield size={32} />
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-display-lg text-xl text-on-surface uppercase tracking-tighter italic">{t('HIERARCHICAL_EXCLUSIVITY_PROTOCOL')}</h4>
                            <p className="font-label-caps text-[10px] text-on-surface-variant leading-relaxed uppercase tracking-[0.1em] max-w-3xl">
                                {t('HIERARCHICAL_DESC') || `Assigning a node to a specific criticality level triggers an automatic extraction from all other tiers. Nodes in LEVEL_00 bypass external alert dispatch and only register within the local operational dashboard.`}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Device List Content */}
            {activeTab !== 'config' && (
                <div className="glass-panel border-white/5 overflow-hidden animate-in slide-in-from-bottom-6 duration-700 shadow-2xl">
                    <div className="p-10 border-b border-white/5 flex flex-col xl:flex-row justify-between xl:items-center gap-8 bg-surface-container/10">
                        <div className="flex items-center gap-6">
                            <div className={`p-4 rounded border shadow-inner ${
                                activeTab === 0 ? 'text-on-surface-variant border-white/10 bg-white/5' :
                                activeTab === 1 ? 'text-primary border-primary/20 bg-primary/5' :
                                activeTab === 2 ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' :
                                'text-error border-error/20 bg-error/5 animate-pulse'
                            }`}>
                                <Server size={28} />
                            </div>
                            <div>
                                <h4 className="font-display-lg text-2xl text-on-surface uppercase tracking-tighter italic">
                                    {t('INVENTORY_ALLOCATION')}: {activeTab === 0 ? 'OFF' : `L${activeTab}`}
                                </h4>
                                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.3em] mt-1 italic">
                                    {filteredDevices.length} {t('NODES_SYNC_TIER') || 'Nodes Synchronized in this Tier'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-6">
                            <div className="relative group/search">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40 group-focus-within/search:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder={t('SEARCH_NODE_IDENTIFIER')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-12 pr-6 h-12 bg-surface-container-high/40 border border-white/5 rounded font-data-mono text-xs uppercase w-[320px] focus:w-[400px] transition-all outline-none focus:border-primary shadow-inner"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                        {isDevicesLoading ? (
                            <div className="p-32 flex flex-col items-center justify-center opacity-40">
                                <Loader2 className="animate-spin mb-4" />
                                <span className="font-label-caps text-[10px] uppercase tracking-widest">{t('SCANNING_TIER_INVENTORY')}</span>
                            </div>
                        ) : filteredDevices.length === 0 ? (
                            <div className="p-32 text-center">
                                <div className="p-10 bg-surface-container/20 rounded-full w-fit mx-auto mb-8 border border-white/5 opacity-20">
                                    <Server size={64} />
                                </div>
                                <h3 className="font-display-lg text-xl text-on-surface-variant/40 uppercase tracking-tighter italic">{t('TIER_INVENTORY_VACANT')}</h3>
                                <p className="font-label-caps text-[10px] text-on-surface-variant/20 uppercase tracking-[0.2em] mt-3 italic">{t('TIER_VACANT_DESC') || 'Switch matrices to relocate nodes to this tier.'}</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface-container/30 border-b border-white/5">
                                        <th className="px-10 py-5 font-label-caps text-[9px] text-primary uppercase tracking-[0.3em] w-1/3">{t('NODE_IDENTIFIER')}</th>
                                        <th className="px-10 py-5 font-label-caps text-[9px] text-primary uppercase tracking-[0.3em] w-1/4">{t('IPV4_ENDPOINT')}</th>
                                        <th className="px-10 py-5 font-label-caps text-[9px] text-primary uppercase tracking-[0.3em] w-1/6">{t('OPERATIONAL_STATE')}</th>
                                        <th className="px-10 py-5 font-label-caps text-[9px] text-primary uppercase tracking-[0.3em] text-right">{t('MIGRATION_ACTION')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredDevices.map((device: any) => (
                                        <tr key={device.id} className="hover:bg-white/5 transition-all group">
                                            <td className="px-10 py-6">
                                                <div className="font-display-lg text-[13px] text-on-surface uppercase tracking-tight group-hover:text-primary transition-colors">{device.name}</div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="font-data-mono text-[11px] text-on-surface-variant/60 uppercase tracking-widest">{device.ipAddress}</div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] ${
                                                        device.status === 'ONLINE' ? 'text-primary bg-primary' : 
                                                        device.status === 'OFFLINE' ? 'text-error bg-error' : 
                                                        'text-amber-500 bg-amber-500'
                                                    }`} />
                                                    <span className="font-label-caps text-[9px] text-on-surface uppercase tracking-widest italic">{device.status}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="inline-flex items-center bg-surface-container/60 rounded border border-white/10 p-1 group-hover:border-primary/20 transition-all">
                                                    <div className="px-3 py-1 opacity-20 border-r border-white/5"><ArrowRightLeft size={12} /></div>
                                                    {[0, 1, 2, 3].map((levelOption) => (
                                                        levelOption !== activeTab && (
                                                            <button
                                                                key={levelOption}
                                                                onClick={() => setLevelMutation.mutate({ deviceId: device.id, level: levelOption })}
                                                                disabled={setLevelMutation.isPending}
                                                                className={`px-4 py-1.5 font-data-mono text-[10px] transition-all rounded font-black
                                                                    ${levelOption === 0 ? 'text-on-surface-variant/40 hover:bg-white/5' : 
                                                                      levelOption === 1 ? 'text-primary hover:bg-primary/10' :
                                                                      levelOption === 2 ? 'text-amber-500 hover:bg-amber-500/10' :
                                                                      'text-error hover:bg-error/10'}`}
                                                                title={`Migrate to Tier L${levelOption}`}
                                                            >
                                                                {levelOption === 0 ? 'OFF' : `L${levelOption}`}
                                                            </button>
                                                        )
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
