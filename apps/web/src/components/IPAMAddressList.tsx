import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { trpc } from '../utils/trpc';
import { Search, Filter, Monitor, RotateCcw, X, Save, Camera, Activity, Phone, Database, Plus, Hash, ChevronRight, AlertCircle, Info, Edit2 } from 'lucide-react';
import { EditDeviceModal } from './EditDeviceModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

interface IPAMAddressListProps {
    subnetId: string;
}

/**
 * IPAMAddressList - Visual Matrix of Network Addressing Status.
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
export function IPAMAddressList({ subnetId }: IPAMAddressListProps) {
    const { t } = useLanguage();
    const { data: addresses = [], isLoading, refetch } = (trpc as any).ipam.listAddresses.useQuery({ subnetId });
    const [search, setSearch] = useState('');
    const [editingAddress, setEditingAddress] = useState<any>(null);
    const [editingDevice, setEditingDevice] = useState<any>(null);

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-32 glass-panel border-white/5 border-dashed rounded bg-surface-container/5">
            <RotateCcw className="w-12 h-12 text-primary animate-spin mb-6" />
            <p className="font-label-caps text-xs text-on-surface-variant uppercase tracking-[0.4em] italic animate-pulse">{t('SCANNING_ADDRESS_MATRIX')}</p>
        </div>
    );

    const filtered = addresses
        .filter((a: any) =>
            a.ip.includes(search) ||
            (a.hostname?.toLowerCase().includes(search.toLowerCase())) ||
            (a.mac?.toLowerCase().includes(search.toLowerCase()))
        )
        .sort((a: any, b: any) => {
            const lastA = parseInt(a.ip.split('.').pop() ?? '0', 10);
            const lastB = parseInt(b.ip.split('.').pop() ?? '0', 10);
            return lastA - lastB;
        });

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6 glass-panel p-6 border-white/5 bg-surface-container/95">
                <div className="flex items-center gap-6 flex-1 px-4">
                    <Search className="w-5 h-5 text-primary opacity-40" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('FILTER_BY_IP_HOSTNAME_MAC')}
                        className="bg-transparent border-none outline-none font-data-mono text-xs text-on-surface w-full uppercase tracking-widest placeholder:opacity-20"
                    />
                </div>
                <div className="flex items-center gap-6 px-4 border-l border-white/5">
                    <div className="flex items-center gap-6 flex-wrap font-label-caps text-[9px] uppercase tracking-widest">
                        <div className="flex items-center gap-2 text-on-surface-variant opacity-60"><div className="w-2.5 h-2.5 rounded-sm bg-primary/20 border border-primary/40" /> {t('VACANT')}</div>
                        <div className="flex items-center gap-2 text-primary"><div className="w-2.5 h-2.5 rounded-sm bg-primary border border-primary/60 shadow-[0_0_5px_rgba(var(--primary-fixed),0.5)]" /> {t('OCCUPIED')}</div>
                        <div className="flex items-center gap-2 text-amber-500"><div className="w-2.5 h-2.5 rounded-sm bg-amber-500/20 border border-amber-500/40" /> {t('STALE')}</div>
                        <div className="flex items-center gap-2 text-secondary-fixed"><div className="w-2.5 h-2.5 rounded-sm bg-secondary-fixed/20 border border-secondary-fixed/40" /> {t('RESERVED')}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-3">
                {filtered.map((addr: any) => (
                    <IPBox key={addr.id} address={addr} onClick={() => setEditingAddress(addr)} />
                ))}
            </div>

            <AnimatePresence>
                {editingAddress && (
                    <EditIPModal
                        address={editingAddress}
                        onClose={() => setEditingAddress(null)}
                        onUpdate={() => {
                            refetch();
                            setEditingAddress(null);
                        }}
                        onOpenDevice={(device: any) => {
                            setEditingAddress(null);
                            setEditingDevice(device);
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {editingDevice && (
                    <EditDeviceModal
                        device={editingDevice}
                        onClose={() => {
                            setEditingDevice(null);
                            refetch();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

interface IPBoxProps {
    address: any;
    onClick: () => void;
}

function IPBox({ address, onClick }: IPBoxProps) {
    const { t } = useLanguage();
    const [isHovered, setIsHovered] = useState(false);
    const isOccupied = address.status !== 'AVAILABLE';

    function getStyle(): { color: string, bg: string, border: string, glow: string } {
        if (address.status === 'AVAILABLE') return { color: 'text-on-surface-variant/40', bg: 'bg-surface-container/10', border: 'border-white/5', glow: '' };
        if (address.status === 'RESERVED' || address.status === 'STATIC') return { color: 'text-secondary-fixed', bg: 'bg-secondary-fixed/10', border: 'border-secondary-fixed/30', glow: 'shadow-[0_0_10px_rgba(var(--secondary-fixed),0.1)]' };
        
        if (!address.lastSeen) return { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30', glow: 'shadow-[0_0_10px_rgba(var(--primary-fixed),0.1)]' };
        const daysSince = (Date.now() - new Date(address.lastSeen).getTime()) / 86_400_000;
        if (daysSince > 15) return { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', glow: 'shadow-[0_0_10px_rgba(245,158,11,0.1)]' };
        return { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30', glow: 'shadow-[0_0_10px_rgba(var(--primary-fixed),0.1)]' };
    }

    const style = getStyle();
    const lastOctet = address.ip.split('.').pop();

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
            className={`h-24 glass-panel border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group relative ${style.bg} ${style.border} ${style.glow} hover:scale-105 hover:border-primary/40 z-10`}
        >
            <span className={`font-data-mono text-[14px] font-black italic tracking-tighter ${style.color} group-hover:text-primary transition-colors`}>
                .{lastOctet}
            </span>
            
            {isOccupied && (
                <div className="flex flex-col items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                    <Monitor size={10} className={style.color} />
                    <span className="font-label-caps text-[7px] uppercase truncate max-w-[50px]">{address.hostname || t('NODE')}</span>
                </div>
            )}

            {isHovered && (
                <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 p-6 glass-panel rounded border-white/10 z-[100] shadow-2xl min-w-[280px] pointer-events-none bg-surface-container-high"
                >
                    <div className="flex flex-col gap-1 mb-4">
                        <p className="font-data-mono text-xs text-primary uppercase tracking-widest">{address.ip}</p>
                        <p className="font-label-caps text-[9px] text-on-surface-variant uppercase italic opacity-60">{t('NODE_SECURITY_CONTEXT')}</p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                            <span className="font-label-caps text-[8px] text-on-surface-variant uppercase">{t('STATUS')}</span>
                            <span className={`font-data-mono text-[9px] uppercase ${style.color}`}>{address.status}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                            <span className="font-label-caps text-[8px] text-on-surface-variant uppercase">{t('HOSTNAME')}</span>
                            <span className="font-data-mono text-[9px] text-on-surface uppercase truncate max-w-[140px]">{address.hostname || t('UNRESOLVED')}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                            <span className="font-label-caps text-[8px] text-on-surface-variant uppercase">{t('HARDWARE_ADDR')}</span>
                            <span className="font-data-mono text-[9px] text-on-surface uppercase">{address.mac || t('UNDEFINED')}</span>
                        </div>

                        {address.device && (
                            <div className="p-3 bg-surface-container rounded border border-white/5 space-y-2 mt-4">
                                <p className="font-label-caps text-[8px] text-primary uppercase tracking-widest flex items-center gap-2"><Database size={10} /> {t('INVENTORY_ENTITY_DETECTED')}</p>
                                <div className="grid grid-cols-2 gap-2 text-[8px] font-label-caps text-on-surface uppercase">
                                    <div className="flex flex-col"><span className="opacity-40">{t('ASSET')}</span>{address.device.assetNumber || 'N/A'}</div>
                                    <div className="flex flex-col"><span className="opacity-40">{t('UNIT')}</span>{address.device.departmentRef?.name || 'N/A'}</div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                            <span className="font-label-caps text-[8px] text-on-surface-variant uppercase">{t('LAST_SEEN')}</span>
                            <span className="font-data-mono text-[9px] text-on-surface uppercase">
                                {address.lastSeen ? new Date(address.lastSeen).toLocaleDateString() : t('NEVER')}
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

function EditIPModal({ address, onClose, onUpdate, onOpenDevice }: { address: any, onClose: () => void, onUpdate: () => void, onOpenDevice: (device: any) => void }) {
    const { t } = useLanguage();
    const [status, setStatus] = useState(address.status);
    const [hostname, setHostname] = useState(address.hostname || '');
    const [mac, setMac] = useState(address.mac || '');
    const [reservedFor, setReservedFor] = useState(address.reservedFor || '');
    const [reservedNote, setReservedNote] = useState(address.reservedNote || '');
    const [error, setError] = useState<string | null>(null);

    const updateMutation = (trpc as any).ipam.updateMetadata.useMutation({
        onSuccess: onUpdate,
        onError: (err: any) => setError(err.message || t('TRANSACTION_REJECTION'))
    });

    const createDeviceMutation = (trpc as any).organization.createDevice.useMutation();

    const handleRelease = () => {
        updateMutation.mutate({
            id: address.id,
            status: 'AVAILABLE',
            reservedFor: null,
            reservedNote: null
        });
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-surface/95 backdrop-blur-2xl">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="glass-panel w-full max-w-4xl p-10 border-white/5 bg-surface-container-high relative shadow-2xl"
            >
                <button onClick={onClose} className="absolute top-10 right-10 p-3 text-on-surface-variant hover:text-primary transition-all">
                    <X size={24} />
                </button>

                <div className="flex flex-col gap-2 mb-12">
                    <h3 className="font-display-lg text-3xl text-primary uppercase tracking-tighter italic">{t('ADDRESS_METADATA_GOVERNANCE')}</h3>
                    <p className="font-label-caps text-xs text-on-surface-variant uppercase tracking-[0.3em] italic">{t('OPERATIONAL_CONTROL')} <span className="text-on-surface font-black">{address.ip}</span></p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-10">
                        <div className="space-y-4">
                            <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1 opacity-60">{t('IPAM_SECTOR_STATUS')}</label>
                            <div className="flex gap-3">
                                {[
                                    { id: 'AVAILABLE', label: t('VACANT'), color: 'primary' },
                                    { id: 'USED', label: t('OCCUPIED'), color: 'primary' },
                                    { id: 'RESERVED', label: t('RESERVED'), color: 'secondary-fixed' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setStatus(opt.id)}
                                        className={`flex-1 h-14 font-label-caps text-[10px] uppercase tracking-widest border transition-all rounded ${
                                            status === opt.id 
                                            ? `bg-${opt.color}/10 border-${opt.color} text-on-surface shadow-lg` 
                                            : 'bg-white/5 border-white/5 text-on-surface-variant hover:border-white/10'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1 opacity-60">{t('HOSTNAME_IDENTIFIER')}</label>
                                <input
                                    value={hostname}
                                    onChange={(e) => setHostname(e.target.value)}
                                    className="w-full h-12 !bg-surface-container border-white/5 font-data-mono text-xs uppercase px-4 focus:border-primary transition-all rounded shadow-inner"
                                    placeholder={t('NODE_ALIAS')}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1 opacity-60">{t('HARDWARE_ADDR_MAC')}</label>
                                <input
                                    value={mac}
                                    onChange={(e) => setMac(e.target.value)}
                                    className="w-full h-12 !bg-surface-container border-white/5 font-data-mono text-xs uppercase px-4 focus:border-primary transition-all rounded shadow-inner"
                                    placeholder="00:00:00:00:00:00"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8 bg-surface-container/30 p-8 rounded border border-white/5">
                        {status === 'RESERVED' && (
                            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div className="flex items-center gap-3 text-secondary-fixed mb-2">
                                    <Info size={16} />
                                    <h4 className="font-label-caps text-[10px] uppercase tracking-widest font-black">{t('RESERVATION_PROTOCOL_DATA')}</h4>
                                </div>
                                <div className="space-y-3">
                                    <label className="font-label-caps text-[9px] text-on-surface-variant uppercase ml-1">{t('ASSIGNED_ENTITY')}</label>
                                    <input
                                        value={reservedFor}
                                        onChange={(e) => setReservedFor(e.target.value)}
                                        className="w-full h-12 !bg-surface-container border-secondary-fixed/20 font-data-mono text-xs uppercase px-4 focus:border-secondary-fixed transition-all rounded"
                                        placeholder={t('ENTITY_ID')}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="font-label-caps text-[9px] text-on-surface-variant uppercase ml-1">{t('PROTOCOL_NOTES')}</label>
                                    <textarea
                                        value={reservedNote}
                                        onChange={(e) => setReservedNote(e.target.value)}
                                        className="w-full h-24 !bg-surface-container border-white/5 font-data-mono text-xs uppercase p-4 focus:border-primary transition-all rounded resize-none"
                                        placeholder={t('DESC_SEQUENCE')}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {address.device ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-primary mb-2">
                                    <Database size={16} />
                                    <h4 className="font-label-caps text-[10px] uppercase tracking-widest font-black">{t('INVENTORY_SYNC_ACTIVE')}</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-6 p-6 bg-surface-container rounded border border-white/5 shadow-inner">
                                    <div className="space-y-1">
                                        <p className="font-label-caps text-[8px] text-on-surface-variant uppercase tracking-widest">{t('ASSET_TAG')}</p>
                                        <p className="font-data-mono text-xs text-on-surface uppercase">{address.device.assetNumber || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-label-caps text-[8px] text-on-surface-variant uppercase tracking-widest">{t('UNIT_NAME')}</p>
                                        <p className="font-data-mono text-xs text-on-surface uppercase truncate">{address.device.departmentRef?.name || 'N/A'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onOpenDevice({ ...address.device, ip: address.ip, mac: address.mac, ipamStatus: address.status })}
                                    className="w-full h-12 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded font-label-caps text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
                                >
                                    <Edit2 size={14} /> {t('MODIFY_INVENTORY_LINK')}
                                </button>
                            </div>
                        ) : (
                            (status === 'RESERVED' || status === 'USED') && (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-60 hover:opacity-100 transition-opacity">
                                    <Plus size={32} className="text-on-surface-variant/20" />
                                    <div className="space-y-2">
                                        <h4 className="font-label-caps text-xs text-on-surface uppercase tracking-widest">{t('NO_LINKED_ASSET')}</h4>
                                        <p className="font-label-caps text-[9px] text-on-surface-variant uppercase italic">{t('INITIALIZE_INVENTORY_ENTITY')}</p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            const newDevice = await createDeviceMutation.mutateAsync({
                                                name: hostname || reservedFor || `NODE_${address.ip.split('.').pop()}`,
                                                ipAddress: address.ip,
                                                type: 'OTHER',
                                                macAddress: mac || undefined,
                                                hostname: hostname || undefined,
                                            });
                                            onOpenDevice(newDevice);
                                        }}
                                        className="w-full h-14 bg-white/5 hover:bg-primary/10 text-on-surface-variant hover:text-primary border border-white/10 hover:border-primary/30 rounded font-label-caps text-[10px] uppercase tracking-[0.2em] transition-all"
                                    >
                                        {t('CREATE_LINK_ENTITY')}
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                </div>

                <div className="flex gap-4 pt-10 mt-10 border-t border-white/5">
                    <button
                        onClick={handleRelease}
                        className="h-14 px-8 font-label-caps text-[10px] text-on-surface-variant hover:text-error uppercase tracking-widest transition-all border border-white/5 hover:border-error/20 rounded hover:bg-error/5"
                    >
                        {t('EXTERMINATE_METADATA')}
                    </button>
                    <button
                        onClick={() => updateMutation.mutate({
                            id: address.id,
                            hostname,
                            mac,
                            status,
                            reservedFor: status === 'RESERVED' ? reservedFor : null,
                            reservedNote: status === 'RESERVED' ? reservedNote : null
                        })}
                        disabled={updateMutation.isPending}
                        className="cyber-button flex-1 h-14 !bg-primary text-on-primary-container border-primary flex items-center justify-center gap-4"
                    >
                        {updateMutation.isPending ? <RotateCcw size={18} className="animate-spin" /> : <Save size={18} />}
                        {updateMutation.isPending ? t('COMMITTING') : t('COMMIT_METADATA_SYNC')}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
