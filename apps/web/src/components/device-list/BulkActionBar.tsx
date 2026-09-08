import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Loader2, Activity, Trash2, Shield, Zap, RefreshCcw, XCircle, ChevronRight, Layers, LayoutGrid } from 'lucide-react';
import { trpc } from '../../utils/trpc';
import { motion, AnimatePresence } from 'framer-motion';

interface BulkActionBarProps {
    selectedIds: string[];
    setSelectedIds: (ids: string[]) => void;
    devices: any[];
    departments: any[];
    communities: any[];
    setTestResults: (results: any) => void;
    setShowTestResults: (show: boolean) => void;
}

/**
 * BulkActionBar - Operational Command Strip for asset clusters.
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
export function BulkActionBar({ 
    selectedIds, 
    setSelectedIds, 
    devices, 
    departments, 
    communities, 
    setTestResults, 
    setShowTestResults 
}: BulkActionBarProps) {
    const { t } = useLanguage();
    const [bulkDept, setBulkDept] = useState('');
    const [bulkType, setBulkType] = useState('');
    const [bulkParentId, setBulkParentId] = useState('');
    const [bulkPort, setBulkPort] = useState('');
    const [bulkPortSpeed, setBulkPortSpeed] = useState('');
    const [bulkSnmpId, setBulkSnmpId] = useState('');
    const [isBulkLoading, setIsBulkLoading] = useState(false);

    const utils = trpc.useContext();

    const bulkUpdateMutation = trpc.scan.bulkUpdateDevices.useMutation({
        onSuccess: () => {
            utils.scan.getDevices.invalidate();
            setSelectedIds([]);
            setBulkDept('');
            setBulkType('');
            setBulkParentId('');
            setBulkPort('');
            setBulkPortSpeed('');
            setBulkSnmpId('');
            setIsBulkLoading(false);
        }
    });

    const bulkPingMutation = trpc.scan.bulkPingTest.useMutation({
        onSuccess: (data: any) => {
            setTestResults({ type: 'ping', results: data.results });
            setShowTestResults(true);
        }
    });

    const bulkSnmpMutation = trpc.scan.bulkSnmpTest.useMutation({
        onSuccess: (data: any) => {
            setTestResults({ type: 'snmp', results: data.results });
            setShowTestResults(true);
            utils.scan.getDevices.invalidate();
        }
    });

    const bulkDeleteMutation = (trpc.scan as any).bulkDeleteDevices.useMutation({
        onSuccess: () => {
            utils.scan.getDevices.invalidate();
            (utils.scan as any).getDevicesPaginated?.invalidate();
            setSelectedIds([]);
        }
    });

    const handleBulkSave = async () => {
        setIsBulkLoading(true);
        const data: any = { ids: selectedIds };
        if (bulkDept) data.department = bulkDept;
        if (bulkType) data.type = bulkType;
        if (bulkParentId) {
            data.parentId = bulkParentId === 'null' ? null : bulkParentId;
        }
        if (bulkPort) data.parentPort = bulkPort;
        if (bulkPortSpeed) data.portSpeed = bulkPortSpeed;
        if (bulkSnmpId) data.snmpCommunityId = bulkSnmpId;

        await (bulkUpdateMutation as any).mutateAsync(data);
    };

    const handleBulkDelete = async () => {
        if (confirm(t('DL_BULK_DELETE_CONFIRM').replace('{count}', String(selectedIds.length)))) {
            await bulkDeleteMutation.mutateAsync({ ids: selectedIds });
        }
    };

    return (
        <AnimatePresence>
            {selectedIds.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: -20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    className="relative z-40 mb-8 overflow-hidden"
                >
                    <div className="glass-panel border-primary/30 bg-primary/5 backdrop-blur-none p-6 shadow-[0_0_50px_rgba(var(--primary-fixed),0.1)] relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary shadow-[0_0_15px_rgba(var(--primary-fixed),0.5)]" />
                        
                        <div className="flex flex-col xl:flex-row items-center gap-8">
                            <div className="flex items-center gap-6 shrink-0 border-r border-white/10 pr-8">
                                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/40 relative">
                                    <div className="absolute inset-0 bg-primary/10 animate-pulse rounded-2xl" />
                                    <Layers className="text-primary relative z-10" size={28} />
                                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary text-black rounded-lg flex items-center justify-center font-display-lg text-[13px] font-black italic shadow-lg">
                                        {selectedIds.length}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-display-lg text-lg text-primary uppercase tracking-tighter italic leading-none">{t('DL_CLUSTER_OVERRIDE')}</h3>
                                    <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-[0.3em] mt-2 italic font-black opacity-60">{t('DL_BULK_PROTOCOL')}</p>
                                </div>
                            </div>

                            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {/* SECTOR UNIT */}
                                <div className="space-y-2">
                                    <label className="font-label-caps text-[9px] text-on-surface-variant/40 uppercase tracking-widest ml-1 italic">{t('UNIT')}</label>
                                    <select
                                        value={bulkDept}
                                        onChange={(e) => setBulkDept(e.target.value)}
                                        className="h-11 w-full bg-surface-container-highest/40 border-white/5 font-data-mono text-[10px] uppercase tracking-widest px-4 focus:border-primary/50 transition-all rounded-xl"
                                    >
                                        <option value="">{t('DL_UNCHANGED')}</option>
                                        {departments
                                            .sort((a: any, b: any) => a.name.localeCompare(b.name))
                                            .map((dept: any) => (
                                                <option key={dept.id} value={dept.name}>{dept.name.toUpperCase()}</option>
                                            ))}
                                    </select>
                                </div>

                                {/* ASSET CLASS */}
                                <div className="space-y-2">
                                    <label className="font-label-caps text-[9px] text-on-surface-variant/40 uppercase tracking-widest ml-1 italic">{t('TYPE')}</label>
                                    <select
                                        value={bulkType}
                                        onChange={(e) => setBulkType(e.target.value)}
                                        className="h-11 w-full bg-surface-container-highest/40 border-white/5 font-data-mono text-[10px] uppercase tracking-widest px-4 focus:border-primary/50 transition-all rounded-xl"
                                    >
                                        <option value="">{t('DL_UNCHANGED')}</option>
                                        <option value="SERVER">{t('DL_TYPE_SERVER')}</option>
                                        <option value="ROUTER">{t('DL_TYPE_ROUTER')}</option>
                                        <option value="SWITCH">{t('DL_TYPE_SWITCH')}</option>
                                        <option value="FIREWALL">{t('DL_TYPE_FIREWALL')}</option>
                                        <option value="DATABASE">{t('DL_TYPE_DATABASE')}</option>
                                        <option value="VOIP">{t('DL_TYPE_VOIP')}</option>
                                        <option value="NAS">{t('DL_TYPE_NAS')}</option>
                                        <option value="CAMERA">{t('DL_TYPE_CAMERA')}</option>
                                        <option value="ACCESS_POINT">{t('DL_TYPE_AP')}</option>
                                        <option value="PRINTER">{t('DL_TYPE_PRINTER')}</option>
                                        <option value="WORKSTATION">{t('DL_TYPE_WORKSTATION')}</option>
                                        <option value="OTHER">{t('DL_TYPE_OTHER')}</option>
                                    </select>
                                </div>

                                {/* UPSTREAM HUB */}
                                <div className="space-y-2 lg:col-span-2 xl:col-span-1">
                                    <label className="font-label-caps text-[9px] text-on-surface-variant/40 uppercase tracking-widest ml-1 italic">{t('DL_COL_UPSTREAM')}</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={bulkParentId}
                                            onChange={(e) => setBulkParentId(e.target.value)}
                                            className="flex-1 h-11 bg-surface-container-highest/40 border-white/5 font-data-mono text-[10px] uppercase tracking-widest px-4 focus:border-primary/50 transition-all rounded-xl"
                                        >
                                            <option value="">{t('DL_UNCHANGED')}</option>
                                            <option value="null" className="italic font-black">CORE_ROOT</option>
                                            {devices
                                                .filter((d: any) => ['switch', 'router', 'firewall'].includes(d.type?.toLowerCase()) && !selectedIds.includes(d.id))
                                                .sort((a: any, b: any) => (a.name || a.ip).localeCompare(b.name || b.ip))
                                                .map((sw: any) => (
                                                    <option key={sw.id} value={sw.id}>{sw.name || sw.ip}</option>
                                                ))
                                            }
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="PORT"
                                            value={bulkPort}
                                            onChange={(e) => setBulkPort(e.target.value)}
                                            className="w-20 h-11 bg-surface-container-highest/40 border-white/5 font-data-mono text-[10px] uppercase tracking-widest px-4 focus:border-primary/50 transition-all rounded-xl placeholder:opacity-20"
                                        />
                                    </div>
                                </div>

                                {/* PROTOCOL AUTH */}
                                <div className="space-y-2 min-w-0">
                                    <label className="font-label-caps text-[9px] text-on-surface-variant/40 uppercase tracking-widest ml-1 italic">{t('SNMP_AUTH_PROFILE')}</label>
                                    <div className="flex flex-wrap gap-2">
                                        <select
                                            value={bulkSnmpId}
                                            onChange={(e) => setBulkSnmpId(e.target.value)}
                                            className="flex-1 min-w-[12rem] h-11 bg-surface-container-highest/40 border-white/5 font-data-mono text-[10px] uppercase tracking-widest px-4 focus:border-primary/50 transition-all rounded-xl"
                                        >
                                            <option value="">{t('DL_UNCHANGED')}</option>
                                            {communities
                                                .sort((a: any, b: any) => a.name.localeCompare(b.name))
                                                .map((comm: any) => (
                                                    <option key={comm.id} value={comm.id}>{comm.name.toUpperCase()}</option>
                                                ))}
                                        </select>
                                        <div className="flex gap-1 flex-none">
                                            <button
                                                onClick={() => {
                                                    const ips = devices
                                                        .filter((d: any) => selectedIds.includes(d.id))
                                                        .map((d: any) => d.ip)
                                                        .filter((ip: string) => ip != null);
                                                    bulkPingMutation.mutate({ ips });
                                                }}
                                                disabled={bulkPingMutation.isPending || isBulkLoading}
                                                className="w-11 h-11 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 flex items-center justify-center rounded-xl transition-all"
                                                title="ICMP_PING_PROBE"
                                            >
                                                {bulkPingMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const ips = devices
                                                        .filter((d: any) => selectedIds.includes(d.id))
                                                        .map((d: any) => d.ip)
                                                        .filter((ip: string) => ip != null);
                                                    const selectedComm = communities.find((c: any) => c.id === bulkSnmpId);
                                                    bulkSnmpMutation.mutate({ ips, community: selectedComm?.community || 'public' });
                                                }}
                                                disabled={bulkSnmpMutation.isPending || !bulkSnmpId || isBulkLoading}
                                                className="w-11 h-11 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary flex items-center justify-center rounded-xl transition-all"
                                                title="SNMP_AUTH_TEST"
                                            >
                                                {bulkSnmpMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* COMMAND ACTIONS */}
                                <div className="flex flex-wrap items-end gap-3 lg:col-span-2 xl:col-span-1">
                                    <button
                                        onClick={handleBulkSave}
                                        disabled={isBulkLoading || (!bulkDept && !bulkType && !bulkParentId && !bulkPort && !bulkSnmpId && !bulkPortSpeed)}
                                        className="cyber-button flex-1 min-w-[12rem] h-11 !bg-primary text-black border-primary font-display-lg text-[12px] uppercase italic tracking-tighter"
                                    >
                                        {isBulkLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                                        {t('DL_COMMIT_DELTA')}
                                    </button>
                                    <button
                                        onClick={handleBulkDelete}
                                        className="w-11 h-11 bg-error/10 hover:bg-error/20 text-error border border-error/20 flex items-center justify-center rounded-xl transition-all group"
                                        title="PURGE_CLUSTER"
                                    >
                                        <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                                    </button>
                                    <button
                                        onClick={() => setSelectedIds([])}
                                        className="w-11 h-11 bg-white/5 hover:bg-white/10 border border-white/10 text-on-surface-variant flex items-center justify-center rounded-xl transition-all"
                                        title="ABORT_COMMAND"
                                    >
                                        <XCircle size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
