import React, { useState, useEffect } from 'react';
import { 
    TrendingUp, ExternalLink, 
    Plus, Trash2, Loader2,
    RefreshCcw, Search, ChevronDown, ChevronUp,
    Key, ShieldCheck, Zap, Lightbulb, ListChecks,
    AlertCircle, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '../utils/trpc';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';

interface DeviceConfig {
    name: string;
    ip: string;
    interfaces: string[];
}

interface GrafanaManagerProps {
    initialView?: 'gen' | 'list' | 'tips';
}

export function GrafanaManager({ initialView = 'gen' }: GrafanaManagerProps) {
    const { t } = useLanguage();
    const [view, setView] = useState(initialView);
    const [devices, setDevices] = useState<DeviceConfig[]>([]);
    const [dashboardName, setDashboardName] = useState('IronGrid NOC Dashboard');
    const [isGenerating, setIsGenerating] = useState(false);
    const [expandedIps, setExpandedIps] = useState<string[]>([]);
    const [grafanaToken, setGrafanaToken] = useState(() => localStorage.getItem('grafana_token') || '');
    const [autoImport, setAutoImport] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');

    useEffect(() => {
        setView(initialView);
    }, [initialView]);

    const { data: config, isLoading: isLoadingConfig } = trpc.grafana.getConfig.useQuery();
    const { data: discoveryData, isLoading: isLoadingDiscovery, refetch: refetchDiscovery } = trpc.grafana.getDiscoveryData.useQuery();
    const { data: remoteDashboards, refetch: refetchDashboards, isLoading: isLoadingDashboards } = trpc.grafana.listDashboards.useQuery(
        { grafanaToken },
        { enabled: !!grafanaToken }
    );
    
    const generateMutation = trpc.grafana.generate.useMutation({
        onSuccess: (data) => {
            toast.success(data.message);
            setIsGenerating(false);
            setDevices([]);
            setDashboardName('IronGrid NOC Dashboard');
            if (autoImport) refetchDashboards();
        },
        onError: (error) => {
            toast.error(error.message);
            setIsGenerating(false);
        }
    });

    const deleteMutation = trpc.grafana.deleteDashboard.useMutation({
        onSuccess: (data) => {
            toast.success(data.message);
            refetchDashboards();
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    useEffect(() => {
        if (config?.devices) {
            setDevices(config.devices);
        }
    }, [config]);

    const saveToken = (token: string) => {
        setGrafanaToken(token);
        localStorage.setItem('grafana_token', token);
        setConnectionStatus('idle');
    };

    const addDevice = () => {
        setDevices([...devices, { name: '', ip: '', interfaces: [] }]);
    };

    const removeDevice = (index: number) => {
        setDevices(devices.filter((_, i) => i !== index));
    };

    const updateDevice = (index: number, field: keyof DeviceConfig, value: any) => {
        const newDevices = [...devices];
        if (field === 'interfaces') {
            newDevices[index][field] = value.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '');
        } else {
            (newDevices[index] as any)[field] = value;
        }
        setDevices(newDevices);
    };

    const handleGenerate = () => {
        if (devices.length === 0) {
            toast.warning("Select at least one node!");
            return;
        }
        if (autoImport && !grafanaToken) {
            toast.error("Grafana Token required for Auto-Import!");
            return;
        }
        setIsGenerating(true);
        generateMutation.mutate({ devices, dashboardName, autoImport, grafanaToken: grafanaToken.trim() });
    };

    const handleDeleteDashboard = (uid: string) => {
        if (window.confirm(t('CONFIRM_DELETE_DASHBOARD') || 'Are you sure you want to delete this dashboard from Grafana?')) {
            deleteMutation.mutate({ uid, grafanaToken: grafanaToken.trim() });
        }
    };

    const isInterfaceSelected = (ip: string, iface: string) => {
        const dev = devices.find(d => d.ip === ip);
        return dev?.interfaces.includes(iface);
    };

    const handleInterfaceClick = (ip: string, name: string, iface: string) => {
        const existingDeviceIdx = devices.findIndex(d => d.ip === ip);
        
        if (existingDeviceIdx > -1) {
            const newDevices = [...devices];
            const ifaceIdx = newDevices[existingDeviceIdx].interfaces.indexOf(iface);
            
            if (ifaceIdx === -1) {
                newDevices[existingDeviceIdx].interfaces.push(iface);
                setDevices(newDevices);
                toast.success(`Port ${iface} added to manifest`);
            } else {
                newDevices[existingDeviceIdx].interfaces.splice(ifaceIdx, 1);
                setDevices(newDevices);
                toast.info(`Port ${iface} removed from manifest`);
            }
        } else {
            setDevices([...devices, { name: name, ip: ip, interfaces: [iface] }]);
            toast.success(`${name} added to manifest`);
        }
    };

    const toggleIpExpansion = (ip: string) => {
        if (expandedIps.includes(ip)) {
            setExpandedIps(expandedIps.filter(i => i !== ip));
        } else {
            setExpandedIps([...expandedIps, ip]);
        }
    };

    const testConnectionMutation = trpc.grafana.testConnection.useMutation({
        onSuccess: (data) => {
            setConnectionStatus('success');
            toast.success(data.message, {
                style: {
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid #10b981',
                    color: '#10b981',
                    fontFamily: 'var(--font-data-mono)'
                }
            });
            refetchDashboards();
        },
        onError: (error) => {
            setConnectionStatus('error');
            toast.error(error.message, {
                style: {
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    fontFamily: 'var(--font-data-mono)'
                }
            });
        }
    });

    const handleTestConnection = () => {
        if (!grafanaToken) {
            toast.error(t('GRAFANA_TOKEN_MISSING'));
            return;
        }
        setConnectionStatus('checking');
        testConnectionMutation.mutate({ grafanaToken: grafanaToken.trim() });
    };

    useEffect(() => {
        if (grafanaToken && connectionStatus === 'idle') {
            handleTestConnection();
        }
    }, [grafanaToken]);

    if (isLoadingConfig) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-gutter pb-20 animate-in fade-in duration-700 pt-4">
            <header className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="font-display-lg text-display-lg text-primary uppercase tracking-tighter mb-1">
                            {view === 'gen' && t('NOC_GENERATOR')}
                            {view === 'list' && t('DASHBOARD_MANAGEMENT')}
                            {view === 'tips' && t('GRAFANA_NODE_CONFIG')}
                        </h1>
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-secondary-fixed status-glow-primary"></span>
                            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
                                {view === 'gen' && t('NOC_GENERATOR_SUB')}
                                {view === 'list' && t('DASHBOARD_MANAGEMENT_SUB')}
                                {view === 'tips' && t('GRAFANA_NODE_CONFIG_SUB')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <a 
                                href="http://localhost:3000" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="cyber-button flex items-center gap-2"
                            >
                                <ExternalLink size={14} /> {t('GRAFANA_INSTANCE')}
                            </a>
                            <button 
                                onClick={handleTestConnection}
                                className={`h-10 px-4 rounded-xl border flex items-center gap-2 transition-all ${
                                    connectionStatus === 'success' ? 'bg-success/10 border-success/20 text-success' : 
                                    connectionStatus === 'error' ? 'bg-error/10 border-error/20 text-error' : 
                                    'bg-white/5 border-white/10 text-on-surface-variant'
                                }`}
                            >
                                <div className={`w-2 h-2 rounded-full ${
                                    connectionStatus === 'success' ? 'bg-success animate-pulse' : 
                                    connectionStatus === 'error' ? 'bg-error' : 
                                    'bg-on-surface-variant/40'
                                }`} />
                                <span className="font-label-caps text-[9px] uppercase tracking-widest font-black">
                                    {connectionStatus === 'checking' ? t('CHECKING') : connectionStatus === 'success' ? t('CONNECTED') : connectionStatus === 'error' ? t('AUTH_ERROR') : t('UNTESTED')}
                                </span>
                            </button>
                            <button 
                                onClick={() => setView(view === 'tips' ? 'gen' : 'tips')}
                                className="h-10 px-4 rounded-xl border bg-white/5 border-white/10 text-on-surface-variant flex items-center gap-2 transition-all hover:text-primary hover:border-primary/40"
                            >
                                <ListChecks size={14} />
                                <span className="font-label-caps text-[9px] uppercase tracking-widest font-black">
                                    {view === 'tips' ? t('BACK') || 'VOLTAR' : t('CONFIGURE_ACCESS') || 'CONFIGS'}
                                </span>
                            </button>
                        </div>
                        {view === 'gen' && (
                            <button 
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="cyber-button flex items-center gap-2 !bg-primary text-on-primary-container border-primary"
                            >
                                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                                {autoImport ? t('GENERATE_IMPORT') : t('GENERATE_JSON')}
                            </button>
                        )}
                    </div>
                </div>

                {view === 'gen' && (
                    <div className="glass-panel p-6 flex flex-col md:flex-row items-center gap-8 bg-primary/5">
                        <div className="flex-1 space-y-2 w-full">
                            <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1">{t('DASHBOARD_IDENTIFIER')}</label>
                            <input 
                                type="text" 
                                value={dashboardName} 
                                onChange={(e) => setDashboardName(e.target.value)}
                                placeholder="IRONGRID NOC BACKBONE"
                                className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase"
                            />
                        </div>
                        <div className="flex-[2] flex items-start gap-4 p-4 bg-secondary-fixed/5 rounded border border-secondary-fixed/10">
                            <Lightbulb size={20} className="text-secondary-fixed shrink-0 mt-1" />
                            <p className="font-label-caps text-[11px] text-on-surface-variant leading-relaxed tracking-tight">
                                <span className="text-secondary-fixed font-bold">PRO TIP:</span> Enable interfaces in <b>MONITORING &gt; GRAPH SELECTION</b> to ensure they appear in the Active Discovery stream.
                            </p>
                        </div>
                    </div>
                )}
            </header>

            <AnimatePresence mode="wait">
                {view === 'gen' && (
                    <motion.div 
                        key="gen"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-gutter"
                    >
                        {!grafanaToken && (
                            <div className="glass-panel p-4 bg-error/5 border-error/20 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="text-error" size={18} />
                                    <span className="font-label-caps text-[10px] text-error uppercase tracking-widest">{t('GRAFANA_TOKEN_MISSING') || 'Security Token Missing. Auto-Import Protocol Disabled.'}</span>
                                </div>
                                <button onClick={() => setView('tips')} className="font-label-caps text-[10px] text-primary hover:brightness-110 uppercase tracking-[0.2em] underline underline-offset-4">{t('CONFIGURE_ACCESS') || 'Configure Access'}</button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <Plus size={16} className="text-primary" />
                                    <h2 className="font-label-caps text-label-caps text-primary uppercase tracking-widest">{t('MANIFEST_EDITOR')}</h2>
                                </div>
                                {devices.map((dev, idx) => (
                                    <div key={idx} className="glass-panel p-6 border-white/5 relative group hover:border-primary/20 transition-all">
                                        <button onClick={() => removeDevice(idx)} className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1">{t('LABEL')}</label>
                                                <input type="text" value={dev.name} onChange={(e) => updateDevice(idx, 'name', e.target.value)} className="w-full !bg-surface-container border-white/5 font-data-mono text-xs uppercase" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1">{t('IP_ADDRESS')}</label>
                                                <input type="text" value={dev.ip} onChange={(e) => updateDevice(idx, 'ip', e.target.value)} className="w-full !bg-surface-container border-white/5 font-data-mono text-xs uppercase" />
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1">{t('PORTS_MATRIX')}</label>
                                                <textarea value={dev.interfaces.join(', ')} onChange={(e) => updateDevice(idx, 'interfaces', e.target.value)} className="w-full !bg-surface-container border-white/5 font-data-mono text-xs uppercase min-h-[80px]" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={addDevice} className="w-full py-6 border border-dashed border-white/10 rounded font-label-caps text-xs text-on-surface-variant hover:text-primary hover:border-primary/40 transition-all flex items-center justify-center gap-3 uppercase tracking-widest bg-surface-container/30">
                                    <Plus size={16} /> {t('ADD_NODE_MANUALLY')}
                                </button>
                            </div>

                            <div className="glass-panel p-8 space-y-8 border-white/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-primary">
                                        <Search size={22} />
                                        <h2 className="font-display-lg text-xl uppercase tracking-tighter">{t('ACTIVE_DISCOVERY')}</h2>
                                    </div>
                                    <button onClick={() => refetchDiscovery()} className="p-2 text-on-surface-variant hover:text-primary transition-all">
                                        <RefreshCcw size={18} />
                                    </button>
                                </div>
                                <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-4">
                                    {isLoadingDiscovery ? (
                                        <div className="py-20 flex flex-col items-center gap-4 opacity-40">
                                            <Loader2 className="w-8 h-8 animate-spin" />
                                            <span className="font-label-caps text-[10px] tracking-[0.3em]">SCANNING GRID...</span>
                                        </div>
                                    ) : discoveryData && Object.keys(discoveryData).length > 0 ? (
                                        Object.entries(discoveryData as any).map(([ip, data]: any) => (
                                            <div key={ip} className="bg-surface-container border border-white/5 rounded overflow-hidden hover:border-primary/20 transition-all">
                                                <button onClick={() => toggleIpExpansion(ip)} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all text-left">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-2 h-2 bg-primary rounded-full status-glow-primary" />
                                                        <div>
                                                            <p className="font-label-caps text-[12px] text-on-surface uppercase tracking-tight">{data.name}</p>
                                                            <p className="font-data-mono text-[9px] text-on-surface-variant uppercase tracking-widest">{ip}</p>
                                                        </div>
                                                    </div>
                                                    {expandedIps.includes(ip) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </button>
                                                <AnimatePresence>
                                                    {expandedIps.includes(ip) && (
                                                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-4 pb-4 overflow-hidden bg-surface-container-high/30">
                                                            <div className="flex flex-wrap gap-2 pt-4">
                                                                {data.interfaces.map((iface: string) => (
                                                                    <button 
                                                                        key={iface} 
                                                                        onClick={() => handleInterfaceClick(ip, data.name, iface)} 
                                                                        className={`px-3 py-1.5 rounded font-data-mono text-[9px] transition-all border ${
                                                                            isInterfaceSelected(ip, iface) 
                                                                            ? 'bg-primary text-on-primary-container border-primary shadow-lg shadow-primary/20' 
                                                                            : 'bg-surface-container border-white/10 text-on-surface-variant hover:text-primary hover:border-primary/40'
                                                                        }`}
                                                                    >
                                                                        {iface}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="font-label-caps text-[10px] text-on-surface-variant/40 text-center py-10 uppercase tracking-widest italic">No compatible nodes detected in current 24h sector.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {view === 'list' && (
                    <motion.div 
                        key="list"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="glass-panel p-10 border-white/5 space-y-8"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-primary">
                                <TrendingUp size={24} />
                                <h2 className="font-display-lg text-2xl uppercase tracking-tighter">{t('GRAFANA_REGISTRY')}</h2>
                            </div>
                            <button onClick={() => refetchDashboards()} className="p-2 text-on-surface-variant hover:text-primary transition-all">
                                <RefreshCcw size={18} />
                            </button>
                        </div>

                        {!grafanaToken ? (
                            <div className="py-32 text-center space-y-6 opacity-30">
                                <Key className="mx-auto" size={64} />
                                <p className="font-label-caps text-label-caps uppercase tracking-[0.3em]">{t('ACCESS_KEY_REQUIRED') || 'Access Key Required for Registry Sync'}</p>
                            </div>
                        ) : isLoadingDashboards ? (
                            <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-40">
                                <Loader2 className="w-10 h-10 animate-spin" />
                                <span className="font-label-caps text-[10px] tracking-[0.3em]">{t('FETCHING_DASHBOARDS') || 'FETCHING DASHBOARDS...'}</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
                                {remoteDashboards?.length > 0 ? (
                                    remoteDashboards.map((dash: any) => (
                                        <div key={dash.uid} className="glass-panel p-6 border-white/5 group hover:border-primary/20 transition-all flex items-center justify-between bg-surface-container/95">
                                            <div className="space-y-1">
                                                <h3 className="font-label-caps text-[12px] text-on-surface uppercase tracking-tight">{dash.title}</h3>
                                                <p className="font-data-mono text-[9px] text-on-surface-variant uppercase tracking-widest">{dash.uid}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteDashboard(dash.uid)}
                                                className="p-3 text-on-surface-variant hover:text-error hover:bg-error/10 rounded transition-all flex items-center gap-2 group/del"
                                                title={t('REMOVE_FROM_GRAFANA') || "Remove from Grafana"}
                                            >
                                                <span className="font-label-caps text-[9px] opacity-0 group-hover/del:opacity-100 transition-all">{t('DELETE') || 'EXCLUIR'}</span>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-32 text-center text-on-surface-variant/40 font-label-caps text-xs uppercase tracking-widest italic">No IronGrid tagged dashboards found in instance.</div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}

                {view === 'tips' && (
                    <motion.div 
                        key="tips"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-gutter"
                    >
                        <div className="glass-panel p-10 border-primary/20 bg-primary/5 space-y-10">
                            <div className="flex items-center gap-6 text-primary">
                                <ShieldCheck size={40} />
                                <h2 className="font-display-lg text-3xl uppercase tracking-tighter">{t('GRAFANA_AUTH_SEQUENCE')}</h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                <div className="space-y-4">
                                    <div className="w-12 h-12 bg-primary text-on-primary-container rounded flex items-center justify-center font-display-lg text-2xl shadow-lg shadow-primary/20">01</div>
                                    <h4 className="font-label-caps text-[12px] text-on-surface uppercase tracking-widest">ACCESS ADMINISTRATION</h4>
                                    <p className="font-label-caps text-[11px] text-on-surface-variant/70 leading-relaxed uppercase tracking-tight">Navigate to <b>Administration &gt; Users & Access &gt; Service Accounts</b> in your Grafana instance.</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="w-12 h-12 bg-primary text-on-primary-container rounded flex items-center justify-center font-display-lg text-2xl shadow-lg shadow-primary/20">02</div>
                                    <h4 className="font-label-caps text-[12px] text-on-surface uppercase tracking-widest">{t('PROVISION_ACCOUNT')}</h4>
                                    <p className="font-label-caps text-[11px] text-on-surface-variant/70 leading-relaxed uppercase tracking-tight">Initialize <b>Add Service Account</b>, label as "IronGrid" and assign <b>Admin</b> or <b>Editor</b> clearance.</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="w-12 h-12 bg-primary text-on-primary-container rounded flex items-center justify-center font-display-lg text-2xl shadow-lg shadow-primary/20">03</div>
                                    <h4 className="font-label-caps text-[12px] text-on-surface uppercase tracking-widest">GENERATE TOKEN</h4>
                                    <p className="font-label-caps text-[11px] text-on-surface-variant/70 leading-relaxed uppercase tracking-tight">Select <b>Add Token</b>, capture the secure string, and commit it to the IronGrid control terminal below.</p>
                                </div>
                            </div>

                            <div className="pt-10 border-t border-white/5 space-y-6">
                                <div className="flex items-center justify-between p-6 bg-surface-container rounded border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <Zap className="text-primary" size={24} />
                                        <span className="font-label-caps text-xs text-on-surface uppercase tracking-widest">AUTOMATED REGISTRY SYNC</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">IMPORT PROTOCOL</span>
                                        <input 
                                            type="checkbox" 
                                            checked={autoImport}
                                            onChange={(e) => setAutoImport(e.target.checked)}
                                            className="w-5 h-5 rounded border-white/10 bg-surface-container text-primary focus:ring-primary"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1">ENCRYPTED SERVICE TOKEN</label>
                                    <div className="flex gap-4">
                                        <input 
                                            type="password" 
                                            value={grafanaToken}
                                            onChange={(e) => saveToken(e.target.value)}
                                            className="flex-1 !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase tracking-widest"
                                            placeholder="NO_TOKEN_IDENTIFIED"
                                        />
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(grafanaToken);
                                                toast.success("Token copied to secure clipboard");
                                            }}
                                            className="cyber-button p-4 !bg-primary text-on-primary-container border-primary"
                                        >
                                            <Copy size={20} />
                                        </button>
                                        <button 
                                            onClick={handleTestConnection}
                                            disabled={testConnectionMutation.isPending}
                                            className="cyber-button px-6 flex items-center gap-3 !bg-secondary-fixed text-black border-secondary-fixed shadow-[0_0_20px_rgba(var(--secondary-fixed),0.3)] font-display-lg uppercase italic tracking-tighter"
                                        >
                                            {testConnectionMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <RefreshCcw size={18} />}
                                            {testConnectionMutation.isPending ? t('GRAFANA_TESTING') : t('GRAFANA_TEST_CONNECTION')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel p-10 border-secondary-fixed/20 bg-secondary-fixed/5 space-y-10">
                            <div className="flex items-center gap-6 text-secondary-fixed">
                                <ListChecks size={40} />
                                <h2 className="font-display-lg text-3xl uppercase tracking-tighter">OPERATIONAL GUIDELINES</h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                                <div className="flex gap-6 p-8 bg-surface-container/50 rounded border border-white/5">
                                    <Zap className="text-secondary-fixed shrink-0" size={32} />
                                    <div>
                                        <h5 className="font-label-caps text-sm text-on-surface mb-2 uppercase tracking-widest">METRIC ACTIVATION</h5>
                                        <p className="font-label-caps text-[11px] text-on-surface-variant/70 leading-relaxed uppercase tracking-tight">
                                            Telemetry streams only active for nodes identified in <b>MONITORING &gt; GRAPH SELECTION</b>. Inactive ports will not manifest in the discovery sequence.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-6 p-8 bg-surface-container/50 rounded border border-white/5">
                                    <TrendingUp className="text-primary shrink-0" size={32} />
                                    <div>
                                        <h5 className="font-label-caps text-sm text-on-surface mb-2 uppercase tracking-widest">POLLING SEQUENCE</h5>
                                        <p className="font-label-caps text-[11px] text-on-surface-variant/70 leading-relaxed uppercase tracking-tight">
                                            Standard polling frequency is 60s. Latency in discovery may occur; allow up to 120s for new data propagation.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
