import { trpc } from '../utils/trpc';
import { Network, Activity, Plus, X, Layers, RotateCcw, Trash2, Pencil, Save, AlertTriangle, Loader2, MapPin, Hash, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { IPAMAddressList } from './IPAMAddressList';

/* ─── Modal helpers ──────────────────────────────────────────────── */

function Modal({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 bg-surface/95 backdrop-blur-xl flex items-start justify-center z-50 p-4 pt-10 sm:pt-20 overflow-y-auto">
            <div className="glass-panel border-white/5 w-full max-w-xl p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="font-display-lg text-2xl text-primary uppercase tracking-tighter">{title}</h3>
                    <button onClick={onClose} className="p-2 rounded text-on-surface-variant hover:text-error transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function Field({ label, name, placeholder, defaultValue, required, icon: Icon }: { label: string, name: string, placeholder?: string, defaultValue?: string, required?: boolean, icon?: any }) {
    return (
        <div className="space-y-2">
            <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1">{label}</label>
            <div className="relative">
                {Icon && <Icon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" />}
                <input
                    name={name}
                    required={required}
                    defaultValue={defaultValue}
                    className={`w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase ${Icon ? 'pl-11' : ''}`}
                    placeholder={placeholder}
                />
            </div>
        </div>
    );
}

/* ─── Create/Edit Subnet Modal ───────────────────────────────────── */

function SubnetModal({ editing, onClose, onSuccess }: { editing?: any, onClose: () => void, onSuccess: () => void }) {
    const { t } = useLanguage();
    const { data: locations = [] } = (trpc as any).organization.listLocations.useQuery();
    const createMutation = (trpc as any).ipam.createSubnet.useMutation({ onSuccess });
    const updateMutation = (trpc as any).ipam.updateSubnet.useMutation({ onSuccess });

    const mutation = editing ? updateMutation : createMutation;
    const isLoading = mutation.isPending;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const payload = {
            name: (formData.get('name') as string) || undefined,
            description: (formData.get('description') as string) || undefined,
            vlan: (formData.get('vlan') as string) || undefined,
            locationId: (formData.get('locationId') as string) || undefined,
        };

        if (editing) {
            updateMutation.mutate({ id: editing.id, ...payload });
        } else {
            const subnet = (formData.get('subnet') as string)?.trim();
            if (subnet && !subnet.endsWith('/24')) {
                // In a real app, use a toast here
            }
            createMutation.mutate({
                ...payload,
                subnet: subnet,
            });
        }
    };

    return (
        <Modal title={editing ? t('EDIT_SUBNET') : t('NEW_NETWORK_SECTOR')} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-8">
                <Field label={t('SECTOR_IDENTIFIER')} name="name" placeholder="VLAN_PROD_01" defaultValue={editing?.name} icon={Network} />
                {!editing && (
                    <Field label={t('CIDR_ADDRESS')} name="subnet" placeholder="192.168.1.0/24" required icon={Hash} />
                )}
                <Field label={t('DESCRIPTION')} name="description" placeholder={t('INTERNAL_INFRASTRUCTURE_SEGMENT')} defaultValue={editing?.description} />
                
                <div className="grid grid-cols-2 gap-gutter">
                    <Field label={t('VLAN_TAG')} name="vlan" placeholder="10" defaultValue={editing?.vlan} icon={Layers} />
                    <div className="space-y-2">
                        <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1">{t('LOCATION_CONTEXT')}</label>
                        <select
                            name="locationId"
                            defaultValue={editing?.locationId}
                            className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase h-12"
                        >
                            <option value="">{t('GLOBAL_SECTOR')}</option>
                            {locations.map((loc: any) => (
                                <option key={loc.id} value={loc.id}>{loc.name.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {mutation.isError && (
                    <div className="flex items-center gap-3 p-4 bg-error/10 border border-error/20 rounded font-data-mono text-[10px] text-error uppercase">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        {(mutation.error as any)?.message || t('TRANSACTION_FAILED')}
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-6 border-t border-white/5">
                    <button type="button" onClick={onClose} className="font-label-caps text-[10px] text-on-surface-variant hover:text-on-surface uppercase tracking-widest px-6 transition-all">
                        {t('ABORT')}
                    </button>
                    <button type="submit" disabled={isLoading} className="cyber-button px-10 h-12 !bg-primary text-on-primary-container border-primary flex items-center gap-2">
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {editing ? t('COMMIT_CHANGES') : t('INITIALIZE_SECTOR')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

/* ─── Subnet Card ────────────────────────────────────────────────── */

function SubnetCard({ subnet, onSelect, onEdit, onDelete }: { subnet: any, onSelect: () => void, onEdit: () => void, onDelete: () => void }) {
    const { t } = useLanguage();
    const isCritical = subnet.percent > 85;

    return (
        <div className="glass-panel p-8 border-white/5 hover:border-primary/20 transition-all group relative overflow-hidden">
            <div className={`absolute -top-32 -right-32 w-64 h-64 blur-[100px] rounded-full transition-opacity opacity-0 group-hover:opacity-10 pointer-events-none ${isCritical ? 'bg-error' : 'bg-primary'}`} />

            <div className="flex justify-between items-start mb-8">
                <div className="min-w-0">
                    <h4 className="font-display-lg text-lg text-on-surface uppercase tracking-tighter truncate">{subnet.name || t('UNDEFINED_SECTOR')}</h4>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="font-data-mono text-[10px] text-primary uppercase tracking-widest">{subnet.subnet}</p>
                        {subnet.location && (
                            <span className="font-label-caps text-[8px] bg-white/5 text-on-surface-variant px-2 py-0.5 rounded border border-white/5 uppercase tracking-widest flex items-center gap-1">
                                <MapPin size={8} /> {subnet.location.name.toUpperCase()}
                            </span>
                        )}
                    </div>
                    {subnet.vlan && <p className="font-data-mono text-[9px] text-on-surface-variant/60 uppercase tracking-widest mt-2">{t('VLAN_TAG')}: {subnet.vlan}</p>}
                </div>
                <div className={`font-display-lg text-lg ${isCritical ? 'text-error' : 'text-primary'}`}>
                    {subnet.percent}%
                </div>
            </div>

            <div className="space-y-4">
                <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden p-[1px]">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${isCritical ? 'bg-error' : 'bg-primary'} ${subnet.isScanning ? 'animate-pulse' : ''} shadow-[0_0_10px_rgba(var(--primary-fixed),0.3)]`}
                        style={{ width: `${subnet.percent}%` }}
                    />
                </div>
                <div className="flex justify-between items-center font-data-mono text-[9px] uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                        <div className={`w-1 h-1 rounded-full ${subnet.isScanning ? 'bg-primary animate-pulse' : 'bg-primary'}`} />
                        <span>{subnet.used} {t('IPAM_OCCUPIED')} {subnet.isScanning && `(${t('SYNCING')})`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant/40">
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                        <span>{subnet.total - subnet.used} {t('IPAM_VACANT')}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-8">
                <button
                    onClick={onSelect}
                    className="col-span-2 py-3 bg-white/5 hover:bg-primary hover:text-on-primary-container text-on-surface-variant font-label-caps text-[10px] uppercase tracking-widest transition-all rounded"
                >
                    {t('IPAM_TRAVERSE')}
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="py-3 bg-white/5 hover:bg-white/10 text-on-surface-variant rounded transition-all flex items-center justify-center border border-white/5"
                >
                    <Pencil size={14} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="py-3 bg-white/5 hover:bg-error/20 hover:text-error text-on-surface-variant rounded transition-all flex items-center justify-center border border-white/5"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}

/* ─── Main Dashboard ─────────────────────────────────────────────── */

function IPConflictPanel() {
    const utils = (trpc as any).useUtils();
    const { data: conflicts = [], isLoading } = (trpc as any).ipam.listIPConflicts.useQuery(undefined, {
        refetchInterval: 15000
    });
    const resolveMutation = (trpc as any).alerts.resolveAlert.useMutation({
        onSuccess: () => {
            utils.ipam.listIPConflicts.invalidate();
            utils.dashboard.getTechnicalStats.invalidate();
        }
    });

    const extractIp = (title: string) => title.replace('[IPAM] Conflito de IP detectado:', '').trim();

    if (isLoading) {
        return (
            <div className="flex items-center gap-4 text-on-surface-variant font-label-caps text-[11px] uppercase tracking-[0.3em] py-10">
                <Loader2 size={18} className="animate-spin text-primary" /> Sincronizando conflitos IP-MAC
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {conflicts.length === 0 ? (
                <div className="border border-white/5 bg-surface-container/30 rounded p-12 text-center">
                    <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="text-primary" size={30} />
                    </div>
                    <h3 className="font-display-lg text-2xl text-on-surface uppercase tracking-tighter">Nenhum conflito ativo</h3>
                    <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.25em] mt-2">
                        O IPAM não possui alertas ativos de IP duplicado.
                    </p>
                </div>
            ) : conflicts.map((conflict: any) => (
                <div key={conflict.id} className="border border-error/20 bg-error/5 rounded p-6 flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="w-14 h-14 rounded bg-error/10 border border-error/20 flex items-center justify-center shrink-0">
                        <ShieldAlert className="text-error" size={26} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <h3 className="font-display-lg text-2xl text-error uppercase tracking-tighter">{extractIp(conflict.title)}</h3>
                            <span className="font-label-caps text-[8px] bg-error/10 text-error px-3 py-1 rounded uppercase tracking-[0.2em] border border-error/20">
                                conflito ativo
                            </span>
                        </div>
                        <pre className="whitespace-pre-wrap font-data-mono text-[11px] leading-relaxed text-on-surface-variant uppercase bg-black/10 border border-white/5 rounded p-4 overflow-x-auto">
                            {conflict.message}
                        </pre>
                        {conflict.device && (
                            <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mt-3">
                                Inventário: {conflict.device.name} / {conflict.device.ipAddress}
                                {conflict.device.location?.name ? ` / ${conflict.device.location.name}` : ''}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => resolveMutation.mutate({ id: conflict.id })}
                        disabled={resolveMutation.isPending}
                        className="cyber-button h-12 px-6 !bg-surface-container border-white/10 text-on-surface flex items-center justify-center gap-2 font-label-caps text-[10px] uppercase tracking-widest"
                    >
                        {resolveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Resolver
                    </button>
                </div>
            ))}
        </div>
    );
}

export function IPAMDashboard() {
    const { t } = useLanguage();
    const utils = (trpc as any).useUtils();
    const { data: summary = [], isLoading } = (trpc as any).ipam.getSummary.useQuery(undefined, {
        refetchInterval: (data: any) => data?.some((s: any) => s.isScanning) ? 3000 : false
    });
    const [selectedSubnet, setSelectedSubnet] = useState<any>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [editingSubnet, setEditingSubnet] = useState<any>(null);
    const [deletingSubnet, setDeletingSubnet] = useState<any>(null);
    const [view, setView] = useState<'subnets' | 'conflicts'>('subnets');
    const { data: conflicts = [] } = (trpc as any).ipam.listIPConflicts.useQuery(undefined, {
        refetchInterval: 15000
    });

    const deleteMutation = (trpc as any).ipam.deleteSubnet.useMutation({
        onSuccess: (_data: any, deletedId: string) => {
            setDeletingSubnet(null);
            utils.ipam.getSummary.invalidate();
            if (selectedSubnet?.id === deletedId) setSelectedSubnet(null);
        }
    });

    const scanMutation = (trpc as any).ipam.scanSubnet.useMutation({
        onSuccess: () => {
            utils.ipam.getSummary.invalidate();
        }
    });

    const invalidateSummary = () => {
        utils.ipam.getSummary.invalidate();
        setIsCreating(false);
        setEditingSubnet(null);
    };

    if (isLoading) return (
        <div className="flex items-center gap-4 text-on-surface-variant font-label-caps text-[11px] uppercase tracking-[0.3em] pt-8">
            <Loader2 size={18} className="animate-spin text-primary" /> {t('SYNC_NETWORK_SEGMENTS')}
        </div>
    );

    const currentSubnet = selectedSubnet ? summary.find((s: any) => s.id === selectedSubnet.id) : null;
    const activeSubnet = currentSubnet || selectedSubnet;

    return (
        <div className="space-y-gutter animate-in fade-in duration-500 pt-4">
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-primary/10 border border-primary/20 rounded">
                        <Network size={32} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="font-display-lg text-4xl text-primary uppercase tracking-tighter">{t('IPAM_TRAVERSAL')}</h2>
                        <p className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-[0.3em] mt-1 italic">{t('IPAM_SUBTITLE')}</p>
                    </div>
                </div>
                {selectedSubnet ? (
                    <button
                        onClick={() => setSelectedSubnet(null)}
                        className="font-label-caps text-[10px] text-on-surface-variant hover:text-on-surface uppercase tracking-widest px-8 py-3 bg-white/5 border border-white/5 rounded transition-all flex items-center gap-3"
                    >
                        <X size={14} /> {t('ABORT_VIEW')}
                    </button>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="flex bg-surface-container border border-white/5 rounded p-1">
                            <button
                                onClick={() => setView('subnets')}
                                className={`h-10 px-5 rounded font-label-caps text-[10px] uppercase tracking-widest transition-all ${view === 'subnets' ? 'bg-primary text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}
                            >
                                Redes
                            </button>
                            <button
                                onClick={() => setView('conflicts')}
                                className={`h-10 px-5 rounded font-label-caps text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'conflicts' ? 'bg-error text-on-error-container' : 'text-on-surface-variant hover:text-on-surface'}`}
                            >
                                <ShieldAlert size={13} />
                                Conflitos
                                {conflicts.length > 0 && (
                                    <span className="min-w-5 h-5 px-1 rounded-full bg-error text-on-error-container flex items-center justify-center text-[9px]">
                                        {conflicts.length}
                                    </span>
                                )}
                            </button>
                        </div>
                        {view === 'subnets' && (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="cyber-button px-8 h-12 !bg-primary text-on-primary-container border-primary flex items-center gap-2"
                            >
                                <Plus size={16} /> {t('IPAM_NEW_SECTOR')}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Subnet Grid */}
            {!selectedSubnet && view === 'conflicts' ? (
                <IPConflictPanel />
            ) : !selectedSubnet ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
                    {(summary as any[]).map((subnet: any) => (
                        <SubnetCard
                            key={subnet.id}
                            subnet={subnet}
                            onSelect={() => setSelectedSubnet(subnet)}
                            onEdit={() => setEditingSubnet(subnet)}
                            onDelete={() => setDeletingSubnet(subnet)}
                        />
                    ))}
                    {summary.length === 0 && (
                        <div
                            onClick={() => setIsCreating(true)}
                            className="border-2 border-dashed border-white/5 rounded p-12 flex flex-col items-center justify-center text-center group hover:border-primary/30 transition-all cursor-pointer min-h-[300px] col-span-full bg-surface-container/20"
                        >
                            <div className="p-6 bg-white/5 rounded-full mb-6 group-hover:scale-110 transition-transform border border-white/5">
                                <Plus size={32} className="text-on-surface-variant/40 group-hover:text-primary" />
                            </div>
                            <h4 className="font-display-lg text-xl text-on-surface-variant/60 uppercase tracking-tighter">{t('EMPTY_ADDRESS_SPACE')}</h4>
                            <p className="font-label-caps text-[10px] text-on-surface-variant/40 uppercase tracking-widest mt-2">{t('INITIALIZE_FIRST_SEGMENT')}</p>
                        </div>
                    )}
                </div>
            ) : (
                /* IP Address Detail View */
                <div className="glass-panel p-12 animate-in zoom-in-95 duration-500 border-white/5">
                    <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-10">
                        <div className="flex items-center gap-8">
                            <div className="p-5 bg-primary/10 border border-primary/20 rounded-full">
                                <Layers className={`w-8 h-8 text-primary ${activeSubnet.isScanning ? 'animate-spin' : ''}`} />
                            </div>
                            <div>
                                <h3 className="font-display-lg text-3xl text-on-surface uppercase tracking-tighter">{activeSubnet.name || activeSubnet.subnet}</h3>
                                <div className="flex items-center gap-4 mt-2">
                                    <p className="font-data-mono text-xs text-primary uppercase tracking-widest">{activeSubnet.subnet}</p>
                                    {activeSubnet.isScanning && (
                                        <span className="font-label-caps text-[8px] bg-primary/20 text-primary px-3 py-1 rounded-full font-black uppercase tracking-[0.2em] animate-pulse border border-primary/20">
                                            {t('INGESTION_SYNC_ACTIVE')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-10 items-center">
                            <div className="text-right">
                                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">{t('UTILIZATION_RATIO')}</p>
                                <p className={`font-display-lg text-3xl ${activeSubnet.percent > 85 ? 'text-error' : 'text-primary'}`}>{activeSubnet.percent}%</p>
                            </div>
                            <button
                                onClick={() => scanMutation.mutate(activeSubnet.id)}
                                disabled={scanMutation.isPending || activeSubnet.isScanning}
                                className="cyber-button px-8 h-14 !bg-surface-container border-white/10 flex items-center gap-3 text-on-surface uppercase tracking-widest text-[11px] font-bold"
                            >
                                <RotateCcw size={18} className={(scanMutation.isPending || activeSubnet.isScanning) ? 'animate-spin' : ''} />
                                {(scanMutation.isPending || activeSubnet.isScanning) ? t('SYNCHRONIZING') : t('EXECUTE_SYNC')}
                            </button>
                        </div>
                    </div>

                    <IPAMAddressList subnetId={activeSubnet.id} />
                </div>
            )}

            {/* Create Modal */}
            {isCreating && (
                <SubnetModal
                    onClose={() => setIsCreating(false)}
                    onSuccess={invalidateSummary}
                />
            )}

            {/* Edit Modal */}
            {editingSubnet && (
                <SubnetModal
                    editing={editingSubnet}
                    onClose={() => setEditingSubnet(null)}
                    onSuccess={invalidateSummary}
                />
            )}

            {/* Delete Confirm Modal */}
            {editingSubnet === null && deletingSubnet && (
                <Modal title={t('DELETE_SECTOR')} onClose={() => setDeletingSubnet(null)}>
                    <div className="space-y-8">
                        <div className="flex items-start gap-6 p-6 bg-error/10 border border-error/20 rounded">
                            <AlertTriangle className="w-8 h-8 text-error shrink-0" />
                            <div className="space-y-2">
                                <p className="font-display-lg text-lg text-on-surface uppercase tracking-tighter">{t('PERMANENT_ERASURE_PROTOCOL')}</p>
                                <p className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest leading-relaxed">
                                    {t('PURGE_CONFIRMATION_MSG').replace('{subnet}', deletingSubnet.subnet)}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 pt-6 border-t border-white/5">
                            <button onClick={() => setDeletingSubnet(null)} className="font-label-caps text-[10px] text-on-surface-variant hover:text-on-surface uppercase tracking-widest px-6 transition-all">
                                {t('ABORT')}
                            </button>
                            <button
                                onClick={() => deleteMutation.mutate(deletingSubnet.id)}
                                disabled={deleteMutation.isPending}
                                className="cyber-button px-10 h-12 !bg-error text-on-error-container border-error flex items-center gap-2"
                            >
                                <Trash2 size={16} />
                                {deleteMutation.isPending ? t('PURGING') : t('CONFIRM_PURGE')}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
