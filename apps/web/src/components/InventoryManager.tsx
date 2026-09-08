import { useState } from 'react';
import { trpc } from '../utils/trpc';
import { Server, Loader2, Database, Search, Activity, Plus, FileText, ChevronUp, ChevronDown, Save, Check, Shield, Globe, Printer, Monitor, Network, Router, Laptop, DollarSign, Wrench, Phone, HardDrive, Camera, Radio, Cloud, Tag, Layers, MapPin, Building2, Zap, Target, Box } from 'lucide-react';
import { DeviceInventoryDetail } from './DeviceInventoryDetail';
import { AddDeviceModal } from './AddDeviceModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

/**
 * Componente InventoryManager - Gestão e Atribuição de Ativos
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
export function InventoryManager() {
    const { t, language } = useLanguage();
    const utils = (trpc as any).useContext();
    const { data: devicesData = [], isLoading } = (trpc as any).scan.getDevices.useQuery({});
    const devices = Array.isArray(devicesData) ? devicesData : (devicesData as any)?.devices ?? [];
    const { data: depts = [] } = (trpc as any).organization.listDepartments.useQuery();
    const { data: locations = [] } = (trpc as any).organization.listLocations.useQuery();

    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [search, setSearch] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [pendingChanges, setPendingChanges] = useState<Record<string, { departmentId?: string; locationId?: string; type?: string }>>({});
    const currencyCode = language.toUpperCase() === 'PT-BR' ? 'BRL' : (language.toUpperCase() === 'ES' ? 'EUR' : 'USD');
    const currencyLocale = language.toUpperCase() === 'PT-BR' ? 'pt-BR' : (language.toUpperCase() === 'ES' ? 'es-ES' : 'en-US');

    const assignDevice = (trpc as any).organization.assignDevice.useMutation({
        onSuccess: () => (utils.scan.getDevices as any).invalidate()
    });

    const toggleMonitoring = (trpc as any).snmp.toggleMonitoring.useMutation({
        onSuccess: () => (utils.scan.getDevices as any).invalidate()
    });

    const filtered = devices.filter((d: any) =>
        d.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.ip?.toLowerCase().includes(search.toLowerCase())
    ).sort((a: any, b: any) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;
        let aValue = a[key];
        let bValue = b[key];
        if (key === 'location') aValue = a.location?.name;
        if (key === 'location') bValue = b.location?.name;
        if (key === 'department') aValue = a.departmentRef?.name;
        if (key === 'department') bValue = b.departmentRef?.name;
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleAssignmentChange = (deviceId: string, data: any) => {
        const device = devices.find((d: any) => d.id === deviceId);
        if (!device) return;
        const original = { departmentId: device.departmentId || '', locationId: device.locationId || '', type: device.type || '' };
        const current = { ...(pendingChanges[deviceId] || original), ...data };
        const isOriginal = current.departmentId === original.departmentId && current.locationId === original.locationId && current.type === original.type;
        setPendingChanges(prev => {
            const next = { ...prev };
            if (isOriginal) delete next[deviceId];
            else next[deviceId] = current;
            return next;
        });
    };

    const handleBatchSave = async () => {
        const updates = Object.entries(pendingChanges);
        for (const [deviceId, data] of updates) {
            await assignDevice.mutateAsync({ deviceId, ...data });
        }
        setPendingChanges({});
        await (utils.scan.getDevices as any).invalidate();
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortConfig?.key !== column) return <ChevronUp size={12} className="opacity-20" />;
        return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-primary" /> : <ChevronDown size={12} className="text-primary" />;
    };

    return (
        <div className="space-y-gutter animate-in fade-in duration-700 pt-6">
            {/* Mission Control Stats Bar */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-12 mb-12 ml-2">
                <div className="space-y-4">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-center relative shadow-[0_0_40px_rgba(var(--primary-fixed),0.1)]">
                            <Box size={32} className="text-primary" />
                        </div>
                        <div>
                            <h1 className="font-display-lg text-5xl text-on-surface uppercase tracking-tighter italic leading-none">{t('ASSET_INVENTORY')}</h1>
                            <div className="flex items-center gap-4 mt-2">
                                <span className="font-label-caps text-[10px] text-on-surface-variant/40 uppercase tracking-[0.4em] italic font-black">{t('STRATEGIC_RESOURCE_HUB')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4">
                    <div className="glass-panel p-4 flex items-center gap-6 border-white/5 bg-surface-container/95 backdrop-blur-none px-8">
                        <div>
                            <p className="font-label-caps text-[9px] text-on-surface-variant/40 uppercase tracking-widest font-black italic mb-1">{t('GLOBAL_EQUITY')}</p>
                            <p className="font-data-mono text-2xl text-primary font-black italic leading-none">
                                {devices.reduce((acc: number, d: any) => acc + (d.purchaseValue || 0), 0).toLocaleString(currencyLocale, { style: 'currency', currency: currencyCode })}
                            </p>
                        </div>
                        <div className="w-px h-10 bg-white/5" />
                        <div>
                            <p className="font-label-caps text-[9px] text-on-surface-variant/40 uppercase tracking-widest font-black italic mb-1">{t('MAINTENANCE_LOG')}</p>
                            <p className="font-data-mono text-2xl text-error font-black italic leading-none">
                                {devices.reduce((acc: number, d: any) => acc + (d.maintenanceRecords?.reduce((sum: number, r: any) => sum + (r.cost || 0), 0) || 0), 0).toLocaleString(currencyLocale, { style: 'currency', currency: currencyCode })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4 flex-1 max-w-2xl">
                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40 transition-colors group-focus-within:text-primary" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={t('QUERY_ASSET_PLACEHOLDER')}
                            className="w-full h-14 pl-12 bg-surface-container-highest/20 border-white/5 focus:border-primary/50 text-xs font-data-mono tracking-widest uppercase italic rounded-2xl backdrop-blur-3xl"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <AnimatePresence>
                        {Object.keys(pendingChanges).length > 0 && (
                            <motion.button 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={handleBatchSave} 
                                className="h-14 px-8 bg-primary text-black font-display-lg text-[12px] uppercase tracking-tighter italic rounded-2xl flex items-center gap-3 hover:brightness-110 shadow-[0_0_30px_rgba(var(--primary-fixed),0.3)] transition-all font-black"
                            >
                                <Save size={18} /> {t('COMMIT_CHANGES')} [{Object.keys(pendingChanges).length}]
                            </motion.button>
                        )}
                    </AnimatePresence>
                    <button onClick={() => setShowAddModal(true)} className="h-14 px-8 bg-surface-container-highest/40 border border-white/10 text-on-surface font-display-lg text-[12px] uppercase tracking-tighter italic rounded-2xl flex items-center gap-3 hover:bg-surface-container-highest transition-all">
                        <Plus size={18} className="text-primary" /> {t('REGISTER_NEW_ASSET')}
                    </button>
                </div>
            </div>

            {/* Forensic Data Table */}
            <div className="glass-panel border-white/5 bg-surface-container/95 backdrop-blur-none rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left font-data-mono text-[11px]">
                        <thead>
                            <tr className="bg-surface-container-highest/40 text-on-surface-variant/40 uppercase tracking-[0.2em] italic font-black border-b border-white/5">
                                <th className="px-8 py-6 font-black text-center">{t('TACTICAL_OPS')}</th>
                                <th className="px-8 py-6 font-black cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-3">{t('DEVICE_ID')} <SortIcon column="name" /></div>
                                </th>
                                <th className="px-8 py-6 font-black cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('location')}>
                                    <div className="flex items-center gap-3"><MapPin size={14} className="opacity-40" /> {t('DEPLOYMENT_SITE')} <SortIcon column="location" /></div>
                                </th>
                                <th className="px-8 py-6 font-black cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('department')}>
                                    <div className="flex items-center gap-3"><Building2 size={14} className="opacity-40" /> {t('OP_UNIT')} <SortIcon column="department" /></div>
                                </th>
                                <th className="px-8 py-6 font-black"><div className="flex items-center gap-3"><Tag size={14} className="opacity-40" /> {t('CLASSIFICATION')}</div></th>
                                <th className="px-8 py-6 font-black"><div className="flex items-center gap-3"><DollarSign size={14} className="opacity-40" /> {t('FINANCIALS')}</div></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 size={32} className="text-primary animate-spin opacity-40" />
                                            <p className="font-label-caps text-[12px] text-on-surface-variant/40 uppercase tracking-[0.5em] italic font-black animate-pulse">{t('SYNCHRONIZING_ASSET_LEDGER')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-24 text-center">
                                        <p className="font-label-caps text-[12px] text-on-surface-variant/20 uppercase tracking-[0.5em] italic font-black">{t('NO_ASSETS_LOCATED')}</p>
                                    </td>
                                </tr>
                            ) : filtered.map((device: any, idx: number) => (
                                <DeviceRow
                                    key={device.id}
                                    idx={idx}
                                    device={device}
                                    depts={depts}
                                    locations={locations}
                                    isSaving={assignDevice.isPending && assignDevice.variables?.deviceId === device.id}
                                    pendingAssignments={pendingChanges[device.id]}
                                    onViewDetail={() => setSelectedDeviceId(device.id)}
                                    onFieldChange={(data: any) => handleAssignmentChange(device.id, data)}
                                    onSaveRow={() => {
                                        const data = pendingChanges[device.id];
                                        if (data) {
                                            assignDevice.mutate({ deviceId: device.id, ...data }, {
                                                onSuccess: () => {
                                                    setPendingChanges(prev => {
                                                        const next = { ...prev };
                                                        delete next[device.id];
                                                        return next;
                                                    });
                                                }
                                            });
                                        }
                                    }}
                                    onToggleMonitoring={(enabled: boolean) => toggleMonitoring.mutate({ ip: device.ip, enabled })}
                                    isMonitoringPending={toggleMonitoring.isPending && toggleMonitoring.variables?.ip === device.ip}
                                    currencyLocale={currencyLocale}
                                    currencyCode={currencyCode}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedDeviceId && (
                <DeviceInventoryDetail
                    deviceId={selectedDeviceId}
                    onClose={() => setSelectedDeviceId(null)}
                />
            )}

            {showAddModal && (
                <AddDeviceModal onClose={() => setShowAddModal(false)} />
            )}
        </div>
    );
}

/**
 * Linha de Dispositivo - Modernizada para a estética Cyber-Dark.
 */
function DeviceRow({ idx, device, depts, locations, onFieldChange, onSaveRow, onViewDetail, onToggleMonitoring, isSaving, isMonitoringPending, pendingAssignments, currencyLocale, currencyCode }: any) {
    const { t, language } = useLanguage();
    const generatePDF = (trpc as any).reports.generateInventoryPDF.useMutation();
    const isMonitored = !!device.isMonitored;
    const assignments = pendingAssignments || {
        departmentId: device.departmentId || '',
        locationId: device.locationId || '',
        type: device.type || ''
    };

    const hasChanged = !!pendingAssignments;

    const getDeviceIcon = (type: string) => {
        const props = { size: 20, className: "text-primary" };
        switch (type?.toUpperCase()) {
            case 'SERVER': return <Server {...props} />;
            case 'SWITCH': return <Network {...props} />;
            case 'ROUTER': return <Router {...props} className="text-secondary-fixed" />;
            case 'FIREWALL': return <Shield {...props} className="text-error" />;
            case 'GATEWAY': return <Globe {...props} className="text-primary-fixed" />;
            case 'INTERNET': return <Cloud {...props} />;
            case 'DATABASE': return <Database {...props} />;
            case 'VOIP': return <Phone {...props} />;
            case 'NAS': return <HardDrive {...props} className="text-on-surface-variant" />;
            case 'CAMERA': return <Camera {...props} className="text-error" />;
            case 'ACCESS_POINT': return <Radio {...props} />;
            case 'PRINTER': return <Printer {...props} className="text-on-surface-variant" />;
            case 'WORKSTATION': return <Monitor {...props} />;
            default: return <Laptop {...props} className="text-on-surface-variant" />;
        }
    };

    return (
        <motion.tr 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="transition-all hover:bg-white/[0.03] border-b border-white/5 group relative"
        >
            <td className="px-8 py-5">
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => onToggleMonitoring(!isMonitored)}
                        disabled={isMonitoringPending}
                        className={`w-10 h-10 rounded-xl border transition-all flex items-center justify-center relative overflow-hidden ${
                            isMonitored ? 
                            'bg-primary/20 border-primary/40 text-primary shadow-[0_0_20px_rgba(var(--primary-fixed),0.2)]' : 
                            'bg-surface-container-highest/20 border-white/5 text-on-surface-variant/40 hover:border-primary/40 hover:text-primary'
                        }`}
                        title={isMonitored ? t('DISABLE_ACTIVE_TELEMETRY') : t('ACTIVATE_TELEMETRY_STREAM')}
                    >
                        {isMonitoringPending ? <Loader2 size={16} className="animate-spin" /> : <Activity size={18} className={isMonitored ? 'animate-pulse' : ''} />}
                    </button>

                    <button
                        onClick={onViewDetail}
                        className="w-10 h-10 rounded-xl bg-surface-container-highest/20 border border-white/5 text-on-surface-variant/40 hover:text-primary hover:border-primary/40 hover:bg-primary/10 transition-all flex items-center justify-center"
                        title={t('ACCESS_FORENSIC_DATA')}
                    >
                        <Target size={18} />
                    </button>

                    {hasChanged && !isSaving && (
                        <button
                            onClick={onSaveRow}
                            className="w-10 h-10 rounded-xl bg-primary text-black hover:brightness-110 transition-all flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary-fixed),0.3)]"
                        >
                            <Save size={18} />
                        </button>
                    )}
                    
                    <button
                        onClick={async () => {
                            try {
                                const result = await generatePDF.mutateAsync({
                                    type: 'hardware',
                                    filters: { deviceId: device.id }
                                });
                                if (result.base64) {
                                    const link = document.createElement('a');
                                    link.href = `data:application/pdf;base64,${result.base64}`;
                                    link.download = `inventario_${device.name || device.hostname || 'ativo'}.pdf`;
                                    link.click();
                                }
                            } catch (err) {
                                console.error('Erro ao gerar PDF:', err);
                            }
                        }}
                        disabled={generatePDF.isPending}
                        className="w-10 h-10 rounded-xl bg-surface-container-highest/20 border border-white/5 text-on-surface-variant/40 hover:text-primary hover:border-primary/40 hover:bg-primary/10 transition-all flex items-center justify-center"
                        title={t('EXPORT_TACTICAL_REPORT')}
                    >
                        <FileText size={18} />
                    </button>
                </div>
            </td>
            <td className="px-8 py-5">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-surface-container-highest/40 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-all shadow-inner relative overflow-hidden">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {getDeviceIcon(assignments.type)}
                    </div>
                    <div>
                        <div className="font-display-lg text-lg text-on-surface uppercase tracking-tight italic leading-tight group-hover:text-primary transition-colors">{device.name || device.hostname}</div>
                        <div className="font-data-mono text-[10px] text-primary/60 uppercase tracking-[0.2em] font-black italic mt-1">{device.ip}</div>
                    </div>
                </div>
            </td>
            <td className="px-8 py-5">
                <div className="relative">
                    <select
                        value={assignments.locationId}
                        onChange={(e) => onFieldChange({ locationId: e.target.value })}
                        className={`w-full h-12 bg-surface-container-highest/20 border-white/5 rounded-xl text-[10px] font-data-mono uppercase tracking-widest italic font-black transition-all appearance-none px-4 ${hasChanged ? 'border-primary/50 text-primary shadow-[0_0_15px_rgba(var(--primary-fixed),0.1)]' : 'text-on-surface-variant/60 hover:border-white/10'}`}
                    >
                        <option value="">{t('UNCATEGORIZED_SECTOR')}</option>
                        {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                        <ChevronDown size={14} />
                    </div>
                </div>
            </td>
            <td className="px-8 py-5">
                <div className="relative">
                    <select
                        value={assignments.departmentId}
                        onChange={(e) => onFieldChange({ departmentId: e.target.value })}
                        className={`w-full h-12 bg-surface-container-highest/20 border-white/5 rounded-xl text-[10px] font-data-mono uppercase tracking-widest italic font-black transition-all appearance-none px-4 ${hasChanged ? 'border-primary/50 text-primary shadow-[0_0_15px_rgba(var(--primary-fixed),0.1)]' : 'text-on-surface-variant/60 hover:border-white/10'}`}
                    >
                        <option value="">{t('NON_ASSIGNED_UNIT')}</option>
                        {depts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                        <ChevronDown size={14} />
                    </div>
                </div>
            </td>
            <td className="px-8 py-5">
                <div className="relative">
                    <select
                        value={assignments.type}
                        onChange={(e) => onFieldChange({ type: e.target.value })}
                        className={`w-full h-12 bg-surface-container-highest/20 border-white/5 rounded-xl text-[10px] font-data-mono uppercase tracking-widest italic font-black transition-all appearance-none px-4 ${hasChanged ? 'border-primary/50 text-primary shadow-[0_0_15px_rgba(var(--primary-fixed),0.1)]' : 'text-on-surface-variant/60 hover:border-white/10'}`}
                    >
                        <option value="">{t('CLASSIFY_ASSET')}</option>
                        <option value="SERVER">{t('SERVER_NODE')}</option>
                        <option value="SWITCH">{t('SWITCH_FABRIC')}</option>
                        <option value="ROUTER">{t('ROUTING_GATEWAY')}</option>
                        <option value="FIREWALL">{t('SECURITY_PERIMETER')}</option>
                        <option value="INTERNET">{t('CLOUD_INFRA')}</option>
                        <option value="DATABASE">{t('DATA_REPOSITORY')}</option>
                        <option value="VOIP">{t('VOICE_OVER_IP')}</option>
                        <option value="NAS">{t('NETWORK_STORAGE')}</option>
                        <option value="CAMERA">{t('VISUAL_SENSOR')}</option>
                        <option value="ACCESS_POINT">{t('WIRELESS_HUB')}</option>
                        <option value="PRINTER">{t('PERIPHERAL_OUTPUT')}</option>
                        <option value="WORKSTATION">{t('OPERATOR_STATION')}</option>
                        <option value="OTHER">{t('OTHER_RESOURCES')}</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                        <ChevronDown size={14} />
                    </div>
                </div>
            </td>
            <td className="px-8 py-5">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary-fixed shadow-[0_0_10px_rgba(var(--secondary-fixed),0.5)]" />
                        <span className="font-data-mono text-[11px] text-on-surface font-black italic">
                            {device.purchaseValue ? device.purchaseValue.toLocaleString(currencyLocale, { style: 'currency', currency: currencyCode }) : (language.toUpperCase() === 'PT-BR' ? 'R$ 0,00' : (language.toUpperCase() === 'ES' ? '0,00 €' : '$0.00'))}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                        <div className="w-1.5 h-1.5 rounded-full bg-error" />
                        <span className="font-data-mono text-[10px] text-on-surface-variant italic font-black">
                            {device.maintenanceRecords?.reduce((acc: number, r: any) => acc + (r.cost || 0), 0).toLocaleString(currencyLocale, { style: 'currency', currency: currencyCode }) || (language.toUpperCase() === 'PT-BR' ? 'R$ 0,00' : (language.toUpperCase() === 'ES' ? '0,00 €' : '$0.00'))}
                        </span>
                    </div>
                </div>
            </td>
        </motion.tr>
    );
}
