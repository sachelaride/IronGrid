import { useState } from 'react';
import { trpc } from '../utils/trpc';
import { Shield, Trash2, Edit2, X, Users, Mail, Key, Briefcase, ChevronRight, UserPlus, Loader2, Anchor, Save, Fingerprint, Lock, Zap, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * UserManager - Operator & Security Credential Governance.
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
export function UserManager() {
    const utils = trpc.useContext();
    const { data: users = [] } = (trpc.auth as any).listUsers.useQuery();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'ADMIN' | 'OPERATOR' | 'TECNICO' | 'USER'>('USER');

    const [editingUser, setEditingUser] = useState<any>(null);
    const [editRole, setEditRole] = useState<'ADMIN' | 'OPERATOR' | 'TECNICO' | 'USER'>('USER');
    const [editEmail, setEditEmail] = useState('');
    const [departmentId, setDepartmentId] = useState<string>('');
    const [editDepartmentId, setEditDepartmentId] = useState<string>('');

    const { data: departments = [] } = (trpc as any).organization.listDepartments.useQuery();

    const createMutation = (trpc.auth as any).createUser.useMutation({
        onSuccess: () => {
            ((utils as any).auth as any).listUsers.invalidate();
            setName('');
            setEmail('');
            setUsername('');
            setPassword('');
            setRole('USER');
            setDepartmentId('');
        }
    });

    const deleteMutation = (trpc.auth as any).deleteUser.useMutation({
        onSuccess: () => ((utils as any).auth as any).listUsers.invalidate()
    });

    const updateMutation = (trpc.auth as any).updateUser.useMutation({
        onSuccess: () => {
            ((utils as any).auth as any).listUsers.invalidate();
            setEditingUser(null);
        }
    });

    const openEditModal = (user: any) => {
        setEditingUser(user);
        setEditRole(user.role);
        setEditEmail(user.email || '');
        setEditDepartmentId(user.departmentId || '');
    };

    const handleUpdate = () => {
        updateMutation.mutate({
            id: editingUser.id,
            role: editRole,
            email: editEmail || undefined,
            departmentId: editDepartmentId || null
        });
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-gutter animate-in fade-in duration-700">
            {/* Formulário de Criação */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-panel p-10 border-white/5 bg-surface-container/95 backdrop-blur-none h-fit relative overflow-hidden group shadow-[0_30px_60px_rgba(0,0,0,0.4)]"
            >
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <UserPlus size={160} className="text-primary" />
                </div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                
                <div className="flex flex-col gap-4 mb-12 ml-1 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-primary/5 animate-pulse rounded-xl" />
                            <Fingerprint className="text-primary relative z-10" size={24} />
                        </div>
                        <div>
                            <h3 className="font-display-lg text-2xl text-on-surface uppercase tracking-tighter italic leading-none">OPERATOR_PROVISIONING</h3>
                            <p className="font-label-caps text-[9px] text-primary/80 uppercase tracking-[0.4em] italic font-black mt-1">Access Protocol Initialization</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-10 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <label className="font-label-caps text-[10px] text-on-surface-variant/80 uppercase tracking-widest ml-1 italic font-black">LEGAL_IDENTIFIER</label>
                            <input value={name} onChange={e => setName(e.target.value)} className="w-full h-14 bg-surface-container-highest/60 border-white/5 font-data-mono text-xs uppercase px-6 focus:border-primary transition-all rounded-xl shadow-inner" placeholder="OPERATOR_NAME" />
                        </div>
                        <div className="space-y-4">
                            <label className="font-label-caps text-[10px] text-on-surface-variant/80 uppercase tracking-widest ml-1 italic font-black">AUTH_ALIAS</label>
                            <input value={username} onChange={e => setUsername(e.target.value)} className="w-full h-14 bg-surface-container-highest/60 border-white/5 font-data-mono text-xs uppercase px-6 focus:border-primary transition-all rounded-xl shadow-inner" placeholder="SYSTEM_LOGIN" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="font-label-caps text-[10px] text-on-surface-variant/80 uppercase tracking-widest ml-1 italic font-black">COMMUNICATION_ENDPOINT</label>
                        <div className="relative group">
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full h-14 bg-surface-container-highest/60 border-white/5 font-data-mono text-xs uppercase px-6 focus:border-primary transition-all rounded-xl shadow-inner" placeholder="ENDPOINT@CORE.NET" />
                            <Mail className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/20 group-focus-within:text-primary transition-colors" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <label className="font-label-caps text-[10px] text-on-surface-variant/80 uppercase tracking-widest ml-1 italic font-black">SECURITY_CLEARANCE</label>
                            <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full h-14 bg-surface-container-highest/60 border-white/5 font-data-mono text-[11px] uppercase px-6 rounded-xl shadow-inner focus:border-primary transition-all appearance-none cursor-pointer">
                                <option value="USER">LEVEL_01_STANDARD</option>
                                <option value="TECNICO">LEVEL_02_TECHNICIAN</option>
                                <option value="OPERATOR">LEVEL_03_OPERATOR</option>
                                <option value="ADMIN">LEVEL_04_ROOT</option>
                            </select>
                        </div>
                        <div className="space-y-4">
                            <label className="font-label-caps text-[10px] text-on-surface-variant/80 uppercase tracking-widest ml-1 italic font-black">CRYPTOGRAPHIC_SECRET</label>
                            <div className="relative group">
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full h-14 bg-surface-container-highest/60 border-white/5 font-data-mono text-xs uppercase px-6 focus:border-primary transition-all rounded-xl shadow-inner" placeholder="••••••••" />
                                <Lock className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/20 group-focus-within:text-primary transition-colors" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="font-label-caps text-[10px] text-on-surface-variant/80 uppercase tracking-widest ml-1 italic font-black">ORGANIZATIONAL_SECTOR</label>
                        <select value={departmentId} onChange={e => setDepartmentId(e.target.value)} className="w-full h-14 bg-surface-container-highest/60 border-white/5 font-data-mono text-[11px] uppercase px-6 rounded-xl shadow-inner focus:border-primary transition-all appearance-none cursor-pointer">
                            <option value="">GLOBAL_UNASSIGNED</option>
                            {departments.map((dept: any) => (
                                <option key={dept.id} value={dept.id}>{dept.name.toUpperCase()} {dept.location?.name ? `[${dept.location.name.toUpperCase()}]` : ''}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => createMutation.mutate({ name, username, password, role, email, departmentId: departmentId || undefined })}
                        disabled={!name || !username || !password || createMutation.isPending}
                        className="cyber-button w-full h-16 !bg-primary text-black border-transparent flex items-center justify-center gap-4 shadow-xl font-display-lg text-lg uppercase italic tracking-tighter"
                    >
                        {createMutation.isPending ? <Loader2 size={24} className="animate-spin" /> : <><Zap size={24} /> COMMIT_PROVISIONING</>}
                    </button>
                </div>
            </motion.div>

            {/* Lista de Usuários */}
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
            >
                <div className="flex items-center justify-between px-6 mb-4">
                    <div className="flex items-center gap-4">
                        <Users className="text-primary/40" size={20} />
                        <h3 className="font-display-lg text-lg text-on-surface uppercase tracking-tight italic">SECURITY_ROSTER</h3>
                    </div>
                    <div className="font-data-mono text-[10px] text-primary uppercase font-black tracking-widest bg-primary/5 px-4 py-1 rounded-full border border-primary/10">
                        {users.length}_ENTITIES_INDEXED
                    </div>
                </div>
                
                <div className="space-y-4 overflow-y-auto max-h-[750px] pr-4 custom-scrollbar">
                    {users.map((u: any, idx: number) => (
                        <motion.div 
                            key={u.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass-panel p-6 border-white/5 flex items-center justify-between group/item hover:bg-white/5 transition-all bg-surface-container/95 relative overflow-hidden"
                        >
                            <div className={`absolute top-0 left-0 w-1 h-full transition-all ${
                                u.role === 'ADMIN' ? 'bg-error shadow-[0_0_10px_rgba(var(--error),0.5)]' :
                                u.role === 'OPERATOR' ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary-fixed),0.5)]' :
                                'bg-white/5'
                            }`} />
                            
                            <div className="flex items-center gap-8 relative z-10">
                                <div className="w-16 h-16 bg-surface-container-highest/40 rounded-2xl flex items-center justify-center text-on-surface-variant/20 group-hover/item:text-primary group-hover/item:bg-primary/10 transition-all border border-white/5 group-hover/item:border-primary/20 shadow-inner font-black text-2xl italic relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                                    {u.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-display-lg text-xl text-on-surface uppercase tracking-tight group-hover/item:text-primary transition-colors italic">{u.name}</h4>
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                        <div className="flex items-center gap-2">
                                            <Radio size={12} className="text-on-surface-variant/70" />
                                            <span className="font-data-mono text-[10px] text-on-surface-variant/90 uppercase tracking-widest font-black">ID_{u.username}</span>
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-[0.2em] italic ${
                                            u.role === 'ADMIN' ? 'bg-error/10 text-error border-error/20' :
                                            u.role === 'OPERATOR' ? 'bg-primary/10 text-primary border-primary/20' :
                                            u.role === 'TECNICO' ? 'bg-secondary-fixed/10 text-secondary-fixed border-secondary-fixed/20' :
                                            'bg-white/5 text-on-surface-variant/40 border-white/10'
                                        }`}>
                                            {u.role}
                                        </span>
                                        {u.department && (
                                            <span className="font-label-caps text-[9px] text-primary/80 flex items-center gap-2 italic">
                                                <Briefcase size={12} /> {u.department.name.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 relative z-10 opacity-0 group-hover/item:opacity-100 transition-all translate-x-4 group-hover/item:translate-x-0">
                                <button onClick={() => openEditModal(u)} className="w-12 h-12 bg-white/5 hover:bg-primary/20 text-on-surface-variant hover:text-primary transition-all border border-white/5 hover:border-primary/20 rounded-xl flex items-center justify-center"><Edit2 size={18} /></button>
                                <button onClick={() => { if(confirm('EXTERMINATE_ACCESS_PROTOCOL?')) deleteMutation.mutate({ id: u.id }) }} className="w-12 h-12 bg-white/5 hover:bg-error/20 text-on-surface-variant hover:text-error transition-all border border-white/5 hover:border-error/20 rounded-xl flex items-center justify-center"><Trash2 size={18} /></button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setEditingUser(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 40 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 40 }}
                            className="glass-panel p-10 max-w-xl w-full shadow-[0_50px_100px_rgba(0,0,0,0.9)] relative border-white/10 bg-surface-container/95 backdrop-blur-none overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_15px_rgba(var(--primary-fixed),0.6)]" />
                            
                            <button onClick={() => setEditingUser(null)} className="absolute top-8 right-8 w-12 h-12 rounded-xl hover:bg-white/5 text-on-surface-variant transition-all border border-transparent hover:border-white/10 flex items-center justify-center group">
                                <X size={24} className="group-hover:rotate-90 transition-transform" />
                            </button>

                            <div className="flex flex-col gap-3 mb-12">
                                <h3 className="font-display-lg text-2xl text-on-surface uppercase tracking-tighter italic leading-none">ASSET_CLEARANCE_UPDATE</h3>
                                <p className="font-label-caps text-[10px] text-primary/80 uppercase tracking-[0.3em] italic font-black">Security Protocol Re-Validation</p>
                            </div>

                            <div className="space-y-10">
                                <div className="p-8 bg-surface-container-highest/60 rounded-2xl border border-white/5 flex items-center gap-8 shadow-inner relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-3xl italic border border-primary/20 relative z-10">
                                        {editingUser.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="relative z-10">
                                        <p className="font-display-lg text-2xl text-on-surface uppercase tracking-tight italic">{editingUser.name}</p>
                                        <p className="font-data-mono text-[11px] text-primary uppercase tracking-widest font-black mt-1 italic">UID_{editingUser.username}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="font-label-caps text-[10px] text-on-surface-variant/40 uppercase tracking-widest ml-1 italic font-black">TRANSMISSION_ENDPOINT</label>
                                    <input
                                        value={editEmail}
                                        onChange={e => setEditEmail(e.target.value)}
                                        type="email"
                                        className="w-full h-14 bg-surface-container-highest/60 border-white/5 font-data-mono text-xs uppercase px-6 focus:border-primary transition-all rounded-xl shadow-inner"
                                        placeholder="EMAIL@ENDPOINT.COM"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="font-label-caps text-[10px] text-on-surface-variant/40 uppercase tracking-widest ml-1 italic font-black">AUTHORITY_LEVEL</label>
                                        <select
                                            value={editRole}
                                            onChange={e => setEditRole(e.target.value as any)}
                                            className="w-full h-14 bg-surface-container-highest/60 border-white/5 font-data-mono text-[11px] uppercase px-6 rounded-xl focus:border-primary transition-all appearance-none cursor-pointer shadow-inner"
                                        >
                                            <option value="USER">LEVEL_01_STANDARD</option>
                                            <option value="TECNICO">LEVEL_02_TECHNICIAN</option>
                                            <option value="OPERATOR">LEVEL_03_OPERATOR</option>
                                            <option value="ADMIN">LEVEL_04_ROOT</option>
                                        </select>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="font-label-caps text-[10px] text-on-surface-variant/40 uppercase tracking-widest ml-1 italic font-black">ASSIGNED_UNIT</label>
                                        <select
                                            value={editDepartmentId}
                                            onChange={e => setEditDepartmentId(e.target.value)}
                                            className="w-full h-14 bg-surface-container-highest/60 border-white/5 font-data-mono text-[11px] uppercase px-6 rounded-xl focus:border-primary transition-all appearance-none cursor-pointer shadow-inner"
                                        >
                                            <option value="">GLOBAL_UNASSIGNED</option>
                                            {departments.map((dept: any) => (
                                                <option key={dept.id} value={dept.id}>{dept.name.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-6 pt-10">
                                    <button
                                        onClick={() => setEditingUser(null)}
                                        className="h-16 px-10 font-label-caps text-[11px] text-on-surface-variant/60 hover:text-on-surface uppercase tracking-[0.4em] transition-all italic"
                                    >
                                        ABORT_MODS
                                    </button>
                                    <button
                                        onClick={handleUpdate}
                                        disabled={updateMutation.isPending}
                                        className="cyber-button flex-1 h-16 !bg-primary text-black border-transparent font-display-lg text-lg uppercase italic tracking-tighter shadow-xl"
                                    >
                                        {updateMutation.isPending ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                                        {updateMutation.isPending ? 'COMMITTING...' : 'COMMIT_SECURITY_SYNC'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
