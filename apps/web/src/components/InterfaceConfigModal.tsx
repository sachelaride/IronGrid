import { useState, useEffect } from 'react';
import { trpc } from '../utils/trpc';
import { X, Activity, Zap, Layers, CheckCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface InterfaceConfigModalProps {
    device: any;
    onClose: () => void;
}

/**
 * InterfaceConfigModal - Quick interface selector for the Monitoring Graphs page.
 * Allows toggling which interfaces should appear in the native charts,
 * without requiring a full SNMP re-probe.
 */
export function InterfaceConfigModal({ device, onClose }: InterfaceConfigModalProps) {
    const utils = trpc.useUtils();
    const [saving, setSaving] = useState(false);
    const [limitMessage, setLimitMessage] = useState('');

    const toggleMutation = (trpc.snmp as any).toggleInterface.useMutation({
        onSuccess: () => {
            utils.snmp.listMonitoredDevices.invalidate();
        },
    });

    const bulkToggleMutation = (trpc.snmp as any).bulkToggleInterfaces.useMutation({
        onSuccess: () => {
            utils.snmp.listMonitoredDevices.invalidate();
        },
    });

    // Build local enabled state from interfaceDetails
    const [enabledMap, setEnabledMap] = useState<Record<number, boolean>>({});

    useEffect(() => {
        if (device?.interfaceDetails) {
            const initial: Record<number, boolean> = {};
            device.interfaceDetails.forEach((iface: any) => {
                if (typeof iface.index === 'number') {
                    initial[iface.index] = iface.enabled === true || iface.autoEnabled === true;
                }
            });
            setEnabledMap(initial);
        }
    }, [device]);

    const handleToggle = async (iface: any) => {
        if (typeof iface.index !== 'number') return;
        const newVal = !enabledMap[iface.index];

        setEnabledMap(prev => ({ ...prev, [iface.index]: newVal }));

        try {
            await toggleMutation.mutateAsync({
                deviceId: device.deviceId || device.id,
                index: iface.index,
                enabled: newVal,
            });
        } catch (e) {
            // revert on error
            setEnabledMap(prev => ({ ...prev, [iface.index]: !newVal }));
            setLimitMessage((e as any)?.message || 'Nao foi possivel alterar esta interface.');
        }
    };

    const handleBulkAll = async (enabled: boolean) => {
        setSaving(true);
        try {
            await bulkToggleMutation.mutateAsync({
                deviceId: device.deviceId || device.id,
                type: 'all',
                enabled,
            });
            // Update local state
            const newMap: Record<number, boolean> = {};
            device.interfaceDetails?.forEach((iface: any) => {
                if (typeof iface.index === 'number') newMap[iface.index] = enabled;
            });
            setEnabledMap(newMap);
        } catch (e) {
            setLimitMessage((e as any)?.message || 'Nao foi possivel alterar as interfaces.');
        } finally {
            setSaving(false);
        }
    };

    const interfaces = device?.interfaceDetails || [];
    const initialEnabledCount = interfaces.filter((iface: any) => iface.enabled === true || iface.autoEnabled === true).length;
    const enabledCount = Object.values(enabledMap).filter(Boolean).length;

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-card border border-border rounded-[2.5rem] w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative"
            >
                {/* Top accent line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

                {/* Header */}
                <div className="p-8 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center">
                            <Layers className="text-accent" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-main uppercase italic tracking-tighter leading-none">
                                Interfaces Monitoradas
                            </h2>
                            <p className="text-[10px] font-bold text-main/40 uppercase tracking-widest mt-1">
                                {device.deviceName || device.name} • {device.ip}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-accent uppercase tracking-widest bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
                            {enabledCount} / {interfaces.length} Ativas
                        </span>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl hover:bg-card/80 border border-transparent hover:border-border flex items-center justify-center text-main/50 hover:text-main transition-all group"
                        >
                            <X size={20} className="group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Bulk Actions */}
                <div className="px-8 py-4 border-b border-border flex items-center gap-3">
                    <span className="text-[10px] font-black text-main/30 uppercase tracking-widest">Ação rápida:</span>
                    <button
                        onClick={() => handleBulkAll(true)}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                    >
                        <Wifi size={12} /> Habilitar Todas
                    </button>
                    <button
                        onClick={() => handleBulkAll(false)}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all disabled:opacity-50"
                    >
                        <WifiOff size={12} /> Desabilitar Todas
                    </button>
                    {saving && <RefreshCw size={14} className="animate-spin text-main/40 ml-auto" />}
                </div>

                {limitMessage && (
                    <div className="mx-8 mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm font-bold text-amber-200 shadow-xl">
                        <div className="flex items-start justify-between gap-4">
                            <span>{limitMessage}</span>
                            <button
                                onClick={() => setLimitMessage('')}
                                className="text-[10px] font-black uppercase tracking-widest text-amber-100/70 hover:text-amber-100"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                )}

                {/* Interface List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {interfaces.length === 0 ? (
                        <div className="py-20 text-center">
                            <Activity className="w-12 h-12 text-main/20 mx-auto mb-4" />
                            <p className="text-main/30 font-bold italic uppercase text-sm tracking-widest">
                                Nenhuma interface encontrada
                            </p>
                            <p className="text-main/20 text-xs mt-2 italic">
                                Verifique se o dispositivo está com SNMP configurado e foi sincronizado.
                            </p>
                        </div>
                    ) : (
                        interfaces.map((iface: any) => {
                            if (typeof iface.index !== 'number') return null;
                            const isEnabled = enabledMap[iface.index] ?? false;
                            const isUp = iface.status === 'up';

                            return (
                                <button
                                    key={iface.index}
                                    onClick={() => handleToggle(iface)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${
                                        isEnabled
                                            ? 'bg-accent/5 border-accent/30 hover:bg-accent/10'
                                            : 'bg-card/50 border-border hover:border-main/20'
                                    }`}
                                >
                                    {/* Toggle indicator */}
                                    <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all shrink-0 ${
                                        isEnabled
                                            ? 'bg-accent border-accent shadow-[0_0_12px_rgba(var(--accent-fixed),0.3)]'
                                            : 'border-border group-hover:border-main/30'
                                    }`}>
                                        {isEnabled && <CheckCircle size={16} className="text-white" />}
                                    </div>

                                    {/* Index */}
                                    <span className="text-[10px] font-mono font-black text-main/30 w-8 shrink-0">
                                        #{String(iface.index).padStart(2, '0')}
                                    </span>

                                    {/* Name */}
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className={`font-black italic uppercase text-sm truncate transition-colors ${
                                            isEnabled ? 'text-main' : 'text-main/40'
                                        }`}>
                                            {iface.alias || iface.name}
                                        </span>
                                        {iface.alias && iface.alias !== iface.name && (
                                            <span className="text-[9px] text-main/25 font-mono uppercase truncate">
                                                {iface.name}
                                            </span>
                                        )}
                                    </div>

                                    {/* Status badge */}
                                    <div className={`flex items-center gap-2 shrink-0 ${isUp ? 'text-emerald-500' : 'text-main/25'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${isUp ? 'bg-emerald-500 animate-pulse' : 'bg-main/20'}`} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">
                                            {isUp ? 'UP' : 'DOWN'}
                                        </span>
                                    </div>

                                    {/* Enabled label */}
                                    {isEnabled && (
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Zap size={12} className="text-accent" />
                                            <span className="text-[9px] font-black text-accent uppercase tracking-widest">Ativa</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-card/50 text-center">
                    <p className="text-[10px] text-main/20 font-bold italic uppercase tracking-widest">
                        As alterações são salvas automaticamente e refletidas nos gráficos imediatamente.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
