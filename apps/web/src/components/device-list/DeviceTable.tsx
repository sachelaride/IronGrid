import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
    ChevronUp,
    ChevronDown,
    Activity,
    MonitorSmartphone,
    Trash2,
    Database,
    Loader2,
    Camera,
    RotateCcw,
    Copy,
    Phone,
    Server, Laptop, Printer, Wifi, Shield, Globe, HardDrive, Radio, Zap, Settings, BarChart3, Edit2
} from 'lucide-react';
import { NetAccessModal } from './NetAccessModal';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

const TypeIcon = ({ type, className = "" }: { type: string, className?: string }) => {
    const iconClass = `h-4 w-4 ${className}`;
    switch (type?.toLowerCase()) {
        case 'server': return <Server className={iconClass} />;
        case 'workstation':
        case 'pc':
        case 'computer': return <Laptop className={iconClass} />;
        case 'printer': return <Printer className={iconClass} />;
        case 'switch': return <Wifi className={iconClass} />;
        case 'firewall': return <Shield className={iconClass} />;
        case 'router': return <Globe className={iconClass} />;
        case 'database': return <Database className={iconClass} />;
        case 'voip': return <Phone className={iconClass} />;
        case 'nas': return <HardDrive className={iconClass} />;
        case 'camera': return <Camera className={iconClass} />;
        case 'access_point': return <Radio className={iconClass} />;
        default: return <Server className={iconClass} />;
    }
};

interface DeviceTableProps {
    devices: any[];
    selectedIds: string[];
    visibleColumns: string[];
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    toggleSelect: (id: string) => void;
    handleSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
    toggleSort: (field: string) => void;
    toggleMonitoring: any;
    setManagingDevice: (device: any) => void;
    setMetricsDevice: (device: any) => void;
    setEditingDevice: (device: any) => void;
    handleDelete: (device: any) => void;
    setLevelMutation: any;
    onOpenInventory?: (id: string) => void;
}

/**
 * DeviceTable - High-Density Forensic Asset Grid.
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
export function DeviceTable({
    devices,
    selectedIds,
    visibleColumns,
    sortBy,
    sortOrder,
    toggleSelect,
    handleSelectAll,
    toggleSort,
    toggleMonitoring,
    setManagingDevice,
    setMetricsDevice,
    setEditingDevice,
    handleDelete,
    setLevelMutation,
    onOpenInventory,
}: DeviceTableProps) {
    const { t } = useLanguage();

    const [netAccessDevice, setNetAccessDevice] = useState<any>(null);
    const [netAccessRect, setNetAccessRect] = useState<DOMRect | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    const NETWORK_TYPES = ['switch', 'firewall', 'router', 'access_point'];

    const SortIcon = ({ field }: { field: string }) => {
        if (sortBy !== field) return <ChevronUp className="h-3 w-3 opacity-20 group-hover:opacity-100 transition-opacity" />;
        return (
            <motion.div 
                initial={{ rotate: sortOrder === 'asc' ? 0 : 180 }}
                animate={{ rotate: sortOrder === 'asc' ? 0 : 180 }}
                className="text-primary"
            >
                <ChevronUp className="h-3.5 w-3.5" />
            </motion.div>
        );
    };

    const getMissingFields = (device: any) => {
        const missing: string[] = [];
        if (!device.name) missing.push(t('NAME'));
        if (!device.department) missing.push(t('UNIT'));
        if (!device.type || device.type.toLowerCase() === 'other') missing.push(t('TYPE'));
        if (device.parentId && !device.parentPort) missing.push(t('SWITCH_PORT'));
        if (!device.snmpCommunityId && !device.isMonitored) missing.push(t('SNMP_COMMUNITY'));
        return missing;
    };

    const isDeviceComplete = (device: any) => getMissingFields(device).length === 0;

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        const update = () => setIsMobile(mediaQuery.matches);
        update();
        mediaQuery.addEventListener?.('change', update);
        return () => mediaQuery.removeEventListener?.('change', update);
    }, []);

    const tableContainerRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: devices.length,
        getScrollElement: () => tableContainerRef.current,
        estimateSize: () => 70, // Average row height
        overscan: 10,
    });

    if (isMobile) {
        return (
            <div className="relative">
                <div className="glass-panel overflow-hidden border-white/5 bg-surface-container/95 backdrop-blur-none shadow-2xl p-3 sm:p-4">
                    <div className="space-y-3">
                        {devices.map((device) => (
                            <div key={device.id} className="rounded-2xl border border-white/5 bg-surface-container-high/50 p-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${device.status === 'online' ? 'bg-primary' : 'bg-error'}`} />
                                            <span className="font-display-lg text-[12px] uppercase italic text-primary truncate">
                                                {device.name || device.ip}
                                            </span>
                                        </div>
                                        <p className="font-data-mono text-[10px] text-on-surface-variant/70 uppercase mt-1 truncate">
                                            {device.ip} • {device.type || t('UNKNOWN')}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            onClick={() => onOpenInventory?.(device.id)}
                                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container-highest/40 text-on-surface-variant"
                                        >
                                            <Database size={14} />
                                        </button>
                                        <button
                                            onClick={() => setEditingDevice(device)}
                                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container-highest/40 text-on-surface-variant"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${device.status === 'online' ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
                                        {device.status === 'online' ? t('DL_NODE_ACTIVE') : t('DL_NODE_OFFLINE')}
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${device.isMonitored ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-400/20' : 'bg-rose-500/10 text-rose-400 border border-rose-400/20'}`}>
                                        {device.isMonitored ? 'SNMP ATIVO' : 'SNMP INATIVO'}
                                    </span>
                                    {device.department && (
                                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/5 text-on-surface-variant">
                                            {device.department}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-on-surface-variant/80">
                                    <span>{device.hostname || t('DL_UNSPECIFIED')}</span>
                                    <span>{device.monitoringLevel ? `L${device.monitoringLevel}` : 'OFF'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            <div className="glass-panel overflow-hidden border-white/5 bg-surface-container/95 backdrop-blur-none shadow-2xl">
                <div ref={tableContainerRef} className="overflow-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 320px)' }}>
                    <table className="w-full text-left border-collapse relative">
                        <thead className="sticky top-0 z-10 bg-surface-container-high/90 backdrop-blur-md shadow-md border-b border-white/5">
                            <tr>
                                <th className="px-6 py-6 w-16 text-center">
                                    <div className="flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === devices.length && devices.length > 0}
                                            onChange={handleSelectAll}
                                            className="w-5 h-5 rounded-lg border-white/10 bg-surface-container text-primary focus:ring-primary ring-offset-0"
                                        />
                                    </div>
                                </th>
                                
                                {visibleColumns.includes('graphs') && (
                                    <th className="px-4 py-6 w-16 text-center">
                                        <div className="flex items-center justify-center">
                                            <Zap size={14} className="text-primary opacity-50" />
                                        </div>
                                    </th>
                                )}

                                {visibleColumns.includes('ipamStatus') && (
                                    <th className="px-4 py-6 w-16 text-center">
                                        <span className="font-display-lg text-[10px] text-on-surface-variant uppercase tracking-[0.2em] italic opacity-60">SRV</span>
                                    </th>
                                )}

                                {visibleColumns.includes('name') && (
                                    <th onClick={() => toggleSort('name')} className="px-6 py-6 cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <span className="font-display-lg text-[10px] text-on-surface-variant group-hover:text-primary uppercase tracking-[0.2em] italic transition-colors">{t('DL_NODE_IDENTITY')}</span>
                                            <SortIcon field="name" />
                                        </div>
                                    </th>
                                )}

                                {visibleColumns.includes('ip') && (
                                    <th onClick={() => toggleSort('ip')} className="px-6 py-6 cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <span className="font-display-lg text-[10px] text-on-surface-variant group-hover:text-primary uppercase tracking-[0.2em] italic transition-colors">{t('DL_IP_VECTOR')}</span>
                                            <SortIcon field="ip" />
                                        </div>
                                    </th>
                                )}

                                {visibleColumns.includes('hostname') && (
                                    <th onClick={() => toggleSort('hostname')} className="px-6 py-6 cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <span className="font-display-lg text-[10px] text-on-surface-variant group-hover:text-primary uppercase tracking-[0.2em] italic transition-colors">{t('DL_DOMAIN_ALIAS')}</span>
                                            <SortIcon field="hostname" />
                                        </div>
                                    </th>
                                )}

                                {visibleColumns.includes('assetNumber') && (
                                    <th onClick={() => toggleSort('assetNumber')} className="px-6 py-6 cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <span className="font-display-lg text-[10px] text-on-surface-variant group-hover:text-primary uppercase tracking-[0.2em] italic transition-colors">{t('ASSET_NUMBER')}</span>
                                            <SortIcon field="assetNumber" />
                                        </div>
                                    </th>
                                )}

                                {visibleColumns.includes('macAddress') && (
                                    <th onClick={() => toggleSort('macAddress')} className="px-6 py-6 cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <span className="font-display-lg text-[10px] text-on-surface-variant group-hover:text-primary uppercase tracking-[0.2em] italic transition-colors">{t('DL_PHYSICAL_MAC')}</span>
                                            <SortIcon field="macAddress" />
                                        </div>
                                    </th>
                                )}

                                {visibleColumns.includes('type') && (
                                    <th onClick={() => toggleSort('tipo')} className="px-6 py-6 cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <span className="font-display-lg text-[10px] text-on-surface-variant group-hover:text-primary uppercase tracking-[0.2em] italic transition-colors">{t('DL_CORE_PROTOCOL')}</span>
                                            <SortIcon field="tipo" />
                                        </div>
                                    </th>
                                )}

                                {visibleColumns.includes('department') && (
                                    <th onClick={() => toggleSort('departamento')} className="px-6 py-6 cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <span className="font-display-lg text-[10px] text-on-surface-variant group-hover:text-primary uppercase tracking-[0.2em] italic transition-colors">{t('UNIT')}</span>
                                            <SortIcon field="departamento" />
                                        </div>
                                    </th>
                                )}

                                {visibleColumns.includes('location') && (
                                    <th onClick={() => toggleSort('location')} className="px-6 py-6 cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <span className="font-display-lg text-[10px] text-on-surface-variant group-hover:text-primary uppercase tracking-[0.2em] italic transition-colors">{t('DL_SITE_GEO')}</span>
                                            <SortIcon field="location" />
                                        </div>
                                    </th>
                                )}

                                <th className="px-6 py-6 text-right">
                                    <span className="font-display-lg text-[10px] text-on-surface-variant uppercase tracking-[0.2em] italic opacity-60">{t('DL_COMMANDS')}</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {rowVirtualizer.getVirtualItems().length > 0 && (
                                <tr style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px` }}></tr>
                            )}
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                const device = devices[virtualRow.index];
                                return (
                                    <tr
                                        key={device.id}
                                        ref={rowVirtualizer.measureElement}
                                        data-index={virtualRow.index}
                                        className={`group transition-all hover:bg-white/[0.03] ${selectedIds.includes(device.id) ? 'bg-primary/5' : ''}`}
                                    >
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(device.id)}
                                                    onChange={() => toggleSelect(device.id)}
                                                    className="w-5 h-5 rounded-lg border-white/10 bg-surface-container-highest text-primary focus:ring-primary ring-offset-0"
                                                />
                                            </div>
                                        </td>

                                        {visibleColumns.includes('graphs') && (
                                            <td className="px-4 py-5 text-center">
                                                <button
                                                    onClick={() => toggleMonitoring.mutate({ ip: device.ip, enabled: !device.isMonitored })}
                                                    disabled={toggleMonitoring.isPending && toggleMonitoring.variables?.ip === device.ip}
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group/mon relative mx-auto ${device.isMonitored
                                                        ? 'bg-secondary-fixed/10 border border-secondary-fixed/30 shadow-[0_0_15px_rgba(var(--secondary-fixed),0.1)]'
                                                        : 'bg-error/10 border border-error/30 opacity-40'}`}
                                                >
                                                    {toggleMonitoring.isPending && toggleMonitoring.variables?.ip === device.ip
                                                        ? <Loader2 size={16} className="animate-spin text-secondary-fixed" />
                                                        : <Activity size={16} className={device.isMonitored ? 'text-secondary-fixed' : 'text-error'} />
                                                    }
                                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black border border-white/10 text-[9px] font-data-mono px-3 py-1.5 rounded opacity-0 group-hover/mon:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap uppercase tracking-widest italic">
                                                        {device.isMonitored ? t('DL_TELEMETRY_ONLINE') : t('DL_TELEMETRY_DISABLED')}
                                                    </div>
                                                </button>
                                            </td>
                                        )}

                                        {visibleColumns.includes('ipamStatus') && (
                                            <td className="px-4 py-5 text-center">
                                                {device.ipamStatus === 'USED' && (
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-error/10 border border-error/20 text-error font-data-mono text-[11px] font-black mx-auto shadow-lg shadow-error/10">OCC</div>
                                                )}
                                                {device.ipamStatus === 'RESERVED' && (
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20 text-primary font-data-mono text-[11px] font-black mx-auto shadow-lg shadow-primary/10">RES</div>
                                                )}
                                                {device.ipamStatus === 'AVAILABLE' && (
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-container-highest/50 border border-white/5 text-on-surface-variant/40 font-data-mono text-[11px] font-black mx-auto">LIV</div>
                                                )}
                                            </td>
                                        )}

                                        {visibleColumns.includes('name') && (
                                            <td className="px-6 py-5 min-w-[220px] max-w-[28rem]">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className={`w-3 h-3 rounded-full shrink-0 ${device.status === 'online' ? 'bg-primary status-glow-primary' : 'bg-error status-glow-error'}`} />
                                                    
                                                    <div className="flex flex-col min-w-0 gap-3">
                                                        <div className="flex items-center gap-2 mb-1 min-w-0">
                                                            <span className={`font-display-lg text-[13px] tracking-tight uppercase italic truncate min-w-0 ${isDeviceComplete(device) ? 'text-primary' : 'text-on-surface group-hover:text-primary transition-colors'}`}>
                                                                {device.name || device.ip}
                                                            </span>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                {device.hasWebcam && <Camera size={12} className="text-primary/60" />}
                                                                {device.agentId && !NETWORK_TYPES.includes(device.type?.toLowerCase()) && (
                                                                    <MonitorSmartphone size={12} className="text-primary animate-pulse" />
                                                                )}
                                                                {device.voipExtension && (
                                                                    <span className="px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded text-[9px] text-primary font-black uppercase whitespace-nowrap">EXT_{device.voipExtension}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 items-center">
                                                            <span className={`font-label-caps text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded border whitespace-nowrap ${device.status === 'online' ? 'text-primary border-primary/20' : 'text-error border-error/20'}`}>
                                                                {device.status === 'online' ? t('DL_NODE_ACTIVE') : t('DL_NODE_OFFLINE')}
                                                            </span>
                                                            <span className={`font-label-caps text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded border whitespace-nowrap ${device.isMonitored ? 'text-emerald-400 border-emerald-400/20 bg-emerald-500/5' : 'text-rose-400 border-rose-400/20 bg-rose-500/5'}`}>
                                                                {device.isMonitored ? 'SNMP ATIVO' : 'SNMP INATIVO'}
                                                            </span>
                                                        </div>
                                                        {(device.status === 'offline' && device.offlineSince) || device.lastBoot ? (
                                                            <div className="flex flex-wrap gap-2 items-center text-[9px] text-on-surface-variant/70 uppercase">
                                                                {device.status === 'offline' && device.offlineSince && (
                                                                    <span className="break-words max-w-full">{t('DL_DOWN_FOR').replace('{days}', String(Math.max(1, Math.floor((Date.now() - new Date(device.offlineSince).getTime()) / 86400000))))}</span>
                                                                )}
                                                                {device.lastBoot && (
                                                                    <span className="flex items-center gap-1 break-words max-w-full">
                                                                        <RotateCcw size={10} /> {formatDistanceToNow(new Date(device.lastBoot), { addSuffix: true, locale: ptBR })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </td>
                                        )}

                                        {visibleColumns.includes('ip') && (
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3 group/ip">
                                                    <span className="font-data-mono text-[11px] text-primary bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-lg shadow-inner uppercase font-black">
                                                        {device.ip}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(device.ip);
                                                        }}
                                                        className="p-2 text-on-surface-variant opacity-0 group-hover/ip:opacity-100 hover:text-primary transition-all bg-surface-container-highest/40 rounded-lg"
                                                    >
                                                        <Copy size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}

                                        {visibleColumns.includes('hostname') && (
                                            <td className="px-6 py-5">
                                                <span className="font-data-mono text-[10px] text-on-surface-variant/60 uppercase truncate block max-w-[120px]">
                                                    {device.hostname || t('DL_UNSPECIFIED')}
                                                </span>
                                            </td>
                                        )}

                                        {visibleColumns.includes('assetNumber') && (
                                            <td className="px-6 py-5">
                                                <span className="font-data-mono text-[11px] text-on-surface border border-white/5 bg-white/5 px-3 py-1.5 rounded-lg uppercase font-black">
                                                    {device.assetNumber || 'N/A'}
                                                </span>
                                            </td>
                                        )}

                                        {visibleColumns.includes('macAddress') && (
                                            <td className="px-6 py-5">
                                                <span className="font-data-mono text-[10px] text-on-surface-variant/60 uppercase tracking-widest font-black">
                                                    {device.macAddress || device.mac || '??:??:??:??:??:??'}
                                                </span>
                                            </td>
                                        )}

                                        {visibleColumns.includes('type') && (
                                            <td className="px-6 py-5 min-w-[160px]">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                                                        <TypeIcon type={device.type} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-display-lg text-[11px] uppercase italic text-on-surface-variant/80 group-hover:text-primary transition-colors">{device.type || t('UNKNOWN')}</span>
                                                        {device.model && (
                                                            <span className="font-data-mono text-[9px] text-on-surface-variant/40 uppercase italic truncate max-w-[100px]" title={device.model}>
                                                                {device.model}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        )}

                                        {visibleColumns.includes('department') && (
                                            <td className="px-6 py-5">
                                                <span className="font-label-caps text-[10px] text-on-surface-variant/80 uppercase font-black tracking-widest italic">{device.department || 'GLOBAL'}</span>
                                            </td>
                                        )}

                                        {visibleColumns.includes('location') && (
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <Globe size={12} className="text-primary/40" />
                                                    <span className="font-display-lg text-[10px] text-on-surface-variant/80 uppercase tracking-tighter italic">
                                                        {typeof device.location === 'string' ? device.location : (device.location?.name || t('DL_CENTRAL_SITE'))}
                                                    </span>
                                                </div>
                                            </td>
                                        )}

                                        {visibleColumns.includes('connectedTo') && (
                                            <td className="px-6 py-5">
                                                {device.parentId ? (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                            <span className="font-display-lg text-[10px] text-on-surface uppercase italic truncate max-w-[100px]">{device.parentName || device.parentDevice?.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-data-mono text-[9px] text-on-surface-variant/40 uppercase tracking-tighter italic">P:{device.parentPort || device.connectedPort || '??'}</span>
                                                            {device.portSpeed && <span className="font-data-mono text-[9px] text-primary font-black bg-primary/10 px-1.5 rounded uppercase">{device.portSpeed}</span>}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 opacity-30">
                                                        <Radio size={12} />
                                                        <span className="font-display-lg text-[9px] text-on-surface-variant uppercase tracking-[0.2em] italic font-black">CORE_ROOT</span>
                                                    </div>
                                                )}
                                            </td>
                                        )}

                                        <td className="px-6 py-5 text-right">
                                            <div className="flex flex-wrap gap-2 justify-end items-center">
                                                {visibleColumns.includes('monitoringLevel') && (
                                                    <div className="relative group/level flex items-center justify-center">
                                                        {(() => {
                                                            const lvl = device.monitoringLevel ?? 0;
                                                            const badgeClass = lvl === 0
                                                                ? 'bg-surface-container-highest/50 border-white/5 text-on-surface-variant/40'
                                                                : lvl === 1
                                                                ? 'bg-primary/10 border-primary/30 text-primary'
                                                                : lvl === 2
                                                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                                                                : 'bg-error/10 border-error/30 text-error';
                                                            return (
                                                                <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-data-mono text-[11px] font-black border transition-all ${badgeClass}`} title={t('CRITICALITY')}>
                                                                    {lvl === 0 ? 'OFF' : `L${lvl}`}
                                                                </span>
                                                            );
                                                        })()}
                                                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover/level:flex items-center gap-1 bg-surface-container-highest border border-white/10 rounded-xl p-1 shadow-2xl z-50">
                                                            {[0, 1, 2, 3].map((lvlOpt) => (
                                                                <button
                                                                    key={lvlOpt}
                                                                    onClick={() => setLevelMutation.mutate({ deviceId: device.id, level: lvlOpt })}
                                                                    disabled={setLevelMutation.isPending || (device.monitoringLevel ?? 0) === lvlOpt}
                                                                    className={`w-9 h-9 rounded-lg font-data-mono text-[10px] font-black transition-all disabled:opacity-30 disabled:cursor-default
                                                                        ${lvlOpt === 0 ? 'hover:bg-white/5 text-on-surface-variant' :
                                                                          lvlOpt === 1 ? 'hover:bg-primary/20 text-primary' :
                                                                          lvlOpt === 2 ? 'hover:bg-amber-500/20 text-amber-500' :
                                                                          'hover:bg-error/20 text-error'}`}
                                                                    title={`Criticidade ${lvlOpt === 0 ? 'OFF' : `L${lvlOpt}`}`}
                                                                >
                                                                    {lvlOpt === 0 ? 'OFF' : `L${lvlOpt}`}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {device.rustdeskId && (
                                                    <button
                                                        onClick={() => window.open(`rustdesk://${device.rustdeskId}`, '_self')}
                                                        className="w-10 h-10 flex items-center justify-center bg-surface-container-highest/40 hover:bg-primary/20 text-on-surface-variant hover:text-primary transition-all rounded-xl border border-white/5"
                                                        title={`Conectar RustDesk: ${device.rustdeskId}`}
                                                    >
                                                        <MonitorSmartphone size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => onOpenInventory?.(device.id)}
                                                    className="w-10 h-10 flex items-center justify-center bg-surface-container-highest/40 hover:bg-primary/20 text-on-surface-variant hover:text-primary transition-all rounded-xl border border-white/5"
                                                    title={t('OPEN_INVENTORY_CORE') || 'OPEN_INVENTORY_CORE'}
                                                >
                                                    <Database size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setEditingDevice(device)}
                                                    className="w-10 h-10 flex items-center justify-center bg-surface-container-highest/40 hover:bg-primary/20 text-on-surface-variant hover:text-primary transition-all rounded-xl border border-white/5"
                                                    title={t('NODE_CONFIG') || 'NODE_CONFIG'}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setMetricsDevice(device)}
                                                    className="w-10 h-10 flex items-center justify-center bg-surface-container-highest/40 hover:bg-secondary-fixed/20 text-on-surface-variant hover:text-secondary-fixed transition-all rounded-xl border border-white/5"
                                                    title={t('ANALYTICS_MATRIX') || 'ANALYTICS_MATRIX'}
                                                >
                                                    <BarChart3 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(device)}
                                                    className="w-10 h-10 flex items-center justify-center bg-surface-container-highest/40 hover:bg-error/20 text-on-surface-variant hover:text-error transition-all rounded-xl border border-white/5"
                                                    title={t('PURGE_NODE') || 'PURGE_NODE'}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {rowVirtualizer.getVirtualItems().length > 0 && (
                                <tr style={{ height: `${rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1].end}px` }}></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {netAccessDevice && (
                <NetAccessModal 
                    device={netAccessDevice} 
                    onClose={() => {
                        setNetAccessDevice(null);
                        setNetAccessRect(null);
                    }}
                    triggerRect={netAccessRect}
                />
            )}
        </div>
    );
}
