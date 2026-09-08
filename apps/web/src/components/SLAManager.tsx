import { useState } from 'react';
import { trpc } from '../utils/trpc';
import { Clock, CheckCircle2, Save, Loader2, AlertCircle, X, ChevronRight } from 'lucide-react';

/**
 * SLAManager - Service Level Agreement Governance.
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
export function SLAManager() {
    const utils = trpc.useContext();
    const { data: configs = [], isLoading } = (trpc.tickets as any).listSLA.useQuery();
    const updateMutation = (trpc.tickets as any).updateSLA.useMutation({
        onSuccess: () => {
            utils.tickets.listSLA.invalidate();
        }
    });

    const [editingId, setEditingId] = useState<string | null>(null);
    const [responseTime, setResponseTime] = useState(0);
    const [resolutionTime, setResolutionTime] = useState(0);

    const handleEdit = (config: any) => {
        setEditingId(config.id);
        setResponseTime(config.responseTimeMinutes);
        setResolutionTime(config.resolutionTimeMinutes);
    };

    const handleSave = () => {
        if (!editingId) return;
        updateMutation.mutate({
            id: editingId,
            responseTimeMinutes: responseTime,
            resolutionTimeMinutes: resolutionTime
        });
        setEditingId(null);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-32 glass-panel border-white/5 border-dashed rounded bg-surface-container/5">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
                <p className="font-label-caps text-xs text-on-surface-variant uppercase tracking-[0.4em] italic animate-pulse">Syncing SLA Policy Matrix...</p>
            </div>
        );
    }

    return (
        <div className="space-y-gutter animate-in fade-in duration-700">
            <div className="flex flex-col gap-3 ml-2">
                <h3 className="font-display-lg text-3xl text-primary uppercase tracking-tighter italic">SLA_GOVERNANCE_PROTOCOLS</h3>
                <p className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-[0.3em] italic">Threshold Matrix for Operational Response & Resolution</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-gutter">
                {configs.map((config: any) => {
                    const isEditing = editingId === config.id;
                    const priorityStyles: any = {
                        CRITICAL: 'text-error bg-error/10 border-error/20 shadow-[0_0_15px_rgba(var(--error),0.1)]',
                        HIGH: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
                        MEDIUM: 'text-primary bg-primary/10 border-primary/20',
                        LOW: 'text-on-surface-variant bg-white/5 border-white/10',
                    };

                    return (
                        <div key={config.id} className={`glass-panel p-10 border-white/5 transition-all group relative overflow-hidden ${isEditing ? 'border-primary/40 ring-1 ring-primary/20 bg-surface-container/95' : 'hover:border-white/20'}`}>
                            {isEditing && (
                                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                                    <Clock size={160} className="text-primary" />
                                </div>
                            )}
                            <div className="flex justify-between items-center mb-10 relative z-10">
                                <span className={`px-4 py-1 rounded font-label-caps text-[9px] uppercase tracking-[0.3em] border ${priorityStyles[config.priority]}`}>
                                    {config.priority}_PRIO_NODE
                                </span>
                                {!isEditing && (
                                    <button
                                        onClick={() => handleEdit(config)}
                                        className="font-label-caps text-[10px] text-primary uppercase tracking-widest hover:text-on-surface transition-colors flex items-center gap-3 group/btn"
                                    >
                                        RECONFIGURE_THRESHOLDS <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 relative z-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest italic opacity-60">
                                        <Clock className="w-3.5 h-3.5" /> RESPONSE_TIMEOUT
                                    </div>
                                    {isEditing ? (
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={responseTime}
                                                onChange={e => setResponseTime(parseInt(e.target.value))}
                                                className="w-full !bg-surface-container-high border-primary/30 rounded font-data-mono text-xl text-primary p-4 pr-12 focus:border-primary transition-all outline-none"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-caps text-[10px] text-on-surface-variant uppercase">MINS</span>
                                        </div>
                                    ) : (
                                        <div className="font-display-lg text-4xl text-on-surface uppercase tracking-tighter italic">
                                            {config.responseTimeMinutes}
                                            <span className="font-label-caps text-[11px] text-on-surface-variant uppercase ml-3 tracking-[0.2em] not-italic opacity-40">MINS</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest italic opacity-60">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> RESOLUTION_TIMEOUT
                                    </div>
                                    {isEditing ? (
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={resolutionTime}
                                                onChange={e => setResolutionTime(parseInt(e.target.value))}
                                                className="w-full !bg-surface-container-high border-primary-fixed-dim/30 rounded font-data-mono text-xl text-primary-fixed-dim p-4 pr-12 focus:border-primary-fixed-dim transition-all outline-none"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-caps text-[10px] text-on-surface-variant uppercase">MINS</span>
                                        </div>
                                    ) : (
                                        <div className="font-display-lg text-4xl text-on-surface uppercase tracking-tighter italic">
                                            {config.resolutionTimeMinutes}
                                            <span className="font-label-caps text-[11px] text-on-surface-variant uppercase ml-3 tracking-[0.2em] not-italic opacity-40">MINS</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isEditing && (
                                <div className="mt-12 flex gap-6 animate-in slide-in-from-bottom-4 relative z-10">
                                    <button
                                        onClick={() => setEditingId(null)}
                                        className="flex-1 h-14 font-label-caps text-[11px] text-on-surface-variant hover:text-on-surface uppercase tracking-widest transition-all border border-white/5 rounded hover:bg-white/5 flex items-center justify-center gap-3"
                                    >
                                        <X size={18} /> ABORT_CHANGES
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={updateMutation.isPending}
                                        className="cyber-button flex-[2] h-14 !bg-primary text-on-primary-container border-primary flex items-center justify-center gap-4"
                                    >
                                        {updateMutation.isPending ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                        COMMIT_POLICY_SYNC
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="p-8 bg-primary/5 border border-primary/20 rounded flex items-start gap-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-8 -top-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <AlertCircle size={120} className="text-primary" />
                </div>
                <AlertCircle size={24} className="text-primary shrink-0 mt-1" />
                <div className="space-y-2 relative z-10">
                    <p className="font-label-caps text-[11px] text-primary uppercase tracking-[0.3em] italic">OPERATIONAL_ADVISORY</p>
                    <p className="font-label-caps text-[10px] text-on-surface-variant leading-relaxed uppercase tracking-[0.15em]">
                        SLA configuration changes are applied only to <span className="text-on-surface font-black">NEWLY_INITIALIZED_TICKETS</span>. Active service protocols maintain their historical calculated thresholds to preserve integrity of NOC auditing and analytics.
                    </p>
                </div>
            </div>
        </div>
    );
}
