import { useState, useEffect, useCallback } from 'react';
import { trpc } from '../utils/trpc';
import { toast } from 'sonner';
import { 
    Network, Save, Info, Check, Server, Laptop, Printer, Phone, Camera, 
    Database, HardDrive, Wifi, Layout, Share2, Download, ExternalLink, 
    Zap, FileJson, Copy, Globe, Shield, Loader2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const DEVICE_TYPES = [
    { id: 'gateway', label: 'GATEWAY / ROUTER', icon: Globe, desc: 'Internet Entry & Routing' },
    { id: 'firewall', label: 'FIREWALL', icon: Shield, desc: 'Security & Perimeter' },
    { id: 'switch', label: 'SWITCH', icon: Network, desc: 'LAN Distribution Stack' },
    { id: 'server', label: 'SERVERS', icon: Server, desc: 'Critical Compute Nodes' },
    { id: 'ap', label: 'ACCESS POINTS', icon: Wifi, desc: 'Wireless RF Infrastructure' },
    { id: 'workstation', label: 'WORKSTATIONS', icon: Laptop, desc: 'User Endpoints & PCs' },
    { id: 'printer', label: 'PRINTERS', icon: Printer, desc: 'Network Print Services' },
    { id: 'voip', label: 'VOIP PHONES', icon: Phone, desc: 'Telephony Infrastructure' },
    { id: 'camera', label: 'IP CAMERAS', icon: Camera, desc: 'Security Surveillance' },
    { id: 'storage', label: 'NAS / STORAGE', icon: HardDrive, desc: 'Network Attached Storage' },
    { id: 'database', label: 'DATABASES', icon: Database, desc: 'Core Data Repositories' },
];

const DEFAULT_VISIBLE = ['gateway', 'firewall', 'switch'];

export function TopologyVisibilitySettings() {
    const { t } = useLanguage();
    const [selectedTypes, setSelectedTypes] = useState<string[]>(DEFAULT_VISIBLE);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('irongrid_topology_infra_types');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const legacyDefault = ['gateway', 'firewall', 'switch', 'server', 'ap'];
                if (Array.isArray(parsed) && legacyDefault.every((id) => parsed.includes(id)) && parsed.length === legacyDefault.length) {
                    localStorage.setItem('irongrid_topology_infra_types', JSON.stringify(DEFAULT_VISIBLE));
                    setSelectedTypes(DEFAULT_VISIBLE);
                    window.dispatchEvent(new Event('topology_settings_updated'));
                    return;
                }
                setSelectedTypes(parsed);
            } catch (e) {
                console.error('Failed to parse topology settings');
            }
        }
    }, []);

    const handleToggle = (id: string) => {
        setSelectedTypes(prev => 
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const handleSave = () => {
        setIsSaving(true);
        localStorage.setItem('irongrid_topology_infra_types', JSON.stringify(selectedTypes));
        setTimeout(() => {
            setIsSaving(false);
            window.dispatchEvent(new Event('topology_settings_updated'));
        }, 800);
    };

    return (
        <div className="space-y-gutter animate-in fade-in duration-700">
            <div className="flex flex-col gap-3 ml-2">
                <h3 className="font-display-lg text-3xl text-primary uppercase tracking-tighter italic flex items-center gap-4">
                    {t('TOPOLOGY_FILTER_PROTOCOL')}
                </h3>
                <p className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-[0.3em] italic">Define visibility thresholds for infrastructure mapping</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {DEVICE_TYPES.map((type) => (
                    <button
                        key={type.id}
                        onClick={() => handleToggle(type.id)}
                        className={`glass-panel p-6 border-white/5 text-left transition-all group relative overflow-hidden ${
                            selectedTypes.includes(type.id) 
                                ? 'bg-surface-container/40 border-primary/30' 
                                : 'hover:bg-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded border transition-colors ${
                                selectedTypes.includes(type.id) ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-surface-container border-white/5 text-on-surface-variant'
                            }`}>
                                <type.icon size={20} />
                            </div>
                            {selectedTypes.includes(type.id) && (
                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary-fixed),0.4)]">
                                    <Check size={14} className="text-black" strokeWidth={4} />
                                </div>
                            )}
                        </div>
                        <h4 className="font-label-caps text-xs text-on-surface uppercase tracking-widest italic group-hover:text-primary transition-colors">{type.label}</h4>
                        <p className="font-data-mono text-[9px] text-on-surface-variant uppercase mt-2 tracking-widest opacity-60">{type.desc}</p>
                        
                        {selectedTypes.includes(type.id) && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary/50" />
                        )}
                    </button>
                ))}
            </div>

            <div className="flex items-center justify-end pt-8 gap-6">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded flex items-center gap-4 group max-w-xl">
                    <Info className="w-5 h-5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                    <p className="font-label-caps text-[9px] text-on-surface-variant leading-relaxed uppercase tracking-widest italic">
                        PROTOCOL_NOTE: CHANGES WILL BE APPLIED IMMEDIATELY TO THE TOPOLOGY MAP VIEW UPON COMMIT. YOU HAVE FULL CONTROL OVER CORE INFRASTRUCTURE VISIBILITY.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="cyber-button px-10 h-16 !bg-primary text-on-primary-container border-primary shadow-[0_0_30px_rgba(var(--primary-fixed),0.2)] flex items-center gap-4"
                >
                    {isSaving ? (
                        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Save className="w-6 h-6" />
                    )}
                    {isSaving ? t('COMMITTING') : t('COMMIT_TOPOLOGY_SYNC')}
                </button>
            </div>
        </div>
    );
}

export function GrafanaExportManager() {
    const { t } = useLanguage();
    const { data: customMaps } = trpc.customMaps.getAll.useQuery();
    const { data: devices } = trpc.scan.getDevices.useQuery();
    const [grafanaOutput, setGrafanaOutput] = useState<any | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    const importMutation = trpc.grafana.importRaw.useMutation({
        onSuccess: (data) => {
            toast.success(data.message);
            setIsImporting(false);
        },
        onError: (error) => {
            toast.error(error.message);
            setIsImporting(false);
        }
    });

    const utils = trpc.useContext();

    // v1.0.4 - Refactor with useCallback for reference stability
    const generateGrafanaDashboard = useCallback(async (mapId?: string) => {
        setIsImporting(true);
        try {
            let targetDevices = devices || [];
            let title = "IronGrid Network Topology";

            if (mapId) {
                const mapData = await utils.customMaps.getById.fetch({ id: mapId });
                if (mapData) {
                    title = `IronGrid Map: ${mapData.name}`;
                    const mapDeviceIps = mapData.nodes
                        .filter(n => n.device?.ipAddress)
                        .map(n => n.device?.ipAddress);
                    
                    targetDevices = targetDevices.filter((d: any) => mapDeviceIps.includes(d.ip));
                }
            }

            if (targetDevices.length === 0 && mapId) {
                toast.warning("Este mapa não possui dispositivos vinculados ou monitorados.");
            }

            const dashboard = {
                title,
                tags: ["IronGrid", "Topology"],
                timezone: "browser",
                schemaVersion: 38,
                panels: [
                    {
                        title: "Infrastructure Health Matrix",
                        type: "canvas",
                        gridPos: { h: 20, w: 24, x: 0, y: 0 },
                        targets: targetDevices.map((d: any) => ({
                            refId: d.id,
                            datasource: { type: "influxdb", uid: "irongrid-influx" },
                            query: `from(bucket: "irongrid") |> range(start: -1m) |> filter(fn: (r) => r.device_ip == "${d.ip}") |> last()`
                        }))
                    }
                ]
            };

            setGrafanaOutput(dashboard);
            toast.success(`Manifesto gerado para: ${title}`);
        } catch (error: any) {
            toast.error("Erro ao gerar manifesto: " + error.message);
        } finally {
            setIsImporting(false);
        }
    }, [devices, utils]);

    const handleImport = useCallback(() => {
        if (!grafanaOutput) return;
        const currentToken = localStorage.getItem('grafana_token') || '';
        if (!currentToken) {
            toast.error("Security Token Missing! Configure it in Grafana Settings tab.");
            return;
        }
        setIsImporting(true);
        importMutation.mutate({ dashboard: grafanaOutput, grafanaToken: currentToken.trim() });
    }, [grafanaOutput, importMutation]);

    return (
        <div className="space-y-gutter animate-in fade-in duration-700">
            <div className="flex flex-col gap-3 ml-2">
                <h3 className="font-display-lg text-2xl text-secondary-fixed uppercase tracking-tighter italic flex items-center gap-4">
                    {t('GRAFANA_MATRIX_EXPORT')}
                </h3>
                <p className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-[0.3em] italic">Convert IronGrid Forensics to External Dashboards</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
                <div className="glass-panel p-8 border-white/5 bg-surface-container/95">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-secondary-fixed/10 rounded border border-secondary-fixed/20">
                            <Share2 className="w-5 h-5 text-secondary-fixed" />
                        </div>
                        <h4 className="font-label-caps text-sm text-on-surface uppercase tracking-widest italic">{t('CUSTOM_MAP_CONVERTER')}</h4>
                    </div>
                    
                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
                        {/* Global Topology Option */}
                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded border border-primary/20 hover:border-primary/40 transition-all mb-4">
                            <div>
                                <p className="font-display-lg text-xs uppercase text-primary italic">{t('GLOBAL_TOPOLOGY_MATRIX')}</p>
                                <p className="font-label-caps text-[9px] text-on-surface-variant uppercase mt-1 italic">All discovered nodes & core infra</p>
                            </div>
                            <button 
                                onClick={() => generateGrafanaDashboard()}
                                className="p-2 text-primary hover:bg-primary/10 rounded transition-all"
                            >
                                <Zap size={18} />
                            </button>
                        </div>

                        {customMaps?.map(map => (
                            <div key={map.id} className="flex items-center justify-between p-4 bg-white/5 rounded border border-white/5 hover:border-secondary-fixed/30 transition-all">
                                <div>
                                    <p className="font-data-mono text-xs uppercase text-on-surface">{map.name}</p>
                                    <p className="font-label-caps text-[9px] text-on-surface-variant uppercase mt-1 italic">Nodes: {(map as any)._count?.nodes || 0}</p>
                                </div>
                                <button 
                                    onClick={() => generateGrafanaDashboard(map.id)}
                                    className="p-2 text-secondary-fixed hover:bg-secondary-fixed/10 rounded transition-all"
                                >
                                    <FileJson size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-panel p-8 border-white/5 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded border border-primary/20">
                                <FileJson className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="font-label-caps text-[10px] text-primary uppercase tracking-widest">{t('DASHBOARD_JSON_MANIFEST')}</h3>
                        </div>
                        {grafanaOutput && (
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={handleImport}
                                    disabled={isImporting}
                                    className="cyber-button flex items-center gap-2 !bg-primary text-on-primary-container border-primary text-[10px] py-2 px-4"
                                >
                                    {isImporting ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                                    {isImporting ? t('IMPORTING') : t('GENERATE_IMPORT')}
                                </button>
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(JSON.stringify(grafanaOutput, null, 2));
                                        toast.success("JSON copied to clipboard!");
                                    }}
                                    className="flex items-center gap-2 p-2 px-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-[10px] font-label-caps uppercase transition-all"
                                >
                                    <Copy size={12} /> {t('COPY_JSON')}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 bg-black/40 rounded border border-white/5 p-6 font-data-mono text-[10px] text-on-surface-variant overflow-y-auto custom-scrollbar min-h-[300px]">
                        {grafanaOutput ? (
                            <pre className="whitespace-pre-wrap">{JSON.stringify(grafanaOutput, null, 2)}</pre>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-30 italic">
                                <Download size={32} className="mb-4" />
                                <p>{t('SELECT_MAP_HINT')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function TopologySettings() {
    const { t } = useLanguage();
    const [subTab, setSubTab] = useState<'visibility' | 'grafana'>('visibility');

    return (
        <div className="space-y-gutter pb-20">
            <div className="flex gap-8 border-b border-white/5 pb-4 mb-8">
                <button 
                    onClick={() => setSubTab('visibility')} 
                    className={`font-display-lg text-sm uppercase tracking-tight transition-all relative pb-4 italic ${subTab === 'visibility' ? 'text-primary font-black' : 'text-on-surface-variant/60 hover:text-on-surface'}`}
                >
                    {t('MAP_VISIBILITY_PROTOCOL')}
                    {subTab === 'visibility' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary-fixed),0.8)]" />}
                </button>
                <button 
                    onClick={() => setSubTab('grafana')} 
                    className={`font-display-lg text-sm uppercase tracking-tight transition-all relative pb-4 italic ${subTab === 'grafana' ? 'text-primary font-black' : 'text-on-surface-variant/60 hover:text-on-surface'}`}
                >
                    {t('GRAFANA_SYNC_ENGINE')}
                    {subTab === 'grafana' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary-fixed),0.8)]" />}
                </button>
            </div>

            {subTab === 'visibility' && <TopologyVisibilitySettings />}
            {subTab === 'grafana' && <GrafanaExportManager />}
        </div>
    );
}
