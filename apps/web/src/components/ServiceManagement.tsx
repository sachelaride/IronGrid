import { useState } from 'react';
import { trpc } from '../utils/trpc';
import {
    Clock,
    CheckCircle2,
    Save,
    Loader2,
    Plus,
    Trash2,
    Edit2,
    ChevronDown,
    ChevronUp,
    LayoutGrid,
    Settings2,
    X,
    Database,
    Shield
} from 'lucide-react';

/**
 * ServiceManagement - Service Catalog & Taxonomy Governance.
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
export function ServiceManagement() {
    const utils = trpc.useContext();
    const { data: groups = [], isLoading } = trpc.serviceTypes.listGroups.useQuery();

    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
    const [editingGroup, setEditingGroup] = useState<any>(null);
    const [editingService, setEditingService] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const upsertGroupMutation = trpc.serviceTypes.upsertGroup.useMutation({
        onSuccess: () => {
            utils.serviceTypes.listGroups.invalidate();
            setEditingGroup(null);
            setIsSaving(false);
        }
    });

    const upsertServiceMutation = trpc.serviceTypes.upsertService.useMutation({
        onSuccess: () => {
            utils.serviceTypes.listGroups.invalidate();
            setEditingService(null);
            setIsSaving(false);
        }
    });

    const deleteGroupMutation = trpc.serviceTypes.deleteGroup.useMutation({
        onSuccess: () => utils.serviceTypes.listGroups.invalidate(),
        onError: (err) => alert(err.message)
    });

    const deleteServiceMutation = trpc.serviceTypes.deleteService.useMutation({
        onSuccess: () => utils.serviceTypes.listGroups.invalidate()
    });

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev =>
            prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
        );
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-32 glass-panel border-white/5 border-dashed rounded bg-surface-container/5">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
                <p className="font-label-caps text-xs text-on-surface-variant uppercase tracking-[0.4em] italic animate-pulse">Syncing Service Taxonomy...</p>
            </div>
        );
    }

    return (
        <div className="space-y-gutter animate-in fade-in duration-700">
            <div className="flex justify-between items-end gap-6 mb-4 ml-2">
                <div className="flex flex-col gap-3">
                    <h3 className="font-display-lg text-3xl text-primary uppercase tracking-tighter italic">SERVICE_CATALOG_MATRIX</h3>
                    <p className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-[0.3em] italic">Structural Hierarchy & SLA Policy Definition</p>
                </div>
                <button
                    onClick={() => setEditingGroup({ name: '', description: '' })}
                    className="cyber-button px-8 h-12 !bg-primary text-on-primary-container border-primary flex items-center gap-3"
                >
                    <Plus size={18} /> INITIALIZE_NEW_GROUP
                </button>
            </div>

            <div className="space-y-4">
                {groups.map((group) => (
                    <div key={group.id} className="glass-panel border-white/5 overflow-hidden transition-all hover:border-white/10">
                        {/* Group Header */}
                        <div className="p-8 flex items-center justify-between group/header bg-surface-container/10">
                            <div className="flex items-center gap-6 flex-1 cursor-pointer" onClick={() => toggleGroup(group.id)}>
                                <div className="p-4 bg-primary/10 text-primary rounded border border-primary/20 shadow-inner group-hover/header:bg-primary/20 transition-colors">
                                    <LayoutGrid size={22} />
                                </div>
                                <div>
                                    <h4 className="font-display-lg text-lg text-on-surface uppercase tracking-tight italic group-hover/header:text-primary transition-colors">{group.name}</h4>
                                    <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-[0.3em] mt-1 italic">{group.services.length} ACTIVE_PROTOCOLS_VINCULATED</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setEditingService({ name: '', description: '', groupId: group.id, priority: 'MEDIUM', responseTimeMinutes: 60, resolutionTimeMinutes: 480 })}
                                    className="p-3 text-on-surface-variant/60 hover:text-primary hover:bg-white/5 rounded transition-all border border-transparent hover:border-white/5"
                                    title="Add Protocol"
                                >
                                    <Plus size={20} />
                                </button>
                                <button
                                    onClick={() => setEditingGroup(group)}
                                    className="p-3 text-on-surface-variant/60 hover:text-primary-fixed-dim hover:bg-white/5 rounded transition-all border border-transparent hover:border-white/5"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => { if (confirm('EXTERMINATE_GROUP_DATA?')) deleteGroupMutation.mutate({ id: group.id }) }}
                                    className="p-3 text-on-surface-variant/60 hover:text-error hover:bg-white/5 rounded transition-all border border-transparent hover:border-white/5"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <button
                                    onClick={() => toggleGroup(group.id)}
                                    className="p-3 text-on-surface-variant/40 hover:text-on-surface hover:bg-white/5 rounded transition-all"
                                >
                                    {expandedGroups.includes(group.id) ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                </button>
                            </div>
                        </div>

                        {/* Services List */}
                        {expandedGroups.includes(group.id) && (
                            <div className="border-t border-white/5 p-8 bg-surface-container/5 animate-in slide-in-from-top-4 duration-500">
                                {group.services.length === 0 ? (
                                    <div className="p-12 text-center border border-white/5 border-dashed rounded bg-surface-container/5">
                                        <p className="font-label-caps text-[10px] text-on-surface-variant/40 uppercase tracking-[0.3em] italic">NULL_PROTOCOL_QUEUE</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                                        {group.services.map((service: any) => (
                                            <div key={service.id} className="glass-panel p-6 border-white/5 hover:border-primary/20 transition-all group/service bg-surface-container/95">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="min-w-0">
                                                        <h5 className="font-display-lg text-[13px] text-on-surface uppercase tracking-tight truncate group-hover/service:text-primary transition-colors">{service.name}</h5>
                                                        <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest mt-2 line-clamp-1 italic opacity-60">{service.description || 'NO_SYNOPSIS_DEFINED'}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover/service:opacity-100 transition-all translate-x-4 group-hover/service:translate-x-0">
                                                        <button
                                                            onClick={() => setEditingService(service)}
                                                            className="p-2 text-on-surface-variant hover:text-primary rounded hover:bg-white/5"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => { if (confirm('EXTERMINATE_SERVICE_PROTOCOL?')) deleteServiceMutation.mutate({ id: service.id }) }}
                                                            className="p-2 text-on-surface-variant hover:text-error rounded hover:bg-white/5"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={12} className="text-primary opacity-60" />
                                                        <span className="font-data-mono text-[10px] text-primary uppercase">{service.responseTimeMinutes}M_RESP</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 size={12} className="text-primary-fixed-dim opacity-60" />
                                                        <span className="font-data-mono text-[10px] text-primary-fixed-dim uppercase">{service.resolutionTimeMinutes}M_RESOL</span>
                                                    </div>
                                                    <span className={`ml-auto font-label-caps text-[8px] uppercase tracking-[0.2em] px-2 py-0.5 rounded border ${
                                                        service.priority === 'CRITICAL' ? 'text-error border-error/20 bg-error/5 animate-pulse' :
                                                        service.priority === 'HIGH' ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' :
                                                        service.priority === 'MEDIUM' ? 'text-primary border-primary/20 bg-primary/5' :
                                                        'text-on-surface-variant border-white/10 bg-white/5'
                                                    }`}>
                                                        {service.priority}_LVL
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal de Grupo */}
            {editingGroup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-surface/95 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="glass-panel w-full max-w-lg border-white/10 p-10 shadow-2xl bg-surface-container/95">
                        <div className="flex items-center gap-6 mb-10">
                            <div className="p-4 bg-primary/10 text-primary rounded border border-primary/20 shadow-inner">
                                <Database size={24} />
                            </div>
                            <div>
                                <h4 className="font-display-lg text-2xl text-on-surface uppercase tracking-tighter italic">
                                    {editingGroup.id ? 'UPDATE_TAXONOMY_GROUP' : 'INITIALIZE_SERVICE_GROUP'}
                                </h4>
                                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.3em] mt-1">Operational Cluster Definition</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1">CLUSTER_IDENTIFIER</label>
                                <input
                                    className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase h-12 px-4 focus:border-primary transition-all"
                                    value={editingGroup.name}
                                    onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })}
                                    placeholder="INFRASTRUCTURE_CLUSTER"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1 flex items-center gap-2 italic opacity-60">CLUSTER_SYNOPSIS</label>
                                <textarea
                                    className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase min-h-[120px] p-4 rounded resize-none focus:border-primary transition-all"
                                    value={editingGroup.description || ''}
                                    onChange={e => setEditingGroup({ ...editingGroup, description: e.target.value })}
                                    placeholder="Enter functional domain scope description..."
                                />
                            </div>
                        </div>
                        <div className="flex gap-6 mt-12">
                            <button
                                onClick={() => setEditingGroup(null)}
                                className="flex-1 h-14 font-label-caps text-xs text-on-surface-variant hover:text-on-surface uppercase tracking-widest transition-all border border-white/5 rounded hover:bg-white/5"
                            >
                                ABORT_MOD
                            </button>
                            <button
                                onClick={() => {
                                    setIsSaving(true);
                                    upsertGroupMutation.mutate(editingGroup);
                                }}
                                disabled={isSaving || !editingGroup.name}
                                className="cyber-button flex-[2] h-14 !bg-primary text-on-primary-container border-primary flex items-center justify-center gap-4"
                            >
                                {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                COMMIT_CLUSTER_SYNC
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Serviço */}
            {editingService && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-surface/95 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="glass-panel w-full max-w-2xl border-white/10 p-10 shadow-2xl bg-surface-container/95">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-primary-fixed-dim/10 text-primary-fixed-dim rounded border border-primary-fixed-dim/20 shadow-inner">
                                    <Settings2 size={24} />
                                </div>
                                <div>
                                    <h4 className="font-display-lg text-2xl text-on-surface uppercase tracking-tighter italic">
                                        {editingService.id ? 'UPDATE_SERVICE_PROTOCOL' : 'INITIALIZE_PROTOCOL_NODE'}
                                    </h4>
                                    <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.3em] mt-1">SLA Threshold & Behavior Specification</p>
                                </div>
                            </div>
                            <button onClick={() => setEditingService(null)} className="p-4 hover:bg-white/5 rounded text-on-surface-variant transition-all"><X size={24} /></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1">PROTOCOL_IDENTIFIER</label>
                                    <input
                                        className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase h-12 px-4 focus:border-primary"
                                        value={editingService.name}
                                        onChange={e => setEditingService({ ...editingService, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <Shield size={12} className="text-primary" /> BASE_PRIORITY_LEVEL
                                    </label>
                                    <select
                                        className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase h-12 px-4"
                                        value={editingService.priority}
                                        onChange={e => setEditingService({ ...editingService, priority: e.target.value })}
                                    >
                                        <option value="CRITICAL">CRITICAL_NODE</option>
                                        <option value="HIGH">HIGH_PRIORITY</option>
                                        <option value="MEDIUM">STANDARD_PRIO</option>
                                        <option value="LOW">LOW_PRIORITY</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1 italic opacity-60">PROTOCOL_SCOPE</label>
                                    <textarea
                                        className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase min-h-[100px] p-4 rounded resize-none focus:border-primary"
                                        value={editingService.description || ''}
                                        onChange={e => setEditingService({ ...editingService, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="bg-primary/5 p-8 rounded border border-primary/20 space-y-8 relative overflow-hidden">
                                    <div className="absolute -right-8 -top-8 opacity-5 pointer-events-none">
                                        <Clock size={100} className="text-primary" />
                                    </div>
                                    <h5 className="font-label-caps text-[11px] text-primary uppercase tracking-[0.3em] mb-4 flex items-center gap-3 italic">
                                        <Clock size={16} /> SLA_THRESHOLD_MATRIX
                                    </h5>
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="font-label-caps text-[9px] text-on-surface-variant/60 uppercase tracking-widest">RESPONSE_LATENCY</label>
                                                <span className="font-data-mono text-[10px] text-primary">{editingService.responseTimeMinutes}M</span>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="w-full !bg-surface-container-high border-white/10 rounded h-12 px-4 pr-14 font-data-mono text-sm text-primary"
                                                    value={editingService.responseTimeMinutes || ''}
                                                    onChange={e => setEditingService({ ...editingService, responseTimeMinutes: parseInt(e.target.value) || 0 })}
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-caps text-[9px] text-on-surface-variant uppercase">MINS</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="font-label-caps text-[9px] text-on-surface-variant/60 uppercase tracking-widest">RESOLUTION_LATENCY</label>
                                                <span className="font-data-mono text-[10px] text-primary-fixed-dim">{editingService.resolutionTimeMinutes}M</span>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="w-full !bg-surface-container-high border-white/10 rounded h-12 px-4 pr-14 font-data-mono text-sm text-primary-fixed-dim"
                                                    value={editingService.resolutionTimeMinutes || ''}
                                                    onChange={e => setEditingService({ ...editingService, resolutionTimeMinutes: parseInt(e.target.value) || 0 })}
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-caps text-[9px] text-on-surface-variant uppercase">MINS</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="font-label-caps text-[8px] text-on-surface-variant/40 uppercase tracking-widest leading-relaxed pt-4 border-t border-white/5 italic">
                                        * Values define maximum operational cycle time for protocol compliance.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-6 mt-12">
                            <button
                                onClick={() => setEditingService(null)}
                                className="flex-1 h-14 font-label-caps text-xs text-on-surface-variant hover:text-on-surface uppercase tracking-widest transition-all border border-white/5 rounded hover:bg-white/5"
                            >
                                ABORT_INGESTION
                            </button>
                            <button
                                onClick={() => {
                                    setIsSaving(true);
                                    upsertServiceMutation.mutate(editingService);
                                }}
                                disabled={isSaving || !editingService.name}
                                className="cyber-button flex-[2] h-14 !bg-primary text-on-primary-container border-primary flex items-center justify-center gap-4"
                            >
                                {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                COMMIT_PROTOCOL_SYNC
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
