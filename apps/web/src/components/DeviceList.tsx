import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Search, Filter, Download, Activity, Globe, ChevronLeft, ChevronRight, LayoutGrid, Database, Server, Shield, ShieldCheck, Zap } from 'lucide-react';
import { trpc } from '../utils/trpc';
import { ManageDeviceModal } from './ManageDeviceModal';
import { DeviceMetricsModal } from './DeviceMetricsModal';
import { EditDeviceModal } from './EditDeviceModal';
import { TestResultsModal } from './TestResultsModal';
import { BulkActionBar } from './device-list/BulkActionBar';
import { DeviceTable } from './device-list/DeviceTable';
import { motion, AnimatePresence } from 'framer-motion';

interface DeviceListProps {
    onOpenInventory?: (id: string) => void;
}

/**
 * DeviceList - Network Inventory and Asset Management.
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
export function DeviceList({ onOpenInventory }: DeviceListProps) {
    const { t } = useLanguage();
    const [typeFilter, setTypeFilter] = useState('all');
    const [deptFilter, setDeptFilter] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const [managingDevice, setManagingDevice] = useState<any>(null);
    const [metricsDevice, setMetricsDevice] = useState<any>(null);
    const [editingDevice, setEditingDevice] = useState<any>(null);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [testResults, setTestResults] = useState<any>(null);
    const [showTestResults, setShowTestResults] = useState(false);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    const [visibleColumns, setVisibleColumns] = useState<string[]>(['graphs', 'ipamStatus', 'monitoringLevel', 'name', 'ip', 'type']);
    const [showColumnToggle, setShowColumnToggle] = useState(false);

    const COLUMNS = [
        { id: 'graphs', label: t('DL_COL_GRAPHS'), icon: <Activity size={12} /> },
        { id: 'ipamStatus', label: t('STATUS'), icon: <Activity size={12} /> },
        { id: 'name', label: t('NAME') },
        { id: 'ip', label: t('IP_ADDRESS') },
        { id: 'hostname', label: t('HOSTNAME') },
        { id: 'assetNumber', label: t('ASSET_NUMBER') },
        { id: 'macAddress', label: t('MAC_ADDRESS') },
        { id: 'type', label: t('TYPE') },
        { id: 'department', label: t('UNIT') },
        { id: 'location', label: t('LOCATION') },
        { id: 'connectedTo', label: t('DL_COL_UPSTREAM') },
        { id: 'monitoringLevel', label: t('CRITICALITY'), icon: <Shield size={12} /> },
    ];

    const utils = trpc.useContext();
    const { data, isLoading } = (trpc.scan as any).getDevicesPaginated.useQuery({
        search: debouncedSearch,
        type: typeFilter,
        department: deptFilter,
        sortBy,
        sortOrder,
        page,
        limit
    }, {
        keepPreviousData: true
    });

    const devices = (data as any)?.devices ?? [];
    const total = (data as any)?.total ?? 0;

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, typeFilter, deptFilter]);

    const { data: departments = [] } = trpc.organization.listDepartments.useQuery();
    const { data: communities = [] } = trpc.snmp.listCommunities.useQuery();

    const toggleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const deleteMutation = trpc.scan.deleteDevice.useMutation({
        onSuccess: () => {
            utils.scan.getDevices.invalidate();
            (utils.scan as any).getDevicesPaginated.invalidate();
        }
    });

    const toggleMonitoring = (trpc as any).snmp.toggleMonitoring.useMutation({
        onSuccess: () => {
            utils.scan.getDevices.invalidate();
            (utils.scan as any).getDevicesPaginated.invalidate();
        }
    });

    const setLevelMutation = trpc.monitoring.setDeviceMonitoringLevel.useMutation({
        onSuccess: () => {
            utils.scan.getDevices.invalidate();
            (utils.scan as any).getDevicesPaginated.invalidate();
            utils.monitoring.getDevicesWithLevels.invalidate();
        }
    });

    const handleDelete = async (device: any) => {
        if (confirm(t('DL_DELETE_CONFIRM').replace('{name}', device.name || device.ip))) {
            await deleteMutation.mutateAsync({ id: device.id });
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(devices.map((d: any) => d.id));
        } else {
            setSelectedIds([]);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const exportToCSV = () => {
        const headers = [
            t('DL_CSV_NAME'),
            t('DL_CSV_IP'),
            t('DL_CSV_HOSTNAME'),
            t('DL_CSV_MAC'),
            t('DL_CSV_TYPE'),
            t('DL_CSV_STATUS'),
            t('DL_CSV_DEPT'),
            t('DL_CSV_USER'),
            t('DL_CSV_LAST_SEEN')
        ];
        const rows = devices.map((d: any) => [
            d.name, d.ip, d.hostname, d.mac, d.type, d.status, d.department, d.user, d.lastSeen
        ]);
        const csvContent = [
            headers.join(','),
            ...rows.map((r: any) => r.map((cell: any) => `"${cell || ''}"`).join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `irongrid_assets_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    if (isLoading) {
        return (
            <div className="p-32 flex flex-col items-center justify-center">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-primary/10 border-t-primary rounded-full animate-spin mb-8" />
                    <Zap size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" />
                </div>
                <p className="font-label-caps text-[12px] text-on-surface-variant tracking-[0.5em] uppercase italic animate-pulse">{t('DL_SCANNING_GRID')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-gutter animate-in fade-in duration-700 pt-4">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
                    <div className="space-y-1">
                        <h1 className="font-display-lg text-2xl text-primary uppercase tracking-tighter italic flex items-center gap-3">
                            <Database size={24} /> {t('NETWORK_INVENTORY_MATRIX')}
                        </h1>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                                <span className="w-1.5 h-1.5 rounded-full bg-primary absolute" />
                            </div>
                            <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-[0.3em] italic opacity-60">{t('DL_SUBTITLE')}</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                        <div className="relative">
                            <button
                                onClick={() => setShowColumnToggle(!showColumnToggle)}
                                className="cyber-button px-5 h-9 flex items-center justify-center gap-2 w-full sm:w-auto !bg-surface-container-high border-white/10 text-on-surface font-display-lg text-[11px] italic tracking-tighter"
                            >
                                <LayoutGrid size={14} /> {t('VIEW_MATRIX')}
                            </button>
                            <AnimatePresence>
                                {showColumnToggle && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-4 w-72 glass-panel p-6 z-50 bg-surface-container/95 backdrop-blur-none border-white/10 shadow-3xl"
                                    >
                                        <h3 className="font-display-lg text-[13px] text-primary uppercase tracking-tighter border-b border-white/5 pb-4 mb-4 italic">{t('DL_VISIBILITY_PROTOCOL')}</h3>
                                        <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                                            {COLUMNS.map(col => (
                                                <label key={col.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-all group">
                                                    <span className="font-label-caps text-[10px] text-on-surface-variant group-hover:text-primary uppercase flex items-center gap-3 italic font-black transition-colors">
                                                        {col.icon} {col.label}
                                                    </span>
                                                    <input
                                                        type="checkbox"
                                                        checked={visibleColumns.includes(col.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setVisibleColumns([...visibleColumns, col.id]);
                                                            else setVisibleColumns(visibleColumns.filter(c => c !== col.id));
                                                        }}
                                                        className="w-5 h-5 rounded-lg border-white/10 bg-surface-container-highest text-primary focus:ring-primary ring-offset-0"
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setVisibleColumns(['graphs', 'ipamStatus', 'name', 'ip', 'type'])}
                                            className="font-display-lg text-[10px] text-primary hover:brightness-125 uppercase tracking-widest w-full mt-6 text-center italic border-t border-white/5 pt-4"
                                        >
                                            {t('DL_RESET_DEFAULT')}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <button onClick={exportToCSV} className="cyber-button px-5 h-9 flex items-center justify-center gap-2 w-full sm:w-auto !bg-primary text-black border-primary font-display-lg text-[11px] italic tracking-tighter">
                            <Download size={14} /> {t('EXPORT_CORES')}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative group md:col-span-2">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/80 transition-colors group-focus-within:text-primary" />
                        <input
                            type="text"
                            autoFocus={true}
                            placeholder={t('DL_SEARCH_PLACEHOLDER')}
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="h-10 !bg-surface-container-high/40 border-white/5 pl-12 pr-4 font-data-mono text-[11px] uppercase tracking-widest focus:border-primary/50 transition-all rounded-xl placeholder:text-white"
                        />
                    </div>
                    <div className="relative group">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/80 group-focus-within:text-primary pointer-events-none" />
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="h-10 !bg-surface-container-high/40 border-white/5 pl-10 pr-10 font-data-mono text-[11px] uppercase tracking-widest focus:border-primary/50 transition-all rounded-xl appearance-none"
                        >
                            <option className="bg-surface-container-high text-on-surface" value="all">{t('DL_TYPE_ALL')}</option>
                            <option className="bg-surface-container-high text-on-surface" value="SERVER">{t('DL_TYPE_SERVER')}</option>
                            <option className="bg-surface-container-high text-on-surface" value="ROUTER">{t('DL_TYPE_ROUTER')}</option>
                            <option className="bg-surface-container-high text-on-surface" value="SWITCH">{t('DL_TYPE_SWITCH')}</option>
                            <option className="bg-surface-container-high text-on-surface" value="FIREWALL">{t('DL_TYPE_FIREWALL')}</option>
                            <option className="bg-surface-container-high text-on-surface" value="DATABASE">{t('DL_TYPE_DATABASE')}</option>
                            <option className="bg-surface-container-high text-on-surface" value="VOIP">{t('DL_TYPE_VOIP')}</option>
                            <option className="bg-surface-container-high text-on-surface" value="NAS">{t('DL_TYPE_NAS')}</option>
                            <option className="bg-surface-container-high text-on-surface" value="CAMERA">{t('DL_TYPE_CAMERA')}</option>
                            <option className="bg-surface-container-high text-on-surface" value="ACCESS_POINT">{t('DL_TYPE_AP')}</option>
                            <option className="bg-surface-container-high text-on-surface" value="PRINTER">{t('DL_TYPE_PRINTER')}</option>
                            <option className="bg-surface-container-high text-on-surface" value="WORKSTATION">{t('DL_TYPE_WORKSTATION')}</option>
                            <option className="bg-surface-container-high text-on-surface" value="INTERNET">{t('DL_TYPE_INTERNET')}</option>
                            <option className="bg-surface-container-high text-on-surface" value="OTHER">{t('DL_TYPE_OTHER')}</option>
                        </select>
                    </div>
                    <div className="relative group">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/80 group-focus-within:text-primary pointer-events-none" />
                        <select
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
                            className="h-10 !bg-surface-container-high/40 border-white/5 pl-10 pr-10 font-data-mono text-[11px] uppercase tracking-widest focus:border-primary/50 transition-all rounded-xl appearance-none"
                        >
                            <option className="bg-surface-container-high text-on-surface" value="">{t('DL_UNIT_ALL')}</option>
                            {departments.map((dept: any) => (
                                <option className="bg-surface-container-high text-on-surface" key={dept.id} value={dept.name}>{t('DL_UNIT_PREFIX')}{dept.name.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <BulkActionBar
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                devices={devices}
                departments={departments}
                communities={communities}
                setTestResults={setTestResults}
                setShowTestResults={setShowTestResults}
            />



            <DeviceTable
                devices={devices}
                selectedIds={selectedIds}
                visibleColumns={visibleColumns}
                sortBy={sortBy}
                sortOrder={sortOrder}
                toggleSelect={toggleSelect}
                handleSelectAll={handleSelectAll}
                toggleSort={toggleSort}
                toggleMonitoring={toggleMonitoring}
                setLevelMutation={setLevelMutation}
                setManagingDevice={setManagingDevice}
                setMetricsDevice={setMetricsDevice}
                setEditingDevice={setEditingDevice}
                handleDelete={handleDelete}
                onOpenInventory={onOpenInventory}
            />

            {total > 0 && (
                <div className="glass-panel p-4 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-white/5 bg-surface-container/95">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                        <div className="space-y-1">
                            <span className="font-label-caps text-[9px] text-on-surface-variant/80 uppercase tracking-[0.3em]">{t('DL_PAGINATION_TITLE')}</span>
                            <p className="font-data-mono text-[11px] text-primary uppercase tracking-widest font-black">
                                {t('DL_PAGINATION_INFO')
                                    .replace('{start}', String(((page - 1) * limit) + 1))
                                    .replace('{end}', String(Math.min(page * limit, total)))
                                    .replace('{total}', String(total))}
                            </p>
                        </div>
                        <div className="relative group">
                            <select
                                value={limit}
                                onChange={(e) => {
                                    setLimit(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="h-10 !bg-surface-container-highest/40 border-white/5 px-6 font-data-mono text-[10px] uppercase tracking-widest focus:border-primary transition-all rounded-xl appearance-none pr-10"
                            >
                                <option className="bg-surface-container-high text-on-surface" value={10}>{t('DL_LIMIT_FORMAT').replace('{limit}', '10')}</option>
                                <option className="bg-surface-container-high text-on-surface" value={25}>{t('DL_LIMIT_FORMAT').replace('{limit}', '25')}</option>
                                <option className="bg-surface-container-high text-on-surface" value={50}>{t('DL_LIMIT_FORMAT').replace('{limit}', '50')}</option>
                            </select>
                            <LayoutGrid className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-primary/80 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="w-12 h-12 flex items-center justify-center text-on-surface-variant/90 hover:text-primary disabled:opacity-20 transition-all border border-white/5 rounded-xl bg-surface-container-high"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex items-center gap-2">
                            {Array.from({ length: Math.min(5, Math.ceil(total / limit)) }, (_, i) => {
                                const p = i + 1;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-12 h-12 rounded-xl font-data-mono text-[11px] font-black transition-all border ${page === p ? 'bg-primary text-black border-primary shadow-2xl shadow-primary/40' : 'text-on-surface-variant/90 hover:text-on-surface hover:bg-white/5 border-white/5'}`}
                                    >
                                        {p < 10 ? `0${p}` : p}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))}
                            disabled={page >= Math.ceil(total / limit)}
                            className="w-12 h-12 flex items-center justify-center text-on-surface-variant/90 hover:text-primary disabled:opacity-20 transition-all border border-white/5 rounded-xl bg-surface-container-high"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-panel p-4 flex items-center gap-4 group hover:bg-primary/5 transition-all relative overflow-hidden border-white/5">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-20" />
                    <div className="bg-primary/10 rounded-xl p-3 text-primary group-hover:scale-110 group-hover:bg-primary/20 transition-all shadow-2xl">
                        <Server size={24} />
                    </div>
                    <div className="space-y-1">
                        <span className="font-display-lg text-base text-primary uppercase tracking-tighter italic">{t('DL_PERFORMANCE_MATRIX')}</span>
                        <p className="font-label-caps text-[10px] text-on-surface-variant/90 uppercase tracking-[0.1em] leading-relaxed italic">{t('DL_PERFORMANCE_DESC')}</p>
                    </div>
                </div>

                <div className="glass-panel p-4 flex items-center gap-4 group hover:bg-secondary-fixed/5 transition-all relative overflow-hidden border-white/5">
                    <div className="absolute top-0 left-0 w-1 h-full bg-secondary-fixed opacity-20" />
                    <div className="bg-secondary-fixed/10 rounded-xl p-3 text-secondary-fixed group-hover:scale-110 group-hover:bg-secondary-fixed/20 transition-all shadow-2xl">
                        <ShieldCheck size={24} />
                    </div>
                    <div className="space-y-1">
                        <span className="font-display-lg text-base text-secondary-fixed uppercase tracking-tighter italic">{t('DL_INTEGRITY_PROTOCOL')}</span>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-error/10 border border-error/20 rounded-lg">
                                <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
                                <span className="font-data-mono text-[9px] text-error font-black uppercase">{t('IPAM_OCCUPIED')}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                <span className="font-data-mono text-[9px] text-primary font-black uppercase">{t('IPAM_RESERVED')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {editingDevice && <EditDeviceModal device={editingDevice} onClose={() => setEditingDevice(null)} />}
            {managingDevice && <ManageDeviceModal device={managingDevice} onClose={() => setManagingDevice(null)} />}
            {metricsDevice && <DeviceMetricsModal device={metricsDevice} onClose={() => setMetricsDevice(null)} />}
            {showTestResults && testResults && <TestResultsModal results={testResults} onClose={() => setShowTestResults(false)} />}
        </div>
    );
}
