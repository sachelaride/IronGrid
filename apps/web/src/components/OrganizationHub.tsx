import { useState } from 'react';
import { trpc } from '../utils/trpc';
import { 
    MapPin, Plus, Trash2, Shield, Globe, Laptop, Server, Wifi, 
    Printer, Save, Edit2, X, Users, Bell, Database, Phone, 
    HardDrive, Camera, Radio, Cloud, Loader2, Info, ChevronRight,
    Search, Network, Building2, Anchor, Layers, Zap, Activity, Cpu, Share2,
    Eye, EyeOff
} from 'lucide-react';
import { UserManager } from './UserManager';
import { AlertSettings } from './AlertSettings';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

import { TopologyVisibilitySettings, GrafanaExportManager } from './TopologySettings';

/**
 * OrganizationHub - Governance of Assets & Organizational Structures.
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
export function OrganizationHub() {
    const { t } = useLanguage();
    return (
        <div className="space-y-gutter animate-in fade-in duration-700">
            {/* Sub-navigation Hub - Now only User Management */}
            <div className="flex flex-wrap bg-surface-container-highest/20 p-2 rounded-2xl border border-white/5 backdrop-blur-3xl gap-2 w-fit mb-8 shadow-inner">
                <TabButton active={true} onClick={() => {}} label={t('OPERATORS_AUTH')} icon={Users} />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <UserManager />
            </motion.div>
        </div>
    );
}

function TabButton({ active, onClick, label, icon: Icon }: any) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-4 px-6 h-12 rounded-xl font-display-lg text-[11px] transition-all uppercase tracking-tighter italic border
                ${active
                    ? 'bg-primary text-black border-transparent shadow-[0_0_30px_rgba(var(--primary-fixed),0.3)] font-black'
                    : 'text-on-surface-variant/90 border-transparent hover:bg-white/5 hover:text-on-surface'}
            `}
        >
            <Icon size={18} className={active ? 'text-black' : 'opacity-40'} />
            {label}
        </button>
    );
}

// --- GESTOR DE ATIVOS (NET ASSETS) ---
export function AssetManager() {
    const { t } = useLanguage();
    const utils = trpc.useContext();
    const { data: depts = [] } = (trpc as any).organization.listDepartments.useQuery();
    const { data: locations = [] } = (trpc as any).organization.listLocations.useQuery();
    const { data: users = [] } = (trpc as any).auth.listUsers.useQuery();

    const [name, setName] = useState('');
    const [ip, setIp] = useState('');
    const [type, setType] = useState('SERVER');
    const [deptId, setDeptId] = useState('');
    const [locId, setLocId] = useState('');
    const [userId, setUserId] = useState('');

    const createMutation = (trpc as any).organization.createDevice.useMutation({
        onSuccess: () => {
            ((utils as any).scan as any).getDevices.invalidate();
            setName(''); setIp(''); setType('SERVER');
            setDeptId(''); setLocId(''); setUserId('');
        }
    });

    const DEVICE_TYPES = [
        { value: 'SERVER', label: 'Server', icon: Server },
        { value: 'ROUTER', label: 'Router', icon: Globe },
        { value: 'SWITCH', label: 'Switch', icon: Wifi },
        { value: 'FIREWALL', label: 'Firewall', icon: Shield },
        { value: 'INTERNET', label: 'Cloud / Internet', icon: Cloud },
        { value: 'DATABASE', label: 'Database', icon: Database },
        { value: 'VOIP', label: 'VoIP', icon: Phone },
        { value: 'NAS', label: 'NAS / Storage', icon: HardDrive },
        { value: 'CAMERA', label: 'CCTV Camera', icon: Camera },
        { value: 'ACCESS_POINT', label: 'Access Point', icon: Radio },
        { value: 'PRINTER', label: 'Printer', icon: Printer },
        { value: 'WORKSTATION', label: 'Workstation', icon: Laptop },
        { value: 'OTHER', label: 'Other', icon: Shield },
    ];

    return (
        <div className="glass-panel p-12 border-white/5 bg-surface-container/95 backdrop-blur-none relative overflow-hidden group shadow-[0_40px_80px_rgba(0,0,0,0.5)]">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                <Database size={240} className="text-primary" />
            </div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            <div className="flex flex-col gap-4 mb-16 ml-2 relative z-10">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-center relative shadow-[0_0_30px_rgba(var(--primary-fixed),0.1)]">
                        <div className="absolute inset-0 bg-primary/5 animate-pulse rounded-2xl" />
                        <Cpu className="text-primary relative z-10" size={32} />
                    </div>
                    <div>
                        <h3 className="font-display-lg text-3xl text-on-surface uppercase tracking-tighter italic leading-none">{t('NODE_INGESTION_PROTOCOL')}</h3>
                        <p className="font-label-caps text-[10px] text-primary/80 uppercase tracking-[0.4em] italic font-black mt-2">{t('NODE_INGESTION_SUBTITLE') || 'Manual Asset Registration & Operational Assignment'}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-16 mb-16 relative z-10">
                <div className="space-y-12">
                    <div className="space-y-4">
                        <label className="font-label-caps text-[10px] text-on-surface-variant/80 uppercase tracking-[0.3em] ml-1 italic font-black">{t('NODE_IDENTIFIER')}</label>
                        <input 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="w-full h-16 bg-surface-container-highest/60 border-white/5 font-data-mono text-xs uppercase px-6 focus:border-primary transition-all rounded-xl shadow-inner" 
                            placeholder="CORE_STORAGE_NODE_01" 
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="font-label-caps text-[10px] text-on-surface-variant/80 uppercase tracking-[0.3em] ml-1 italic font-black">{t('NETWORK_ENDPOINT_IPV4')}</label>
                        <input 
                            value={ip} 
                            onChange={e => setIp(e.target.value)} 
                            className="w-full h-16 bg-surface-container-highest/60 border-white/5 font-data-mono text-xs uppercase px-6 focus:border-primary transition-all rounded-xl shadow-inner" 
                            placeholder="10.0.4.15" 
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="font-label-caps text-[10px] text-on-surface-variant/80 uppercase tracking-[0.3em] ml-1 italic font-black">{t('EQUIPMENT_TAXONOMY')}</label>
                        <select 
                            value={type} 
                            onChange={e => setType(e.target.value)} 
                            className="w-full h-16 bg-surface-container-highest/60 border-white/5 font-data-mono text-xs uppercase px-6 focus:border-primary transition-all rounded-xl shadow-inner appearance-none cursor-pointer"
                        >
                            {DEVICE_TYPES.map(t_type => (
                                <option key={t_type.value} value={t_type.value}>{t_type.label.toUpperCase()}_CLASS</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="p-12 bg-surface-container-highest/40 rounded-3xl border border-white/5 space-y-12 relative overflow-hidden group/context">
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-primary/5 to-transparent pointer-events-none opacity-0 group-hover/context:opacity-100 transition-opacity" />
                    
                    <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                        <Anchor size={20} className="text-primary/60" />
                        <h4 className="font-display-lg text-lg text-on-surface uppercase tracking-tight italic">{t('OPERATIONAL_CONTEXT')}</h4>
                    </div>

                    <div className="space-y-10">
                        <div className="space-y-4">
                            <label className="font-label-caps text-[10px] text-on-surface-variant/80 uppercase tracking-[0.3em] ml-1 italic font-black">{t('DEPLOYMENT_SITE')}</label>
                            <select 
                                value={locId} 
                                onChange={e => setLocId(e.target.value)} 
                                className="w-full h-16 bg-surface-container-highest/60 border-white/5 font-data-mono text-[11px] uppercase px-6 rounded-xl focus:border-primary transition-all shadow-inner appearance-none cursor-pointer"
                            >
                                <option value="">{t('UNCATEGORIZED_SITE')}</option>
                                {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name.toUpperCase()}</option>)}
                            </select>
                        </div>
                        <div className="space-y-4">
                            <label className="font-label-caps text-[10px] text-on-surface-variant/80 uppercase tracking-[0.3em] ml-1 italic font-black">{t('OPERATIONAL_UNIT_DEPT')}</label>
                            <select 
                                value={deptId} 
                                onChange={e => setDeptId(e.target.value)} 
                                className="w-full h-16 bg-surface-container-highest/60 border-white/5 font-data-mono text-[11px] uppercase px-6 rounded-xl focus:border-primary transition-all shadow-inner appearance-none cursor-pointer"
                            >
                                <option value="">{t('UNCATEGORIZED_UNIT')}</option>
                                {depts.map((d: any) => <option key={d.id} value={d.id}>{d.name.toUpperCase()}</option>)}
                            </select>
                        </div>
                        <div className="space-y-4">
                            <label className="font-label-caps text-[10px] text-on-surface-variant/80 uppercase tracking-[0.3em] ml-1 italic font-black">{t('ASSIGNED_SUPERVISOR')}</label>
                            <select 
                                value={userId} 
                                onChange={e => setUserId(e.target.value)} 
                                className="w-full h-16 bg-surface-container-highest/60 border-white/5 font-data-mono text-[11px] uppercase px-6 rounded-xl focus:border-primary transition-all shadow-inner appearance-none cursor-pointer"
                            >
                                <option value="">{t('UNASSIGNED_OPERATOR')}</option>
                                {users.map((u: any) => <option key={u.id} value={u.id}>{u.name.toUpperCase()}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={() => createMutation.mutate({
                    name, ipAddress: ip, type: type as any,
                    departmentId: deptId || undefined,
                    locationId: locId || undefined,
                    userId: userId || undefined
                })}
                disabled={!name || !ip || createMutation.isPending}
                className="cyber-button w-full h-18 flex items-center justify-center gap-6 !bg-primary text-black border-transparent shadow-[0_20px_50px_rgba(var(--primary-fixed),0.2)] relative z-10 font-display-lg text-xl uppercase italic tracking-tighter"
            >
                {createMutation.isPending ? <Loader2 size={28} className="animate-spin" /> : <><Zap size={28} /> {t('COMMIT_ASSET_TO_CENTRAL_INVENTORY')}</>}
            </button>
        </div>
    );
}

// --- GESTOR DE HIERARQUIA ORGANIZACIONAL (Combined View) ---
export function OrgHierarchyManager() {
    const { t } = useLanguage();
    const [view, setView] = useState<'locations' | 'departments'>('locations');

    return (
        <div className="space-y-gutter">
            <div className="flex gap-12 border-b border-white/5 pb-4 ml-6">
                <button 
                    onClick={() => setView('locations')} 
                    className={`font-display-lg text-sm uppercase tracking-tight transition-all relative pb-4 italic ${view === 'locations' ? 'text-primary font-black' : 'text-on-surface-variant/90 hover:text-on-surface'}`}
                >
                    {t('SITES_LOCATIONS')}
                    {view === 'locations' && <motion.div layoutId="org-tab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary-fixed),0.8)]" />}
                </button>
                <button 
                    onClick={() => setView('departments')} 
                    className={`font-display-lg text-sm uppercase tracking-tight transition-all relative pb-4 italic ${view === 'departments' ? 'text-primary font-black' : 'text-on-surface-variant/90 hover:text-on-surface'}`}
                >
                    {t('OPERATIONAL_UNITS_DEPT')}
                    {view === 'departments' && <motion.div layoutId="org-tab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary-fixed),0.8)]" />}
                </button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div 
                    key={view}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                >
                    {view === 'locations' && <LocationManager />}
                    {view === 'departments' && <DepartmentManager />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// --- GESTOR DE DEPARTAMENTOS ---
function DepartmentManager() {
    const { t } = useLanguage();
    const utils = trpc.useContext();
    const { data: depts = [] } = (trpc as any).organization.listDepartments.useQuery();
    const { data: locations = [] } = (trpc as any).organization.listLocations.useQuery();

    const [name, setName] = useState('');
    const [locId, setLocId] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const createMutation = (trpc as any).organization.createDepartment.useMutation({
        onSuccess: () => {
            ((utils as any).organization as any).listDepartments.invalidate();
            setName(''); setLocId('');
        }
    });

    const updateMutation = (trpc as any).organization.updateDepartment.useMutation({
        onSuccess: () => {
            ((utils as any).organization as any).listDepartments.invalidate();
            setName(''); setLocId(''); setEditingId(null);
        }
    });

    const deleteMutation = (trpc as any).organization.deleteDepartment.useMutation({
        onSuccess: () => ((utils as any).organization as any).listDepartments.invalidate()
    });

    const startEdit = (dept: any) => {
        setEditingId(dept.id);
        setName(dept.name);
        setLocId(dept.locationId || '');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setName('');
        setLocId('');
    };

    const handleSave = () => {
        if (editingId) {
            updateMutation.mutate({ id: editingId, name, locationId: locId || undefined });
        } else {
            createMutation.mutate({ name, locationId: locId || undefined });
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-panel p-10 border-white/5 bg-surface-container/95 backdrop-blur-none h-fit relative shadow-[0_30px_60px_rgba(0,0,0,0.4)]"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <h3 className="font-display-lg text-2xl text-on-surface uppercase tracking-tighter mb-12 italic leading-none">
                    {editingId ? t('UPDATE_OPERATIONAL_UNIT') : t('INITIALIZE_OPERATIONAL_UNIT')}
                </h3>
                <div className="space-y-10">
                    <div className="space-y-4">
                        <label className="font-label-caps text-[10px] text-on-surface-variant/40 uppercase tracking-[0.3em] ml-1 italic font-black">UNIT_IDENTIFIER</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full h-14 bg-surface-container-highest/60 border-white/5 font-data-mono text-xs uppercase px-6 focus:border-primary transition-all rounded-xl shadow-inner" placeholder="ENGINEERING_CLUSTER_01" />
                    </div>
                    <div className="space-y-4">
                        <label className="font-label-caps text-[10px] text-on-surface-variant/40 uppercase tracking-[0.3em] ml-1 italic font-black">{t('SITE_AFFILIATION_MAP')}</label>
                        <select value={locId} onChange={e => setLocId(e.target.value)} className="w-full h-14 bg-surface-container-highest/60 border-white/5 font-data-mono text-[11px] uppercase px-6 rounded-xl shadow-inner appearance-none cursor-pointer focus:border-primary transition-all">
                            <option value="">{t('UNCATEGORIZED_SITE_AFFILIATION') || 'UNCATEGORIZED_SITE_AFFILIATION'}</option>
                            {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name.toUpperCase()}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-4 pt-8">
                        <button
                            onClick={handleSave}
                            disabled={!name || createMutation.isPending || updateMutation.isPending}
                            className="cyber-button flex-1 h-16 flex items-center justify-center gap-4 !bg-primary text-black border-transparent shadow-xl font-display-lg text-lg uppercase italic tracking-tighter"
                        >
                            <Zap size={20} /> {editingId ? t('COMMIT_CHANGES') : t('INITIALIZE_UNIT')}
                        </button>
                        {editingId && (
                            <button onClick={cancelEdit} className="w-16 h-16 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all border border-white/5 rounded-xl hover:bg-white/5">
                                <X size={28} />
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
            <div className="space-y-4 overflow-y-auto max-h-[700px] pr-4 custom-scrollbar">
                {depts.map((d: any, idx: number) => (
                    <motion.div 
                        key={d.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="glass-panel p-6 border-white/5 flex justify-between items-center group/item hover:bg-white/5 transition-all bg-surface-container/95 relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-20 group-hover/item:opacity-100 transition-all" />
                        <div className="flex items-center gap-8 relative z-10">
                            <div className="w-14 h-14 bg-surface-container-highest/40 rounded-2xl flex items-center justify-center text-primary/40 group-hover/item:text-primary transition-all border border-white/5 group-hover/item:border-primary/20 shadow-inner">
                                <Building2 size={24} />
                            </div>
                            <div className="space-y-1">
                                <p className="font-display-lg text-lg text-on-surface uppercase tracking-tight group-hover/item:text-primary transition-colors italic leading-none">{d.name}</p>
                                <p className="font-label-caps text-[9px] text-on-surface-variant/40 uppercase tracking-[0.2em] flex items-center gap-2 italic font-black mt-2">
                                    <MapPin size={10} className="text-primary/40" /> {d.location?.name || 'GLOBAL_OPERATIONAL_SECTOR'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 opacity-0 group-hover/item:opacity-100 transition-all translate-x-4 group-hover/item:translate-x-0">
                            <button onClick={() => startEdit(d)} className="w-12 h-12 bg-white/5 hover:bg-primary/20 text-on-surface-variant hover:text-primary transition-all border border-white/5 hover:border-primary/20 rounded-xl flex items-center justify-center"><Edit2 size={18} /></button>
                            <button onClick={() => { if(confirm(t('EXTERMINATE_UNIT_DATA'))) deleteMutation.mutate({ id: d.id }) }} className="w-12 h-12 bg-white/5 hover:bg-error/20 text-on-surface-variant hover:text-error transition-all border border-white/5 hover:border-error/20 rounded-xl flex items-center justify-center"><Trash2 size={18} /></button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// --- GESTOR DE UNIDADES / LOCAIS ---
function LocationManager() {
    const { t } = useLanguage();
    const utils = trpc.useContext();
    const { data: locations = [] } = (trpc as any).organization.listLocations.useQuery();

    const [name, setName] = useState('');
    const [addr, setAddr] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const createMutation = (trpc as any).organization.createLocation.useMutation({
        onSuccess: () => {
            ((utils as any).organization as any).listLocations.invalidate();
            setName(''); setAddr('');
        }
    });

    const updateMutation = (trpc as any).organization.updateLocation.useMutation({
        onSuccess: () => {
            ((utils as any).organization as any).listLocations.invalidate();
            setName(''); setAddr(''); setEditingId(null);
        }
    });

    const deleteMutation = (trpc as any).organization.deleteLocation.useMutation({
        onSuccess: () => ((utils as any).organization as any).listLocations.invalidate()
    });

    const startEdit = (loc: any) => {
        setEditingId(loc.id);
        setName(loc.name);
        setAddr(loc.address || '');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setName('');
        setAddr('');
    };

    const handleSave = () => {
        if (editingId) {
            updateMutation.mutate({ id: editingId, name, address: addr });
        } else {
            createMutation.mutate({ name, address: addr });
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-panel p-10 border-white/5 bg-surface-container/95 backdrop-blur-none h-fit relative shadow-[0_30px_60px_rgba(0,0,0,0.4)]"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <h3 className="font-display-lg text-2xl text-on-surface uppercase tracking-tighter mb-12 italic leading-none">
                    {editingId ? t('UPDATE_OPERATIONAL_SITE') : t('INITIALIZE_OPERATIONAL_SITE')}
                </h3>
                <div className="space-y-10">
                    <div className="space-y-4">
                        <label className="font-label-caps text-[10px] text-on-surface-variant/40 uppercase tracking-[0.3em] ml-1 italic font-black">SITE_IDENTIFIER</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full h-14 bg-surface-container-highest/60 border-white/5 font-data-mono text-xs uppercase px-6 focus:border-primary transition-all rounded-xl shadow-inner" placeholder="HQ_SECTOR_DELTA_01" />
                    </div>
                    <div className="space-y-4">
                        <label className="font-label-caps text-[10px] text-on-surface-variant/40 uppercase tracking-[0.3em] ml-1 italic font-black">{t('GEOSPATIAL_ENDPOINT_DATA')}</label>
                        <div className="relative group">
                            <input value={addr} onChange={e => setAddr(e.target.value)} className="w-full h-14 bg-surface-container-highest/60 border-white/5 font-data-mono text-xs uppercase px-6 focus:border-primary transition-all rounded-xl shadow-inner" placeholder="COORD_DATA_LAT_LONG" />
                            <MapPin className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/20 group-focus-within:text-primary transition-colors" />
                        </div>
                    </div>
                    <div className="flex gap-4 pt-8">
                        <button
                            onClick={handleSave}
                            disabled={!name || createMutation.isPending || updateMutation.isPending}
                            className="cyber-button flex-1 h-16 flex items-center justify-center gap-4 !bg-primary text-black border-transparent shadow-xl font-display-lg text-lg uppercase italic tracking-tighter"
                        >
                            <Zap size={20} /> {editingId ? t('COMMIT_SITE_SYNC') : t('INITIALIZE_SITE')}
                        </button>
                        {editingId && (
                            <button onClick={cancelEdit} className="w-16 h-16 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all border border-white/5 rounded-xl hover:bg-white/5">
                                <X size={28} />
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
            <div className="space-y-4 overflow-y-auto max-h-[700px] pr-4 custom-scrollbar">
                {locations.map((l: any, idx: number) => (
                    <motion.div 
                        key={l.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="glass-panel p-6 border-white/5 flex justify-between items-center group/item hover:bg-white/5 transition-all bg-surface-container/95 relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-20 group-hover/item:opacity-100 transition-all" />
                        <div className="flex items-center gap-8 relative z-10">
                            <div className="w-14 h-14 bg-surface-container-highest/40 rounded-2xl flex items-center justify-center text-primary/40 group-hover/item:text-primary transition-all border border-white/5 group-hover/item:border-primary/20 shadow-inner">
                                <MapPin size={24} />
                            </div>
                            <div className="space-y-1">
                                <p className="font-display-lg text-lg text-on-surface uppercase tracking-tight group-hover/item:text-primary transition-colors italic leading-none">{l.name}</p>
                                <p className="font-data-mono text-[10px] text-on-surface-variant/40 uppercase tracking-[0.15em] truncate max-w-[250px] italic font-black mt-2">{l.address || 'NULL_GEOSPATIAL_DATA'}</p>
                            </div>
                        </div>
                        <div className="flex gap-3 opacity-0 group-hover/item:opacity-100 transition-all translate-x-4 group-hover/item:translate-x-0">
                            <button onClick={() => startEdit(l)} className="w-12 h-12 bg-white/5 hover:bg-primary/20 text-on-surface-variant hover:text-primary transition-all border border-white/5 hover:border-primary/20 rounded-xl flex items-center justify-center"><Edit2 size={18} /></button>
                            <button onClick={() => { if(confirm(t('EXTERMINATE_SITE_DATA'))) deleteMutation.mutate({ id: l.id }) }} className="w-12 h-12 bg-white/5 hover:bg-error/20 text-on-surface-variant hover:text-error transition-all border border-white/5 hover:border-error/20 rounded-xl flex items-center justify-center"><Trash2 size={18} /></button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// --- GESTOR DE COMUNIDADES SNMP ---
export function SnmpCommunityManager() {
    const { t } = useLanguage();
    const utils = trpc.useContext();
    const { data: communities = [] } = (trpc as any).snmp.listCommunities.useQuery();
    const [name, setName] = useState('');
    const [version, setVersion] = useState<'v1' | 'v2c' | 'v3'>('v2c');
    const [community, setCommunity] = useState('');
    const [showCommunity, setShowCommunity] = useState(false);

    const createMutation = (trpc as any).snmp.createCommunity.useMutation({
        onSuccess: () => {
            (utils as any).snmp.listCommunities.invalidate();
            setName('');
            setCommunity('');
            setShowCommunity(false);
        }
    });

    const deleteMutation = (trpc as any).snmp.deleteCommunity.useMutation({
        onSuccess: () => (utils as any).snmp.listCommunities.invalidate()
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-panel p-10 border-white/5 bg-surface-container/95 backdrop-blur-none h-fit relative shadow-[0_30px_60px_rgba(0,0,0,0.4)]"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <div className="flex flex-col gap-4 mb-12 ml-1">
                    <h3 className="font-display-lg text-2xl text-on-surface uppercase tracking-tighter italic leading-none">{t('INITIALIZE_SNMP_CREDENTIAL')}</h3>
                    <p className="font-label-caps text-[9px] text-primary/60 uppercase tracking-[0.4em] italic font-black mt-2">{t('SNMP_AUTH_SUBTITLE') || 'Security Auth Profiles for Network Interrogation'}</p>
                </div>
                <div className="space-y-10">
                    <div className="space-y-4">
                        <label className="font-label-caps text-[10px] text-on-surface-variant/40 uppercase tracking-[0.3em] ml-1 italic font-black">{t('PROFILE_IDENTIFIER')}</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full h-14 bg-surface-container-highest/60 border-white/5 font-data-mono text-xs uppercase px-6 focus:border-primary transition-all rounded-xl shadow-inner" placeholder="READ_ONLY_PROTOCOL" />
                    </div>
                    <div className="space-y-4">
                        <label className="font-label-caps text-[10px] text-on-surface-variant/40 uppercase tracking-[0.3em] ml-1 italic font-black">{t('PROTOCOL_VERSIONING')}</label>
                        <select value={version} onChange={e => setVersion(e.target.value as any)} className="w-full h-14 bg-surface-container-highest/60 border-white/5 font-data-mono text-[11px] uppercase px-6 rounded-xl shadow-inner appearance-none cursor-pointer focus:border-primary transition-all">
                            <option value="v1">SNMP_V1_LEGACY</option>
                            <option value="v2c">SNMP_V2C_STANDARD</option>
                            <option value="v3">SNMP_V3_AES_CRYPT</option>
                        </select>
                    </div>
                    <div className="space-y-4">
                        <label className="font-label-caps text-[10px] text-on-surface-variant/40 uppercase tracking-[0.3em] ml-1 italic font-black">{t('COMMUNITY_SECRET_KEY')}</label>
                        <div className="relative group">
                            <input
                                value={community}
                                onChange={e => setCommunity(e.target.value)}
                                type={showCommunity ? 'text' : 'password'}
                                className="w-full h-14 bg-surface-container-highest/60 border-white/5 font-data-mono text-xs px-6 pr-14 focus:border-primary transition-all rounded-xl shadow-inner"
                                placeholder="IronGrid"
                                autoComplete="off"
                                spellCheck={false}
                            />
                            <button
                                type="button"
                                onClick={() => setShowCommunity(prev => !prev)}
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant/30 hover:text-primary transition-colors"
                                title={showCommunity ? 'Ocultar comunidade' : 'Mostrar comunidade'}
                            >
                                {showCommunity ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={() => createMutation.mutate({ name, version, community })}
                        className="cyber-button w-full h-16 flex items-center justify-center gap-4 !bg-primary text-black border-transparent mt-10 shadow-xl font-display-lg text-lg uppercase italic tracking-tighter"
                    >
                        <Zap size={24} /> {t('COMMIT_AUTH_PROFILE')}
                    </button>
                </div>
            </motion.div>

            <div className="space-y-4 overflow-y-auto max-h-[700px] pr-4 custom-scrollbar">
                {communities.map((c: any, idx: number) => (
                    <motion.div 
                        key={c.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="glass-panel p-6 border-white/5 flex justify-between items-center group/item hover:bg-white/5 transition-all bg-surface-container/95 relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-20 group-hover/item:opacity-100 transition-all" />
                        <div className="flex items-center gap-8 relative z-10">
                            <div className="w-14 h-14 bg-surface-container-highest/40 rounded-2xl border border-white/5 flex items-center justify-center text-primary/40 group-hover/item:text-primary transition-all shadow-inner relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                                <Shield size={24} />
                            </div>
                            <div className="space-y-1">
                                <p className="font-display-lg text-lg text-on-surface uppercase tracking-tight group-hover/item:text-primary transition-colors italic leading-none">{c.name}</p>
                                <p className="font-label-caps text-[9px] text-on-surface-variant/40 uppercase tracking-[0.2em] flex items-center gap-3 italic font-black mt-2">
                                    <Globe size={12} className="text-primary/40" /> {t('PROTOCOL') || 'PROTOCOL'}_{c.version.toUpperCase()} • <span className="opacity-40">{c.community?.replace(/./g, '•')}</span>
                                </p>
                            </div>
                        </div>
                        <button onClick={() => { if(confirm(t('EXTERMINATE_AUTH_PROFILE'))) deleteMutation.mutate({ id: c.id }) }} className="w-12 h-12 bg-white/5 hover:bg-error/20 text-on-surface-variant hover:text-error transition-all border border-white/5 hover:border-error/20 rounded-xl flex items-center justify-center"><Trash2 size={18} /></button>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// --- GESTOR DE FAIXAS DE REDE ---
export function NetworkRangeManager() {
    const { t } = useLanguage();
    const utils = trpc.useContext();
    const { data: ranges = [] } = (trpc as any).snmp.listRanges.useQuery();
    const { data: communities = [] } = (trpc as any).snmp.listCommunities.useQuery();
    const { data: locations = [] } = (trpc as any).organization.listLocations.useQuery();

    const [name, setName] = useState('');
    const [subnet, setSubnet] = useState('');
    const [locId, setLocId] = useState('');
    const [snmpId, setSnmpId] = useState('');

    const createMutation = (trpc as any).snmp.createRange.useMutation({
        onSuccess: () => {
            (utils as any).snmp.listRanges.invalidate();
            setName(''); setSubnet('');
        }
    });

    const deleteMutation = (trpc as any).snmp.deleteRange.useMutation({
        onSuccess: () => (utils as any).snmp.listRanges.invalidate()
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-panel p-10 border-white/5 bg-surface-container/95 backdrop-blur-none h-fit relative shadow-[0_30px_60px_rgba(0,0,0,0.4)]"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <div className="flex flex-col gap-4 mb-12 ml-1">
                    <h3 className="font-display-lg text-2xl text-on-surface uppercase tracking-tighter italic leading-none">{t('INITIALIZE_SCAN_MATRIX')}</h3>
                    <p className="font-label-caps text-[9px] text-primary/60 uppercase tracking-[0.4em] italic font-black mt-2">{t('SCAN_MATRIX_SUBTITLE') || 'Subnet Range Definition for Automated Discovery'}</p>
                </div>
                <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <label className="font-label-caps text-[10px] text-on-surface-variant/40 uppercase tracking-[0.3em] ml-1 italic font-black">{t('TOPOLOGY_LABEL')}</label>
                            <input value={name} onChange={e => setName(e.target.value)} className="w-full h-14 bg-surface-container-highest/60 border-white/5 font-data-mono text-xs uppercase px-6 focus:border-primary transition-all rounded-xl shadow-inner" placeholder="LAN_SEGMENT_01" />
                        </div>
                        <div className="space-y-4">
                            <label className="font-label-caps text-[10px] text-on-surface-variant/40 uppercase tracking-[0.3em] ml-1 italic font-black">{t('SUBNET_CIDR_BLOCK')}</label>
                            <input value={subnet} onChange={e => setSubnet(e.target.value)} className="w-full h-14 bg-surface-container-highest/60 border-white/5 font-data-mono text-xs uppercase px-6 focus:border-primary transition-all rounded-xl shadow-inner" placeholder="10.0.0.0/24" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="font-label-caps text-[10px] text-on-surface-variant/40 uppercase tracking-[0.3em] ml-1 italic font-black">SITE_AFFILIATION_MAP</label>
                        <select value={locId} onChange={e => setLocId(e.target.value)} className="w-full h-14 bg-surface-container-highest/60 border-white/5 font-data-mono text-[11px] uppercase px-6 rounded-xl shadow-inner appearance-none cursor-pointer focus:border-primary transition-all">
                            <option value="">NO_SITE_AFFILIATION</option>
                            {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name.toUpperCase()}</option>)}
                        </select>
                    </div>

                    <div className="space-y-4">
                        <label className="font-label-caps text-[10px] text-on-surface-variant/40 uppercase tracking-[0.3em] ml-1 italic font-black">{t('DEFAULT_AUTH_PROFILE')}</label>
                        <select value={snmpId} onChange={e => setSnmpId(e.target.value)} className="w-full h-14 bg-surface-container-highest/60 border-white/5 font-data-mono text-[11px] uppercase px-6 rounded-xl shadow-inner appearance-none cursor-pointer focus:border-primary transition-all">
                            <option value="">SCAN_ALL_KNOWN_PROFILES</option>
                            {communities.map((c: any) => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                        </select>
                    </div>

                    <button
                        onClick={() => createMutation.mutate({
                            name, subnet, locationId: locId || undefined,
                            snmpEnabled: true, snmpCommunityId: snmpId || undefined
                        })}
                        className="cyber-button w-full h-16 flex items-center justify-center gap-4 !bg-primary text-black border-transparent mt-10 shadow-xl font-display-lg text-lg uppercase italic tracking-tighter"
                    >
                        <Globe size={24} /> {t('COMMIT_SCAN_MATRIX_PROTOCOLS')}
                    </button>
                </div>
            </motion.div>

            <div className="space-y-4 overflow-y-auto max-h-[750px] pr-4 custom-scrollbar">
                {ranges.map((r: any, idx: number) => (
                    <motion.div 
                        key={r.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="glass-panel p-6 border-white/5 flex justify-between items-center group/item hover:bg-white/5 transition-all bg-surface-container/95 relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-20 group-hover/item:opacity-100 transition-all" />
                        <div className="flex items-center gap-8 relative z-10">
                            <div className="w-16 h-16 bg-surface-container-highest/40 rounded-2xl border border-white/5 flex items-center justify-center text-primary group-hover/item:text-primary transition-all shadow-inner relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                                <Network size={28} />
                            </div>
                            <div className="space-y-2">
                                <p className="font-display-lg text-xl text-on-surface uppercase tracking-tight group-hover:text-primary transition-colors italic leading-none">{r.name}</p>
                                <div className="flex items-center gap-4 mt-2">
                                    <p className="font-data-mono text-[10px] text-on-surface-variant/40 uppercase tracking-[0.15em] italic font-black">{r.subnet}</p>
                                    <div className="w-1 h-1 rounded-full bg-white/10" />
                                    <p className="font-label-caps text-[9px] text-primary/60 uppercase tracking-widest italic font-black">{r.location?.name?.toUpperCase() || t('GLOBAL_SECTOR')}</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => { if(confirm(t('EXTERMINATE_SCAN_MATRIX'))) deleteMutation.mutate({ id: r.id }) }} className="w-12 h-12 bg-white/5 hover:bg-error/20 text-on-surface-variant hover:text-error transition-all border border-white/5 hover:border-error/20 rounded-xl flex items-center justify-center"><Trash2 size={18} /></button>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
