import { useState, useEffect } from 'react';
import { trpc } from '../utils/trpc';
import { Plus, MessageSquare, User, X, ChevronRight, MapPin, Star, CheckCircle2, LayoutGrid, Lightbulb, FileSearch, Filter, Calendar, Clock, Activity, Shield, Database, Send, ArrowRight, Monitor, Terminal } from 'lucide-react';
import { CustomFieldsRenderer } from './CustomFieldsRenderer';
import { useLanguage } from '../context/LanguageContext';

/**
 * TicketManager - Central de Operações de Serviço IronGrid (ITSM).
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
const STATUS_LABELS: any = {
    OPEN: 'OPEN_STATE',
    IN_PROGRESS: 'PROCESSING',
    PENDING: 'PENDING_SYNC',
    COMPLETED: 'RESOLVED_ARCHIVE',
    CANCELLED: 'ABORTED',
    ALL: 'ALL_PROTOCOLS'
};

export function TicketManager() {
    const { t } = useLanguage();
    const [statusFilter, setStatusFilter] = useState<string>('OPEN');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    const [deptFilter, setDeptFilter] = useState<string>('');
    const [techFilter, setTechFilter] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

    trpc.auth.me.useQuery();
    const { data: departments = [] } = (trpc as any).organization.listDepartments.useQuery();
    const { data: users = [] } = (trpc as any).auth.listUsers.useQuery();
    const technicians = users.filter((u: any) => u.role !== 'USER');

    const { data: tickets = [], isLoading, refetch } = (trpc.tickets.list as any).useQuery({
        status: statusFilter === 'ALL' ? undefined : (statusFilter as any),
        departmentId: deptFilter || undefined,
        assignedToId: techFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE
    });

    useEffect(() => {
        setPage(1);
    }, [statusFilter, deptFilter, techFilter, startDate, endDate]);

    return (
        <div className="flex flex-col gap-gutter animate-in fade-in duration-500 h-full pt-4">
            <div className="flex flex-col sm:flex-row justify-between items-end gap-6 mb-4">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-primary/10 border border-primary/20 rounded shadow-[0_0_20px_rgba(var(--primary-fixed),0.1)]">
                        <MessageSquare size={32} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="font-display-lg text-4xl text-primary uppercase tracking-tighter">{t('SERVICE_OPERATIONS_MATRIX')}</h1>
                        <p className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-[0.3em] mt-1 italic">{t('NOC_ITSM_SUBTITLE') || 'NOC ITSM & Technical Support Engine'}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    {view !== 'list' && (
                        <button
                            onClick={() => { setView('list'); setSelectedTicketId(null); }}
                            className="h-12 px-6 font-label-caps text-[10px] text-on-surface-variant hover:text-on-surface uppercase tracking-widest transition-all border border-white/5 rounded hover:bg-white/5 flex items-center gap-3"
                        >
                            <X size={16} /> {t('RETURN_TO_MATRIX')}
                        </button>
                    )}
                    {view === 'list' && (
                        <button
                            onClick={() => setView('create')}
                            className="cyber-button px-8 h-12 !bg-primary text-on-primary-container border-primary flex items-center gap-3"
                        >
                            <Plus size={18} /> {t('INITIALIZE_TICKET')}
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            {view === 'list' && (
                <div className="flex flex-wrap items-end gap-6 bg-surface-container/20 p-6 rounded border border-white/5 shadow-inner">
                    <div className="space-y-3">
                        <span className="font-label-caps text-[9px] text-primary uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Activity size={10} /> {t('STATUS_FILTER')}
                        </span>
                        <div className="flex flex-wrap gap-2 bg-surface-container-high/40 p-1 rounded border border-white/5 backdrop-blur-md">
                            {['OPEN', 'IN_PROGRESS', 'PENDING', 'COMPLETED', 'ALL'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-5 py-2 rounded font-label-caps text-[9px] uppercase tracking-widest transition-all ${statusFilter === status
                                        ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(var(--primary-fixed),0.3)]'
                                        : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                                        }`}
                                >
                                    {t(STATUS_LABELS[status])}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-end gap-4 ml-auto">
                        <div className="space-y-2">
                            <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Database size={10} /> {t('DEPT_LOGIC')}
                            </span>
                            <select
                                value={deptFilter}
                                onChange={(e) => setDeptFilter(e.target.value)}
                                className="!bg-surface-container-high border-white/5 font-data-mono text-[10px] uppercase h-10 px-4 rounded"
                            >
                                <option value="">{t('ALL_DEPARTMENTS')}</option>
                                {departments.map((d: any) => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest ml-1 flex items-center gap-2">
                                <User size={10} /> {t('TECH_OPERATOR')}
                            </span>
                            <select
                                value={techFilter}
                                onChange={(e) => setTechFilter(e.target.value)}
                                className="!bg-surface-container-high border-white/5 font-data-mono text-[10px] uppercase h-10 px-4 rounded"
                            >
                                <option value="">{t('ALL_OPERATORS')}</option>
                                {technicians.map((u: any) => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Calendar size={10} /> {t('TIME_WINDOW')}
                            </span>
                            <div className="flex items-center gap-3">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="!bg-surface-container-high border-white/5 font-data-mono text-[10px] uppercase h-10 px-3 rounded"
                                />
                                <span className="font-label-caps text-[8px] text-on-surface-variant/40">TO</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="!bg-surface-container-high border-white/5 font-data-mono text-[10px] uppercase h-10 px-3 rounded"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {view === 'list' && (
                <>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-32 glass-panel border-white/5 border-dashed rounded">
                            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(var(--primary-fixed),0.2)]" />
                            <p className="font-label-caps text-xs text-on-surface-variant uppercase tracking-[0.4em] italic animate-pulse">Synchronizing Service Matrix Data...</p>
                        </div>
                    ) : statusFilter === 'IN_PROGRESS' ? (
                        <div className="space-y-12">
                            {Object.entries(
                                tickets.reduce((acc: any, t: any) => {
                                    const techName = t.assignedTo?.name || 'UNASSIGNED_NODE';
                                    if (!acc[techName]) acc[techName] = [];
                                    acc[techName].push(t);
                                    return acc;
                                }, {})
                            ).map(([techName, techTickets]: [string, any]) => (
                                <div key={techName} className="space-y-6">
                                    <div className="flex items-center gap-6 border-b border-white/5 pb-4 px-2">
                                        <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                                            <User size={24} className="text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-display-lg text-lg text-on-surface uppercase tracking-tighter italic">@{techName}</h3>
                                            <p className="font-label-caps text-[9px] text-primary uppercase tracking-[0.3em]">{techTickets.length} ACTIVE_ENGAGEMENTS</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {techTickets.map((ticket: any) => (
                                            <TicketCard
                                                key={ticket.id}
                                                ticket={ticket}
                                                onClick={() => {
                                                    setSelectedTicketId(ticket.id);
                                                    setView('detail');
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {tickets.length === 0 && <EmptyState />}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {/* Matrix Headers */}
                            <div className="grid grid-cols-[1fr_1.8fr_1fr_1fr_1fr_1.2fr] gap-4 px-8 py-3 font-label-caps text-[9px] text-on-surface-variant uppercase tracking-[0.3em] border-b border-white/5 bg-surface-container/10 rounded-t mb-2">
                                <div>{t('CORE_DEPT')}</div>
                                <div>{t('SERVICE_PROTOCOL_IDENTIFIER')}</div>
                                <div className="text-center">{t('PRIORITY_STATE')}</div>
                                <div className="text-center">{t('UPTIME')}</div>
                                <div className="text-center">{t('INGESTION_TIME')}</div>
                                <div className="text-right">{t('TECH_OPERATOR')}</div>
                            </div>

                            {tickets.map((ticket: any) => (
                                <TicketCard
                                    key={ticket.id}
                                    ticket={ticket}
                                    onClick={() => {
                                        setSelectedTicketId(ticket.id);
                                        setView('detail');
                                    }}
                                />
                            ))}
                            {tickets.length === 0 && <EmptyState />}

                            {/* Pagination */}
                            {tickets.length > 0 && (
                                <div className="flex items-center justify-between mt-8 p-8 glass-panel border-white/5 bg-surface-container/95">
                                    <span className="font-data-mono text-[10px] text-on-surface-variant uppercase tracking-widest italic">{t('MATRIX_PAGE')}: {page}</span>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-6 py-3 font-label-caps text-[10px] text-on-surface uppercase tracking-widest border border-white/5 rounded hover:bg-white/5 disabled:opacity-20 transition-all"
                                        >
                                            {t('PREVIOUS_SLICE')}
                                        </button>
                                        <button
                                            onClick={() => setPage(p => p + 1)}
                                            disabled={tickets.length < PAGE_SIZE}
                                            className="px-6 py-3 font-label-caps text-[10px] text-on-surface uppercase tracking-widest border border-white/5 rounded hover:bg-white/5 disabled:opacity-20 transition-all"
                                        >
                                            {t('NEXT_BUFFER')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {view === 'create' && (
                <CreateTicketModal
                    onClose={() => {
                        setView('list');
                        refetch();
                    }}
                />
            )}

            {view === 'detail' && selectedTicketId && (
                <TicketDetailView
                    ticketId={selectedTicketId}
                    onClose={() => {
                        setSelectedTicketId(null);
                        setView('list');
                        refetch();
                    }}
                />
            )}
        </div>
    );
}

function EmptyState() {
    const { t } = useLanguage();
    return (
        <div className="flex flex-col items-center justify-center p-32 glass-panel border-white/5 border-dashed rounded bg-surface-container/5 group">
            <div className="p-10 bg-surface-container-high/40 rounded-full mb-8 shadow-inner border border-white/5 group-hover:border-primary/20 transition-all group-hover:scale-110">
                <MessageSquare size={64} className="text-on-surface-variant/20" />
            </div>
            <h3 className="font-display-lg text-2xl text-on-surface/50 uppercase tracking-tighter italic">{t('PROTOCOL_QUEUE_EMPTY')}</h3>
            <p className="font-label-caps text-[11px] text-on-surface-variant/40 uppercase tracking-[0.2em] mt-3">{t('ALL_SERVICE_UNITS_SYNCED') || 'All service units are currently synchronized.'}</p>
        </div>
    );
}

function TicketCard({ ticket, onClick }: { ticket: any, onClick: () => void }) {
    const calculateDuration = (start: string | Date, end: string | Date | null = new Date()) => {
        const startTime = new Date(start).getTime();
        const endTime = end ? new Date(end).getTime() : new Date().getTime();
        const diffMs = endTime - startTime;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 24) return `${Math.floor(hours / 24)}D ${hours % 24}H`;
        return `${hours}H ${minutes}M`;
    };

    const openTime = calculateDuration(ticket.createdAt, ticket.resolvedAt || ticket.closedAt);
    const processingTime = ticket.assignedAt
        ? calculateDuration(ticket.assignedAt, ticket.resolvedAt || ticket.closedAt)
        : 'PENDING';

    return (
        <div
            onClick={onClick}
            className={`glass-panel px-8 py-4 border-white/5 hover:border-primary/40 cursor-pointer transition-all hover:bg-surface-container/95 group relative overflow-hidden grid grid-cols-[1fr_1.8fr_1fr_1fr_1fr_1.2fr] gap-4 items-center ${ticket.isCritical ? 'border-error/40 bg-error/5 shadow-[inset_0_0_20px_rgba(var(--error),0.05)]' : ''}`}
        >
            {ticket.isCritical && (
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-error animate-pulse shadow-[0_0_10px_rgba(var(--error),0.5)]" />
            )}

            {/* Dept */}
            <div className="min-w-0">
                <div className="font-label-caps text-[9px] text-primary uppercase tracking-widest truncate group-hover:text-on-surface transition-colors">
                    {ticket.device?.departmentRef?.name || 'GLOBAL_ROOT'}
                </div>
                <div className="font-data-mono text-[8px] text-on-surface-variant/60 uppercase truncate italic">
                    {ticket.device?.name || 'VIRTUAL_NODE'}
                </div>
            </div>

            {/* Title */}
            <div className="min-w-0">
                <div className="font-label-caps text-[8px] text-on-surface-variant uppercase tracking-widest mb-1 truncate">
                    {ticket.serviceType?.name || 'GENERAL_SUPPORT'}
                </div>
                <h3 className="font-display-lg text-[13px] text-on-surface uppercase italic tracking-tight truncate group-hover:text-primary transition-colors">
                    {ticket.title}
                </h3>
            </div>

            {/* Badges */}
            <div className="flex flex-col gap-1.5 items-center">
                <PriorityBadge priority={ticket.priority} />
                <StatusBadge status={ticket.status} />
            </div>

            {/* Uptime */}
            <div className="flex flex-col items-center">
                <span className="font-data-mono text-[11px] text-on-surface uppercase tracking-tighter">
                    {openTime}
                </span>
                <span className="font-label-caps text-[8px] text-on-surface-variant/40 uppercase tracking-widest">UPTIME</span>
            </div>

            {/* Sync Time */}
            <div className="flex flex-col items-center">
                <span className={`font-data-mono text-[11px] uppercase tracking-tighter ${ticket.assignedAt ? 'text-primary' : 'text-on-surface-variant/40'}`}>
                    {processingTime}
                </span>
                <span className="font-label-caps text-[8px] text-on-surface-variant/40 uppercase tracking-widest">PROC_TIME</span>
            </div>

            {/* Tech */}
            <div className="flex items-center justify-end gap-3 min-w-0">
                <div className="min-w-0 text-right">
                    <div className="font-display-lg text-[11px] text-on-surface uppercase tracking-tighter truncate">
                        @{ticket.assignedTo?.name || 'UNASSIGNED'}
                    </div>
                    <div className="font-data-mono text-[8px] text-on-surface-variant/60 uppercase tracking-widest truncate">
                        REQ: @{ticket.requesterId}
                    </div>
                </div>
                <div className="w-10 h-10 rounded bg-surface-container-high border border-white/5 flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors">
                    <User size={18} className="text-on-surface-variant/60 group-hover:text-primary transition-colors" />
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const labels: any = {
        OPEN: 'OPEN',
        IN_PROGRESS: 'PROCESSING',
        PENDING: 'PENDING',
        RESOLVED: 'RESOLVED',
        CLOSED: 'ARCHIVED'
    };
    const styles: any = {
        OPEN: 'bg-primary/10 text-primary border-primary/20',
        IN_PROGRESS: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        PENDING: 'bg-white/5 text-on-surface-variant border-white/10',
        RESOLVED: 'bg-primary-fixed-dim/10 text-primary-fixed-dim border-primary-fixed-dim/20',
        CLOSED: 'bg-white/5 text-on-surface-variant/40 border-white/5',
    };
    return (
        <span className={`px-2 py-0.5 rounded font-label-caps text-[8px] uppercase tracking-[0.2em] border ${styles[status]}`}>
            {labels[status]}
        </span>
    );
}

function PriorityBadge({ priority }: { priority: string }) {
    const labels: any = {
        LOW: 'LOW_PRIO',
        MEDIUM: 'STANDARD',
        HIGH: 'HIGH_PRIO',
        CRITICAL: 'CRITICAL_NODE'
    };
    const styles: any = {
        LOW: 'text-on-surface-variant/60',
        MEDIUM: 'text-primary-fixed-dim',
        HIGH: 'text-amber-500',
        CRITICAL: 'text-error animate-pulse font-black',
    };
    return (
        <span className={`font-label-caps text-[8px] uppercase tracking-[0.2em] ${styles[priority]}`}>
            {labels[priority]}
        </span>
    );
}

function CreateTicketModal({ onClose }: { onClose: () => void }) {
    const { data: locations = [] } = (trpc as any).organization.listLocations.useQuery();
    const { data: depts = [] } = (trpc as any).organization.listDepartments.useQuery();
    const { data: devices = [] } = trpc.scan.getDevices.useQuery({});
    const { data: serviceGroups = [] } = (trpc as any).serviceTypes.listGroups.useQuery();

    const [locationId, setLocationId] = useState('');
    const [deptId, setDeptId] = useState('');
    const [deviceSearch, setDeviceSearch] = useState('');
    const [isDeviceListOpen, setIsDeviceListOpen] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<any>(null);

    const [form, setForm] = useState({
        title: '',
        description: '',
        impact: 'MEDIUM',
        urgency: 'MEDIUM',
        category: 'INCIDENT',
        deviceId: '',
        serviceTypeId: '',
    });

    const [customFields, setCustomFields] = useState<any[]>([]);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            const searchText = `${form.title} ${form.description}`.trim();
            if (searchText.length > 3) setDebouncedSearch(searchText);
            else setDebouncedSearch('');
        }, 800);
        return () => clearTimeout(timer);
    }, [form.title, form.description]);

    const { data: suggestedArticles = [] } = (trpc as any).knowledge.listArticles.useQuery(
        { search: debouncedSearch },
        { enabled: debouncedSearch.length > 3 }
    );

    const createTicket = trpc.tickets.create.useMutation({
        onSuccess: () => {
            onClose();
        }
    });

    const filteredDepts = depts.filter((d: any) => !locationId || d.locationId === locationId);
    const searchedDevices = devices.filter((d: any) => {
        const matchesTerm = !deviceSearch || d.name?.toLowerCase().includes(deviceSearch.toLowerCase()) || d.ip?.includes(deviceSearch);
        if (!matchesTerm) return false;
        if (deptId) return d.departmentId === deptId;
        if (locationId) return d.locationId === locationId;
        return true;
    });

    const handleSelectDevice = (device: any) => {
        setForm({ ...form, deviceId: device.id });
        setDeviceSearch(device.name || device.ip);
        setIsDeviceListOpen(false);
        if (device.location?.id) setLocationId(device.location.id);
        if (device.departmentRef?.id) setDeptId(device.departmentRef.id);
    };

    return (
        <div className="glass-panel border-white/5 rounded w-full shadow-2xl overflow-hidden animate-in fade-in duration-200 flex flex-col flex-1 bg-surface-container/95">
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-surface-container/50">
                <div>
                    <h2 className="font-display-lg text-3xl text-primary uppercase tracking-tighter">NEW_SERVICE_PROTOCOL</h2>
                    <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.3em] mt-1 italic">Initializing Ingestion Sequence</p>
                </div>
                <button onClick={onClose} className="p-4 hover:bg-white/5 rounded text-on-surface-variant transition-all"><X size={24} /></button>
            </div>

            <div className="flex flex-col lg:flex-row overflow-hidden min-h-[70vh]">
                <div className="flex-1 p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Location Matrix */}
                    <div className="bg-surface-container-high/20 p-8 rounded border border-white/5 space-y-8 shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                            <MapPin size={80} className="text-primary" />
                        </div>
                        <h3 className="font-label-caps text-[10px] text-primary uppercase tracking-[0.3em] flex items-center gap-3 italic">
                            <MapPin size={14} /> DEPLOYMENT_ORIGIN_LOCUS
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1">PHYSICAL_UNIT</label>
                                <select
                                    className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase h-12 px-4"
                                    value={locationId}
                                    onChange={(e) => { setLocationId(e.target.value); setDeptId(''); }}
                                >
                                    <option value="">ROOT_UNIT</option>
                                    {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1">LOGICAL_DEPT</label>
                                <select
                                    className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase h-12 px-4"
                                    value={deptId}
                                    onChange={(e) => setDeptId(e.target.value)}
                                >
                                    <option value="">ALL_DOMAINS</option>
                                    {filteredDepts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Service Protocol */}
                    <div className="bg-surface-container-high/20 p-8 rounded border border-white/5 space-y-8 shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                            <LayoutGrid size={80} className="text-primary-fixed" />
                        </div>
                        <h3 className="font-label-caps text-[10px] text-primary-fixed uppercase tracking-[0.3em] flex items-center gap-3 italic">
                            <LayoutGrid size={14} /> SERVICE_TAXONOMY_PROTOCOL
                        </h3>
                        <div className="space-y-3">
                            <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1">PROTOCOL_TYPE</label>
                            <select
                                className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase h-12 px-4"
                                value={form.serviceTypeId}
                                onChange={(e) => {
                                    const serviceId = e.target.value;
                                    const selectedService = serviceGroups.flatMap((g: any) => g.services).find((s: any) => s.id === serviceId);
                                    if (selectedService) {
                                        let impact = 'MEDIUM';
                                        let urgency = 'MEDIUM';
                                        if (selectedService.priority === 'CRITICAL') { impact = 'HIGH'; urgency = 'HIGH'; }
                                        else if (selectedService.priority === 'HIGH') { impact = 'HIGH'; urgency = 'MEDIUM'; }
                                        else if (selectedService.priority === 'LOW') { impact = 'LOW'; urgency = 'LOW'; }
                                        setForm({ ...form, serviceTypeId: serviceId, impact, urgency });
                                    } else {
                                        setForm({ ...form, serviceTypeId: serviceId });
                                    }
                                }}
                            >
                                <option value="">SELECT_SERVICE_MATRIX...</option>
                                {serviceGroups.map((group: any) => (
                                    <optgroup key={group.id} label={group.name} className="bg-surface-container text-primary">
                                        {group.services.map((service: any) => (
                                            <option key={service.id} value={service.id} className="text-on-surface">
                                                {service.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            <p className="font-label-caps text-[9px] text-on-surface-variant/40 italic uppercase tracking-[0.2em] pt-1">
                                * SLA METRICS CALCULATED UPON INGESTION
                            </p>
                        </div>
                    </div>

                    {/* Data Payload */}
                    <div className="space-y-8 p-4">
                        <div className="space-y-3 relative">
                            <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Monitor size={12} className="text-primary" /> TARGET_NODE_IDENTIFIER
                            </label>
                            <div className="relative">
                                <input
                                    className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase h-12 px-4 pr-12"
                                    placeholder="SCAN_FOR_NODE_IP_OR_NAME..."
                                    value={deviceSearch}
                                    onChange={(e) => {
                                        setDeviceSearch(e.target.value);
                                        setIsDeviceListOpen(true);
                                        if (!e.target.value) setForm({ ...form, deviceId: '' });
                                    }}
                                    onFocus={() => setIsDeviceListOpen(true)}
                                />
                                {form.deviceId && (
                                    <button
                                        onClick={() => { setForm({ ...form, deviceId: '' }); setDeviceSearch(''); }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {isDeviceListOpen && searchedDevices.length > 0 && (
                                <div className="absolute z-[70] left-0 right-0 mt-2 bg-surface-container-high border border-white/10 rounded shadow-2xl max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-xl">
                                    {searchedDevices.map((d: any) => (
                                        <button
                                            key={d.id}
                                            className="w-full text-left px-6 py-4 hover:bg-primary/10 border-b border-white/5 last:border-none group transition-all"
                                            onClick={() => handleSelectDevice(d)}
                                        >
                                            <div className="font-display-lg text-sm text-on-surface group-hover:text-primary uppercase tracking-tight">{d.name || d.ip}</div>
                                            <div className="font-data-mono text-[9px] text-on-surface-variant/60 uppercase tracking-[0.2em] mt-1">{d.ip} {d.location?.name ? `// ${d.location.name}` : ''}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Database size={12} className="text-primary" /> INCIDENT_SYNOPSIS
                            </label>
                            <input
                                className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase h-12 px-4"
                                placeholder="BRIEF_ERROR_LOG_SUMMARY..."
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Terminal size={12} className="text-primary" /> FULL_DIAGNOSTIC_DATA
                            </label>
                            <textarea
                                className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase min-h-[150px] p-4 rounded resize-none"
                                placeholder="ENTER_DETAILED_SYMPTOM_LOGS..."
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                        </div>

                        <CustomFieldsRenderer
                            category={form.category}
                            values={customFields}
                            onChange={setCustomFields}
                        />
                    </div>
                </div>

                {/* AI Suggestions Matrix */}
                {suggestedArticles.length > 0 && (
                    <div className="flex-1 lg:min-w-[550px] lg:max-w-[550px] p-10 bg-primary/5 border-l border-white/5 overflow-y-auto max-h-[70vh] custom-scrollbar animate-in slide-in-from-right-4 duration-500">
                        <div className="mb-8 p-6 bg-primary/10 rounded border border-primary/20 shadow-[0_0_30px_rgba(var(--primary-fixed),0.1)] relative overflow-hidden">
                            <div className="absolute -right-8 -top-8 opacity-10 rotate-12">
                                <Lightbulb size={120} className="text-primary" />
                            </div>
                            <div className="flex items-center gap-4 mb-4">
                                <Lightbulb size={24} className="text-primary animate-pulse" />
                                <h3 className="font-display-lg text-xl text-primary uppercase tracking-tighter">INTELLIGENT_KNOWLEDGE_MATCH</h3>
                            </div>
                            <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.2em] leading-relaxed italic">
                                Found high-confidence resolutions in the IronGrid Knowledge Vault that may resolve the incident immediately.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {suggestedArticles.map((article: any, index: number) => (
                                <div
                                    key={article.id}
                                    className="glass-panel p-6 border-white/5 hover:border-primary/40 hover:bg-surface-container/95 transition-all cursor-pointer group relative overflow-hidden"
                                    onClick={() => setSelectedArticle(article)}
                                >
                                    <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight size={18} className="text-primary translate-x-2 group-hover:translate-x-0 transition-transform" />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded">
                                                <Database size={16} className="text-primary" />
                                            </div>
                                            <span className="font-data-mono text-[9px] text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                                                {article.category?.name || 'GENERIC_KB'}
                                            </span>
                                        </div>
                                        <h4 className="font-display-lg text-md text-on-surface uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">
                                            {article.title}
                                        </h4>
                                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                            <span className="font-label-caps text-[9px] text-primary uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">
                                                VIEW_RESOLUTION <ChevronRight size={12} />
                                            </span>
                                            <span className="font-data-mono text-[8px] text-on-surface-variant/40">MATCH_ID: {article.id.slice(0, 8)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 p-6 bg-surface-container/20 border border-white/5 rounded text-center">
                            <p className="font-label-caps text-[10px] text-on-surface-variant/60 uppercase tracking-widest italic">
                                💡 Resolving now saves operator cycle-time.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Ingestion Actions */}
            <div className="p-10 border-t border-white/5 flex gap-8 bg-surface-container/40">
                <button
                    onClick={onClose}
                    className="flex-1 h-14 font-label-caps text-xs text-on-surface-variant hover:text-on-surface uppercase tracking-[0.3em] transition-all border border-transparent hover:border-white/5 rounded"
                >
                    ABORT_INGESTION
                </button>
                <button
                    onClick={() => (createTicket as any).mutate({ ...form, customFields } as any)}
                    disabled={!form.title || createTicket.isLoading}
                    className="cyber-button flex-[2] h-14 !bg-primary text-on-primary-container border-primary flex items-center justify-center gap-4"
                >
                    {createTicket.isLoading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                    EXECUTE_PROTOCOL_INGESTION
                </button>
            </div>

            {/* Article Modal */}
            {selectedArticle && (
                <div className="fixed inset-0 bg-surface/95 backdrop-blur-xl z-[200] flex items-center justify-center p-8">
                    <div className="glass-panel border-white/5 rounded w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                        <div className="p-10 border-b border-white/5 flex justify-between items-start bg-surface-container/50">
                            <div className="flex-1 space-y-4">
                                <h3 className="font-label-caps text-[10px] text-primary uppercase tracking-[0.3em] flex items-center gap-3 italic">
                                    <FileSearch size={16} /> KNOWLEDGE_VAULT_DECRYPTION
                                </h3>
                                <h2 className="font-display-lg text-3xl text-on-surface uppercase tracking-tighter leading-tight">
                                    {selectedArticle.title}
                                </h2>
                            </div>
                            <button onClick={() => setSelectedArticle(null)} className="p-4 hover:bg-white/5 rounded text-on-surface-variant transition-all"><X size={24} /></button>
                        </div>
                        <div className="p-10 overflow-y-auto custom-scrollbar flex-1 prose-invert max-w-none">
                            <div className="font-data-mono text-sm text-on-surface-variant leading-relaxed uppercase tracking-tight whitespace-pre-wrap">
                                {selectedArticle.content || ''}
                            </div>
                        </div>
                        <div className="p-10 border-t border-white/5 bg-surface-container/30 flex flex-col sm:flex-row gap-6">
                            <button
                                onClick={() => { setSelectedArticle(null); onClose(); }}
                                className="cyber-button flex-1 h-14 !bg-primary-fixed text-on-primary-fixed-container border-primary-fixed flex items-center justify-center gap-3"
                            >
                                <CheckCircle2 size={18} /> RESOLVED_VIA_KB
                            </button>
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="flex-1 h-14 font-label-caps text-xs text-on-surface-variant hover:text-on-surface uppercase tracking-widest transition-all border border-white/5 rounded hover:bg-white/5"
                            >
                                CONTINUE_MANUAL_TICKET
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function TicketDetailView({ ticketId, onClose }: { ticketId: string, onClose: () => void }) {
    const utils = trpc.useContext();
    const { data: me } = (trpc.auth as any).me.useQuery();
    const { data: ticket, isLoading, refetch } = trpc.tickets.getById.useQuery({ id: ticketId });
    const { data: users = [] } = (trpc.auth as any).listUsers.useQuery();

    const mutationOptions = { onSuccess: () => refetch() };
    const updateStatus = (trpc.tickets as any).updateStatus.useMutation(mutationOptions);
    const assignTicket = (trpc.tickets as any).assign.useMutation(mutationOptions);
    const rateTicket = (trpc.tickets as any).rateTicket.useMutation({ onSuccess: () => refetch() });
    const addComment = (trpc.tickets as any).addComment.useMutation({
        onSuccess: () => { refetch(); setComment(''); }
    });

    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(0);
    const [ratingComment, setRatingComment] = useState('');
    const [actionCost, setActionCost] = useState('');
    const [actionComment, setActionComment] = useState('');

    if (isLoading || !ticket) return null;

    const isRequester = me?.id === ticket.requesterId;
    const canRate = isRequester && (ticket as any).status === 'RESOLVED' && !(ticket as any).rating;
    const technicians = users.filter((u: any) => ['ADMIN', 'OPERATOR', 'TECNICO'].includes(u.role));

    return (
        <div className="glass-panel border-white/5 rounded w-full shadow-2xl flex flex-col animate-in fade-in duration-500 overflow-hidden flex-1 bg-surface-container/95">
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-surface-container/50 shadow-sm">
                <div className="flex items-center gap-8">
                    <div className="p-4 bg-primary/10 rounded border border-primary/20 shadow-inner">
                        <span className="font-data-mono text-xl text-primary leading-none uppercase tracking-tighter">PROTOCOL_#{ticket.ticketNumber}</span>
                    </div>
                    <h2 className="font-display-lg text-2xl text-on-surface uppercase tracking-tighter italic line-clamp-1">{ticket.title}</h2>
                </div>
                <button onClick={onClose} className="p-4 hover:bg-white/5 rounded text-on-surface-variant transition-all"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                {/* Meta Matrix */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 bg-surface-container/40 p-10 rounded border border-white/5 shadow-inner">
                    <InfoItem label="STATE_REGISTRY" value={<StatusBadge status={ticket.status} />} />
                    <InfoItem label="URGENCY_LEVEL" value={<PriorityBadge priority={ticket.priority} />} />
                    <InfoItem label="DOMAIN_SERVICE" value={
                        (ticket as any).serviceType ? (
                            <div className="space-y-1">
                                <div className="font-label-caps text-[9px] text-on-surface-variant/60 uppercase tracking-widest">{((ticket as any).serviceType as any).group?.name}</div>
                                <div className="font-display-lg text-xs text-primary uppercase tracking-tight">{(ticket as any).serviceType.name}</div>
                            </div>
                        ) : <span className="font-data-mono text-[10px] text-on-surface-variant/40 italic">NULL_CATEGORY</span>
                    } />
                    <InfoItem label="REQUESTER_ID" value={<span className="font-data-mono text-xs text-primary-fixed uppercase tracking-widest italic">@{ticket.requesterId}</span>} />
                    <InfoItem
                        label="OPERATIONAL_NODE"
                        value={
                            (me?.role === 'ADMIN' || (!(ticket as any).assignedToId && me?.role !== 'USER')) ? (
                                <select
                                    onChange={(e) => assignTicket.mutate({ id: ticket.id, userId: e.target.value })}
                                    className="!bg-surface-container-high border-white/10 rounded font-data-mono text-[10px] uppercase h-9 px-3 w-full text-primary"
                                    value={(ticket as any).assignedToId || ""}
                                >
                                    <option value="">ASSIGN_NODE...</option>
                                    {technicians.map((u: any) => (
                                        <option key={u.id} value={u.id} className="bg-surface-container-high">{u.name}</option>
                                    ))}
                                </select>
                            ) : (
                                (ticket as any).assignedToId ? (
                                    <div className="flex items-center gap-2 font-display-lg text-xs text-primary uppercase tracking-tighter">
                                        <User size={14} className="text-primary/60" /> @{(ticket as any).assignedTo?.name || (ticket as any).assignedToId}
                                    </div>
                                ) : (
                                    <span className="font-data-mono text-[10px] text-on-surface-variant/40 italic">UNASSIGNED_STATE</span>
                                )
                            )
                        }
                    />
                </div>

                {/* Description Payload */}
                <div className="space-y-4 relative group">
                    <div className="absolute -left-10 top-0 h-full w-1 bg-primary/20 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
                    <h4 className="font-label-caps text-[10px] text-primary uppercase tracking-[0.3em] flex items-center gap-3 italic">
                        <Terminal size={14} /> DIAGNOSTIC_PAYLOAD_BODY
                    </h4>
                    <div className="glass-panel p-8 border-white/5 text-sm text-on-surface-variant leading-relaxed font-data-mono uppercase tracking-tight italic bg-surface-container/95">
                        {ticket.description || 'NO_PAYLOAD_DATA_PROVIDED.'}
                    </div>
                    <CustomFieldsRenderer
                        category={ticket.category}
                        values={(ticket as any).customValues || []}
                        readOnly
                    />
                </div>

                {/* Rating Handshake */}
                {canRate && (
                    <div className="bg-primary/5 border border-primary/20 rounded p-10 space-y-8 animate-in zoom-in-95 duration-500 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                            <Star size={120} className="text-primary" />
                        </div>
                        <div className="text-center space-y-4">
                            <h4 className="font-display-lg text-2xl text-primary uppercase tracking-tighter italic">EVALUATE_OPERATIONAL_PERFORMANCE</h4>
                            <p className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-[0.2em] leading-relaxed">
                                The assigned node has marked this incident as resolved. Provide satisfaction telemetry to synchronize final closure.
                            </p>
                        </div>
                        <div className="flex justify-center gap-6">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className={`p-2 transition-all transform hover:scale-125 ${rating >= star ? 'text-primary drop-shadow-[0_0_10px_rgba(var(--primary-fixed),0.5)]' : 'text-on-surface-variant/20'}`}
                                >
                                    <Star size={48} fill={rating >= star ? 'currentColor' : 'none'} />
                                </button>
                            ))}
                        </div>
                        <textarea
                            className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase p-6 rounded min-h-[120px] resize-none"
                            placeholder="OPTIONAL_PERFORMANCE_FEEDBACK..."
                            value={ratingComment}
                            onChange={e => setRatingComment(e.target.value)}
                        />
                        <button
                            onClick={() => (rateTicket as any).mutate({ id: ticket.id, rating, comment: ratingComment })}
                            disabled={rating === 0 || rateTicket.isLoading}
                            className="cyber-button w-full h-16 !bg-primary text-on-primary-container border-primary uppercase tracking-[0.3em]"
                        >
                            <CheckCircle2 size={24} /> COMMIT_FINAL_EVALUATION
                        </button>
                    </div>
                )}

                {/* Timeline Stream */}
                <div className="space-y-10">
                    <h4 className="font-label-caps text-[10px] text-primary-fixed uppercase tracking-[0.3em] flex items-center gap-3 italic">
                        <Activity size={14} /> ACTIVITY_HANDSHAKE_TIMELINE
                    </h4>
                    <div className="space-y-12 pl-6 border-l border-white/5 ml-3">
                        {ticket.activities.map((activity: any) => (
                            <div key={activity.id} className="relative group/activity">
                                <div className={`absolute -left-[30px] top-2 w-3.5 h-3.5 rounded border-2 border-surface ${
                                    activity.type === 'TECHNICAL_NOTE' ? 'bg-amber-500 shadow-[0_0_15px_rgba(var(--warning),0.5)]' :
                                    activity.type === 'COMMENT' ? 'bg-primary shadow-[0_0_15px_rgba(var(--primary-fixed),0.5)]' :
                                    'bg-primary-fixed-dim shadow-[0_0_15px_rgba(var(--tertiary-fixed),0.5)]'}`} />
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                        <span className="font-data-mono text-[10px] text-primary bg-primary/10 px-3 py-1 rounded border border-primary/20 uppercase">@{activity.userId}</span>
                                        <span className="font-data-mono text-[9px] text-on-surface-variant uppercase tracking-widest">{new Date(activity.createdAt).toLocaleString()}</span>
                                        {activity.type === 'TECHNICAL_NOTE' && <span className="font-label-caps text-[8px] text-amber-500 bg-amber-500/10 px-3 py-0.5 rounded border border-amber-500/20 italic">TECH_LOG</span>}
                                    </div>
                                    <div className={`font-data-mono text-sm leading-relaxed p-6 rounded border transition-all ${
                                        activity.type === 'TECHNICAL_NOTE' ? 'bg-amber-500/5 border-amber-500/20 text-on-surface italic' : 'bg-surface-container/30 border-white/5 text-on-surface-variant'
                                    }`}>
                                        {activity.message}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Input Stream */}
            <div className="p-10 border-t border-white/5 space-y-8 bg-surface-container/50">
                <div className="relative group">
                    <textarea
                        className="w-full !bg-surface-container-high border-white/10 p-8 pb-20 font-data-mono text-sm text-on-surface uppercase tracking-tight rounded-xl min-h-[180px] resize-none focus:border-primary transition-all shadow-inner"
                        placeholder="INJECT_COMMUNICATION_STREAM_PACKET..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                    <div className="absolute right-6 bottom-6 flex gap-4">
                        {me?.role !== 'USER' && (
                            <button
                                onClick={() => addComment.mutate({ ticketId: ticket.id, message: comment, isTechnical: true })}
                                disabled={!comment || addComment.isLoading}
                                className="h-12 px-6 bg-amber-600/20 hover:bg-amber-600 text-amber-500 hover:text-on-primary-container rounded font-label-caps text-[10px] uppercase tracking-widest transition-all border border-amber-500/20 flex items-center gap-3 shadow-xl shadow-amber-500/5"
                            >
                                <Lightbulb size={16} /> TECHNICAL_NOTE
                            </button>
                        )}
                        <button
                            onClick={() => addComment.mutate({ ticketId: ticket.id, message: comment })}
                            disabled={!comment || addComment.isLoading}
                            className="cyber-button h-12 px-8 !bg-primary text-on-primary-container border-primary flex items-center gap-3"
                        >
                            <Send size={16} /> DISPATCH_COMM
                        </button>
                    </div>
                </div>

                {/* Technician Closure Protocol */}
                {me?.role !== 'USER' && ticket.status === 'IN_PROGRESS' && (
                    <div className="bg-primary-fixed-dim/5 border border-primary-fixed-dim/20 rounded p-10 space-y-10 animate-in slide-in-from-bottom-6 duration-700 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none rotate-45">
                            <CheckCircle2 size={120} className="text-primary-fixed-dim" />
                        </div>
                        <div className="flex items-center gap-6 border-b border-white/5 pb-6">
                            <div className="p-4 bg-primary-fixed-dim/10 rounded border border-primary-fixed-dim/20 shadow-inner">
                                <CheckCircle2 size={28} className="text-primary-fixed-dim" />
                            </div>
                            <div>
                                <h4 className="font-display-lg text-2xl text-on-surface uppercase tracking-tighter italic">FINALIZE_OPERATIONAL_CYCLE</h4>
                                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.3em] mt-1">Registering closure metrics and technical outcomes</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1">OPERATIONAL_COST (BRL)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-data-mono text-xs text-primary-fixed-dim">R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full !bg-surface-container-high border-white/10 rounded pl-10 pr-4 py-4 font-data-mono text-sm text-primary-fixed-dim uppercase"
                                        placeholder="0.00"
                                        value={actionCost}
                                        onChange={e => setActionCost(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1">CYCLE_TIME_USED</label>
                                <input
                                    type="text"
                                    className="w-full !bg-surface-container-high border-white/10 rounded px-4 py-4 font-data-mono text-sm text-on-surface uppercase"
                                    placeholder="EX: 2H 30M"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest ml-1">TECHNICAL_CLOSURE_NOTES</label>
                            <textarea
                                className="w-full !bg-surface-container-high border-white/10 rounded p-6 font-data-mono text-xs uppercase tracking-tight italic min-h-[100px] resize-none"
                                placeholder="ENTER_SOLUTION_LOGS..."
                                value={actionComment}
                                onChange={e => setActionComment(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={() => updateStatus.mutate({
                                id: ticket.id,
                                status: 'RESOLVED',
                                cost: actionCost ? parseFloat(actionCost) : undefined,
                                comment: actionComment || 'Incident marked as RESOLVED by technician.'
                            })}
                            disabled={updateStatus.isLoading}
                            className="cyber-button w-full h-18 !bg-primary-fixed text-on-primary-fixed-container border-primary-fixed uppercase tracking-[0.4em] font-black italic shadow-2xl group"
                        >
                            <CheckCircle2 size={24} className="group-hover:scale-110 transition-transform" />
                            {updateStatus.isLoading ? 'COMMITTING_STATE...' : 'EXECUTE_NODE_CLOSURE'}
                        </button>
                    </div>
                )}

                <div className="flex flex-wrap gap-4 items-center pt-4">
                    {['IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'].filter(s => s !== ticket.status).map(s => (
                        <button
                            key={s}
                            onClick={() => { if (s !== 'RESOLVED') updateStatus.mutate({ id: ticket.id, status: s as any }); }}
                            className={`px-6 py-3 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest border border-white/5 rounded hover:bg-white/5 transition-all shadow-sm ${(s === 'RESOLVED' && me?.role !== 'USER') ? 'hidden' : ''}`}
                        >
                            SET_{STATUS_LABELS[s]}
                        </button>
                    ))}

                    {me?.role === 'ADMIN' && (
                        <div className="relative group/assign ml-auto">
                            <button className="h-10 px-6 bg-primary/10 text-primary border border-primary/20 rounded font-label-caps text-[9px] uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all flex items-center gap-3">
                                <User size={14} /> REASSIGN_NODE
                            </button>
                            <div className="absolute bottom-full right-0 mb-4 hidden group-hover/assign:block z-[100] bg-surface-container-high border border-white/10 rounded shadow-2xl p-4 min-w-[250px] animate-in fade-in slide-in-from-bottom-2 backdrop-blur-xl">
                                <div className="font-label-caps text-[9px] text-on-surface-variant/40 uppercase tracking-[0.2em] mb-4 pb-2 border-b border-white/5 italic">TARGET_OPERATOR_LIST</div>
                                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                                    {technicians.map((u: any) => (
                                        <button
                                            key={u.id}
                                            onClick={() => assignTicket.mutate({ id: ticket.id, userId: u.id })}
                                            className={`w-full text-left px-4 py-3 rounded font-data-mono text-[10px] uppercase transition-all flex items-center justify-between group/item ${ticket.assignedToId === u.id ? 'bg-primary/10 text-primary border border-primary/20' : 'text-on-surface-variant hover:bg-white/5'}`}
                                        >
                                            <span>{u.name}</span>
                                            {ticket.assignedToId === u.id && <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-fixed),0.5)]" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {me?.role === 'ADMIN' && (
                    <div className="p-8 bg-black/20 rounded border border-error/10 shadow-inner">
                        <AdminActions
                            ticket={ticket}
                            onAction={() => {
                                utils.tickets.list.invalidate();
                                onClose();
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

function AdminActions({ ticket, onAction }: { ticket: any, onAction: () => void }) {
    const deleteTicket = (trpc.tickets as any).delete.useMutation({ onSuccess: onAction });
    const extendSLA = (trpc.tickets as any).extendSLA.useMutation({ onSuccess: onAction });
    const togglePause = (trpc.tickets as any).togglePause.useMutation({ onSuccess: onAction });

    const [justification, setJustification] = useState('');
    const [showExtend, setShowExtend] = useState(false);
    const [showPause, setShowPause] = useState(false);
    const [newDeadline, setNewDeadline] = useState('');

    const handleDelete = () => {
        if (confirm('CRITICAL: EXTERMINATE_PROTOCOL_DATA? This action is irreversible.')) {
            deleteTicket.mutate({ id: ticket.id });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4">
                <button
                    onClick={handleDelete}
                    className="px-6 py-3 bg-error/10 text-error hover:bg-error hover:text-on-error rounded font-label-caps text-[9px] uppercase tracking-widest transition-all border border-error/20"
                >
                    PURGE_PROTOCOL
                </button>
                <button
                    onClick={() => { setShowPause(!showPause); setShowExtend(false); setJustification(''); }}
                    className={`px-6 py-3 rounded font-label-caps text-[9px] uppercase tracking-widest transition-all border ${ticket.slaPaused
                        ? 'bg-primary text-on-primary border-primary shadow-[0_0_15px_rgba(var(--primary-fixed),0.3)]'
                        : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-on-primary border-amber-500/20'}`}
                >
                    {ticket.slaPaused ? 'RESUME_CLOCK' : 'SUSPEND_CLOCK'}
                </button>
                <button
                    onClick={() => { setShowExtend(!showExtend); setShowPause(false); setJustification(''); }}
                    className="px-6 py-3 bg-primary/10 text-primary hover:bg-primary hover:text-on-primary rounded font-label-caps text-[9px] uppercase tracking-widest transition-all border border-primary/20"
                >
                    EXTEND_DEADLINE
                </button>
            </div>

            {(showExtend || showPause) && (
                <div className="space-y-6 p-8 bg-surface-container/30 rounded border border-white/5 animate-in slide-in-from-top-4 duration-300">
                    {showExtend && (
                        <div className="space-y-2">
                            <label className="font-label-caps text-[9px] text-on-surface-variant/60 uppercase tracking-widest">NEW_DEADLINE_ISO</label>
                            <input
                                type="datetime-local"
                                className="w-full !bg-surface-container-high border-white/5 rounded h-10 px-4 font-data-mono text-xs text-primary"
                                value={newDeadline}
                                onChange={(e) => setNewDeadline(e.target.value)}
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="font-label-caps text-[9px] text-on-surface-variant/60 uppercase tracking-widest">PROTOCOL_JUSTIFICATION</label>
                        <textarea
                            className="w-full !bg-surface-container-high border-white/5 rounded p-4 font-data-mono text-xs uppercase min-h-[80px] resize-none"
                            placeholder="ENTER_MODIFICATION_LOGS..."
                            value={justification}
                            onChange={(e) => setJustification(e.target.value)}
                        />
                    </div>
                    {showExtend ? (
                        <button
                            onClick={() => extendSLA.mutate({ id: ticket.id, newDeadline: new Date(newDeadline).toISOString(), justification })}
                            disabled={!newDeadline || !justification || extendSLA.isLoading}
                            className="cyber-button w-full h-12 !bg-primary text-on-primary uppercase tracking-widest"
                        >
                            COMMIT_EXTENSION
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                if (justification) {
                                    togglePause.mutate({ id: ticket.id, justification });
                                    setJustification('');
                                    setShowPause(false);
                                }
                            }}
                            disabled={!justification || togglePause.isLoading}
                            className="cyber-button w-full h-12 !bg-amber-600 text-on-primary uppercase tracking-widest"
                        >
                            COMMIT_CLOCK_MOD
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function InfoItem({ label, value }: { label: string, value: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <span className="font-label-caps text-[9px] text-on-surface-variant/40 uppercase font-black tracking-[0.2em]">{label}</span>
            <div className="font-data-mono text-xs text-on-surface uppercase tracking-tight">{value}</div>
        </div>
    );
}

function Loader2({ className }: { className?: string }) {
    return <Clock className={`${className} animate-spin`} size={16} />;
}
