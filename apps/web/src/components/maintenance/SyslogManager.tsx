import { useState, useEffect } from 'react';
import { trpc } from '../../utils/trpc';
import { Terminal, Trash2, ShieldCheck, Settings, Save, Database, FolderOpen, Search, Loader2, Info } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * SyslogManager - Central de Governança de Fontes Syslog.
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
export function SyslogManager() {
    return (
        <div className="space-y-gutter animate-in fade-in duration-700 pt-4">
            <div className="glass-panel p-10 border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <Terminal size={180} className="text-primary" />
                </div>
                
                <div className="flex flex-col gap-3 mb-10 ml-2 relative z-10">
                    <h3 className="font-display-lg text-3xl text-primary uppercase tracking-tighter italic flex items-center gap-4">
                        <Terminal size={28} /> SYSLOG_SOURCE_MATRIX
                    </h3>
                    <p className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-[0.3em] italic">Dispositivo de Seleção & Governança de Ingestão de Eventos</p>
                </div>

                <div className="space-y-10 relative z-10">
                    <div className="p-6 bg-primary/5 border border-primary/10 rounded flex items-start gap-6 shadow-inner">
                        <Info size={20} className="text-primary shrink-0 mt-1" />
                        <p className="font-label-caps text-[11px] text-on-surface-variant leading-relaxed uppercase tracking-[0.15em]">
                            Identify devices for persistent event logging. If the list is <span className="text-primary font-black">NULL_STATE</span>, the ingestion engine will record events from <span className="text-on-surface italic">ANY_ACTIVE_SOURCE</span> within the network subnet.
                        </p>
                    </div>

                    <SyslogSourceList />

                    <div className="mt-12 pt-10 border-t border-white/5">
                        <ActiveMonitoringList />
                    </div>
                </div>
            </div>

            <SyslogSettings />
        </div>
    );
}

function ActiveMonitoringList() {
    const utils = trpc.useContext();
    const { data: monitored = [], isLoading } = (trpc as any).syslog.getMonitoredDevices.useQuery();

    const removeMutation = (trpc as any).syslog.removeMonitoredDevice.useMutation({
        onSuccess: () => {
            utils.syslog.getMonitoredDevices.invalidate();
            (utils as any).syslog.getStatus.invalidate();
        }
    });

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-20 opacity-40 italic">
            <Loader2 size={24} className="animate-spin mb-4" />
            <span className="font-label-caps text-[10px] uppercase tracking-widest">Synchronizing Active Nodes...</span>
        </div>
    );

    return (
        <div className="space-y-8">
            <h4 className="font-label-caps text-[11px] text-primary uppercase tracking-[0.3em] flex items-center gap-3 italic opacity-80">
                <ShieldCheck size={18} /> PERSISTENT_RECORDING_NODES
            </h4>

            {monitored.length === 0 ? (
                <div className="glass-panel p-12 border-white/5 border-dashed flex flex-col items-center justify-center text-center bg-surface-container/5">
                    <Terminal size={40} className="text-on-surface-variant/20 mb-6" />
                    <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.3em] font-black italic opacity-40">
                        OPEN_INGESTION_MODE: Record all incoming telemetry signals.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {monitored.map((device: any) => (
                        <div key={device.id} className="glass-panel p-4 border-white/5 flex items-center justify-between gap-4 group/item hover:border-primary/20 transition-all bg-surface-container/95">
                            <div className="flex-1 min-w-0">
                                <div className="font-display-lg text-[13px] text-on-surface uppercase tracking-tight truncate group-hover/item:text-primary transition-colors">{device.name}</div>
                                <div className="font-data-mono text-[9px] text-on-surface-variant/60 uppercase tracking-tighter truncate mt-1">{device.ipAddress}</div>
                            </div>
                            <button
                                onClick={() => removeMutation.mutate({ deviceId: device.id })}
                                className="p-2.5 bg-error/10 hover:bg-error text-error hover:text-on-error rounded border border-error/20 opacity-0 group-hover/item:opacity-100 transition-all shadow-lg"
                                title="Deactivate persistence"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-start gap-4 p-6 bg-white/5 border border-white/5 rounded italic opacity-50">
                <Info size={14} className="shrink-0 mt-0.5" />
                <p className="font-label-caps text-[9px] text-on-surface-variant leading-relaxed uppercase tracking-widest">
                    Operational Note: Deactivating persistence here preserves real-time stream visibility while suspending long-term SQL archival protocols for the specified node.
                </p>
            </div>
        </div>
    );
}

function SyslogSourceList() {
    const utils = trpc.useContext();
    const { data: devices = [], isLoading: loadingDevices } = (trpc as any).scan.getDevices.useQuery({});
    const { data: status, isLoading: loadingStatus } = (trpc as any).syslog.getStatus.useQuery();

    const setMonitoredMutation = (trpc as any).syslog.setMonitoredDevices.useMutation({
        onSuccess: () => {
            (utils as any).syslog.getStatus.invalidate();
            (utils as any).syslog.getMonitoredDevices.invalidate();
        }
    });

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (status?.monitoredDevices) {
            const monitoredSet = new Set(status.monitoredDevices);
            const ids = devices
                .filter((d: any) => monitoredSet.has(d.ip) || monitoredSet.has(d.hostname))
                .map((d: any) => d.id);
            setSelectedIds(ids);
        }
    }, [status, devices]);

    const handleToggle = (deviceId: string) => {
        setSelectedIds(prev => {
            if (prev.includes(deviceId)) {
                return prev.filter(id => id !== deviceId);
            } else {
                return [...prev, deviceId];
            }
        });
    };

    const handleSave = () => {
        setMonitoredMutation.mutate({ deviceIds: selectedIds });
    };

    const filteredDevices = devices.filter((d: any) =>
        (d.name && d.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.ip && d.ip.includes(searchTerm))
    );

    if (loadingDevices || loadingStatus) return (
        <div className="flex flex-col items-center justify-center py-20 opacity-40">
            <Loader2 size={32} className="animate-spin mb-4" />
            <span className="font-label-caps text-[11px] uppercase tracking-widest italic">Interrogating Node Inventory...</span>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6">
                <div className="relative flex-1 group/search">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40 group-focus-within/search:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="FILTER_BY_IDENTIFIER_OR_IPV4..."
                        className="w-full h-14 !bg-surface-container border-white/5 pl-12 font-data-mono text-xs uppercase focus:border-primary transition-all shadow-inner"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={handleSave}
                    disabled={setMonitoredMutation.isPending}
                    className="cyber-button h-14 px-10 !bg-primary text-on-primary-container border-primary flex items-center gap-3 shadow-2xl"
                >
                    {setMonitoredMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    COMMIT_SOURCE_FILTER
                </button>
            </div>

            <div className="glass-panel border-white/5 max-h-[400px] overflow-y-auto bg-surface-container/95 shadow-inner custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-surface-container/30 border-b border-white/5">
                            <th className="px-6 py-4 font-label-caps text-[9px] text-primary uppercase tracking-[0.3em] w-12 text-center">SYNC</th>
                            <th className="px-6 py-4 font-label-caps text-[9px] text-primary uppercase tracking-[0.3em]">NODE_IDENTIFIER</th>
                            <th className="px-6 py-4 font-label-caps text-[9px] text-primary uppercase tracking-[0.3em]">ENDPOINT_IPV4</th>
                            <th className="px-6 py-4 font-label-caps text-[9px] text-primary uppercase tracking-[0.3em] text-right">PROTOCOL_STATE</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredDevices.map((device: any) => {
                            const isSelected = selectedIds.includes(device.id);
                            return (
                                <tr 
                                    key={device.id} 
                                    onClick={() => handleToggle(device.id)}
                                    className={`cursor-pointer hover:bg-white/5 transition-all group ${isSelected ? 'bg-primary/5' : ''}`}
                                >
                                    <td className="px-6 py-4 text-center">
                                        <div className={`w-5 h-5 mx-auto rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]' : 'border-white/10 bg-surface-container'}`}>
                                            {isSelected && <div className="w-1.5 h-1.5 bg-on-primary rounded-full" />}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-display-lg text-[13px] text-on-surface uppercase tracking-tight group-hover:text-primary transition-colors">
                                        {device.name}
                                    </td>
                                    <td className="px-6 py-4 font-data-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
                                        {device.ip}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {isSelected ? (
                                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black uppercase rounded border border-primary/20 tracking-widest animate-pulse">
                                                ACTIVE_RECORDING
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-white/5 text-on-surface-variant/40 text-[8px] font-black uppercase rounded border border-white/5 tracking-widest">
                                                PASSIVE_STREAM
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            <div className="flex justify-between items-center px-2">
                <p className="font-label-caps text-[9px] text-on-surface-variant/40 uppercase tracking-[0.2em] italic">
                    Total Nodes Detected: {devices.length}
                </p>
                <div className="flex items-center gap-4">
                    <p className="font-label-caps text-[10px] text-primary uppercase tracking-[0.2em] font-black">
                        {selectedIds.length} NODES_COMMITTED_TO_INGESTION
                    </p>
                </div>
            </div>
        </div>
    );
}

function SyslogSettings() {
    const utils = trpc.useContext();
    const { data: config, isLoading: loadingConfig } = (trpc as any).system.getSystemCustomization.useQuery();
    const { data: dbInfo } = (trpc as any).syslog.getDbInfo.useQuery(undefined, {
        refetchInterval: 30000 
    });

    const updateMutation = (trpc as any).system.updateSystemCustomization.useMutation({
        onSuccess: () => {
            utils.system.getSystemCustomization.invalidate();
            (utils as any).syslog.getStatus.invalidate();
        }
    });

    const [formData, setFormData] = useState({
        syslogRecordingEnabled: true,
        companyName: '',
        workingHours: '',
        ticketAutoCloseDays: 15,
        ticketDefaultRating: 4,
        dashSlaGoal: 98,
        dashStorageCritical: 90,
        dashStorageWarning: 80
    });

    useEffect(() => {
        if (config) {
            setFormData({
                ...config,
            });
        }
    }, [config]);

    const handleSave = () => {
        updateMutation.mutate(formData);
    };

    if (loadingConfig) return null;

    return (
        <div className="glass-panel p-10 border-white/5 space-y-12 shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                <Settings size={180} className="text-amber-500" />
            </div>

            <div className="flex flex-col gap-3 ml-2 relative z-10">
                <h3 className="font-display-lg text-3xl text-amber-500 uppercase tracking-tighter italic flex items-center gap-4">
                    <Settings size={28} /> GLOBAL_RETENTION_PROTOCOLS
                </h3>
                <p className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-[0.3em] italic">Database Archival State & Operational Rotation Policy</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-gutter relative z-10">
                <div className="space-y-10">
                    <div className="flex items-center justify-between p-8 bg-surface-container/20 border border-white/5 rounded-2xl group/toggle hover:border-primary/20 transition-all shadow-inner">
                        <div className="space-y-2">
                            <p className="font-display-lg text-lg text-on-surface uppercase tracking-tight group-hover/toggle:text-primary transition-colors">PERSISTENT_SQL_ARCHIVAL</p>
                            <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.1em] opacity-60">Enable long-term event storage in PostgreSQL cluster</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, syslogRecordingEnabled: !formData.syslogRecordingEnabled })}
                            className={`w-16 h-8 rounded-full transition-all relative p-1 border border-white/10 ${formData.syslogRecordingEnabled ? 'bg-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]' : 'bg-surface-container-high'}`}
                        >
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-xl transition-all ${formData.syslogRecordingEnabled ? 'right-1 shadow-[0_0_10px_white]' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="glass-panel p-8 bg-white/5 border-white/5 flex items-center gap-6 group/stat hover:border-primary/30 transition-all">
                            <div className="p-4 bg-primary/10 rounded-xl text-primary group-hover/stat:bg-primary/20 transition-all shadow-inner">
                                <Database size={28} />
                            </div>
                            <div>
                                <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-[0.2em] mb-1">TOTAL_STORAGE_INDEX</p>
                                <p className="font-display-lg text-2xl font-black text-on-surface tracking-tighter group-hover/stat:text-primary transition-colors italic">{dbInfo?.size || 'CALCULATING...'}</p>
                            </div>
                        </div>

                        <div className="glass-panel p-8 bg-white/5 border-white/5 flex items-center gap-6 group/stat hover:border-amber-500/30 transition-all overflow-hidden">
                            <div className="p-4 bg-amber-500/10 rounded-xl text-amber-500 group-hover/stat:bg-amber-500/20 transition-all shadow-inner">
                                <FolderOpen size={28} />
                            </div>
                            <div className="min-w-0">
                                <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-[0.2em] mb-1">DATA_CLUST_DIRECTORY</p>
                                <p className="font-data-mono text-[10px] font-bold text-on-surface-variant truncate uppercase group-hover/stat:text-on-surface transition-colors" title={dbInfo?.dataDirectory}>
                                    {dbInfo?.dataDirectory || 'LOCAL_STORAGE_HUB'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-10 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex flex-col justify-center gap-6">
                    <div className="flex items-center gap-4 text-amber-500">
                        <Info size={24} />
                        <h4 className="font-display-lg text-xl uppercase tracking-tighter italic">RETENTION_ADVISORY_SYSTEM</h4>
                    </div>
                    <p className="font-label-caps text-[11px] text-on-surface-variant leading-relaxed uppercase tracking-[0.15em]">
                        The archival engine maintains a <span className="text-amber-500 font-black">HIGH_PERFORMANCE_INDEX</span>. Disabling SQL archival will suspend all incident data recording, although real-time forensic terminal monitoring remains active for immediate situational awareness.
                    </p>
                </div>
            </div>

            <div className="flex justify-end pt-10 border-t border-white/5 relative z-10">
                <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="cyber-button px-12 h-16 !bg-amber-500 text-black border-amber-600 flex items-center gap-4 shadow-[0_0_30px_rgba(var(--warning-fixed),0.2)] font-display-lg text-lg uppercase tracking-tighter italic"
                >
                    {updateMutation.isPending ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                    COMMIT_RETENTION_CHANGES
                </button>
            </div>
        </div>
    );
}
