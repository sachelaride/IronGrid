import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { trpc } from '../utils/trpc';
import { X, CheckCircle, AlertCircle, Play, Loader2, Activity, MessageSquare, Shield, Zap, Globe, Cpu, Radio, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ManageDeviceModalProps {
    device: any;
    onClose: () => void;
}

/**
 * ManageDeviceModal - Operational Command Center for specific assets.
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
export function ManageDeviceModal({ device, onClose }: ManageDeviceModalProps) {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'monitoring' | 'actions' | 'tickets'>('monitoring');
    const [step, setStep] = useState<1 | 2>(1);
    const [community, setCommunity] = useState('irongrid');
    const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [snmpData, setSnmpData] = useState<any>(null);
    const [selectedInterfaces, setSelectedInterfaces] = useState<number[]>([]);

    const testConnection = (trpc.snmp as any).testConnection.useMutation();
    const startMonitoring = (trpc.snmp as any).startMonitoring.useMutation();

    const handleTest = async () => {
        setConnectionStatus('testing');
        setPingStatus('testing');
        try {
            const result = await testConnection.mutateAsync({
                ip: device.ip,
                community
            });

            if (result.success) {
                setPingStatus('success');
                setConnectionStatus('success');
                setSnmpData(result.data);

                const isLag = (i: any) => {
                    const name = ((i.alias || '') + ' ' + (i.description || '')).toLowerCase();
                    return name.includes('link aggregate') || name.includes(' lag') || name.includes('bond') || name.includes('port-channel');
                };

                const upIfaces = result.data.interfaces
                    .filter((i: any) => i.operStatus === 1 && !isLag(i))
                    .map((i: any) => i.index);
                setSelectedInterfaces(upIfaces);
                setTimeout(() => setStep(2), 800);
            } else {
                if (result.ping) {
                    setPingStatus('success');
                    setConnectionStatus('error');
                } else {
                    setPingStatus('error');
                    setConnectionStatus('idle');
                }
            }
        } catch (e) {
            setPingStatus('error');
            setConnectionStatus('error');
        }
    };

    const handleSave = async () => {
        try {
            await startMonitoring.mutateAsync({
                ip: device.ip,
                community,
                interfaces: selectedInterfaces
            });
            onClose();
        } catch (e) {
            console.error('Failed to start monitoring');
        }
    };

    const toggleInterface = (index: number) => {
        if (selectedInterfaces.includes(index)) {
            setSelectedInterfaces(prev => prev.filter(i => i !== index));
        } else {
            setSelectedInterfaces(prev => [...prev, index]);
        }
    };

    const tabs = [
        { id: 'monitoring', label: t('DM_MONITORING_SNMP'), icon: Activity },
        { id: 'tickets', label: t('DM_INCIDENT_FEED'), icon: MessageSquare }
    ];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="glass-panel border-white/10 bg-surface-container/95 backdrop-blur-none w-full max-w-4xl shadow-[0_50px_100px_rgba(0,0,0,0.9)] flex flex-col max-h-[90vh] overflow-hidden relative"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                
                {/* Header */}
                <div className="p-8 border-b border-white/5 relative">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-center relative shadow-[0_0_30px_rgba(var(--primary-fixed),0.1)]">
                                <div className="absolute inset-0 bg-primary/5 animate-pulse rounded-2xl" />
                                <Cpu className="text-primary relative z-10" size={32} />
                            </div>
                            <div>
                                <h2 className="font-display-lg text-3xl text-on-surface uppercase tracking-tighter italic leading-none">{t('DM_ASSET_DIAGNOSTICS')}</h2>
                                <p className="font-data-mono text-[11px] text-primary uppercase tracking-widest font-black mt-2 opacity-60 italic">{device.name || device.ipAddress} // GRID_ID: {device.id?.slice(0, 8)}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-12 h-12 rounded-xl hover:bg-white/5 text-on-surface-variant transition-all border border-transparent hover:border-white/10 flex items-center justify-center group">
                            <X size={24} className="group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>

                    <div className="flex gap-1 bg-surface-container-highest/30 p-1.5 rounded-2xl border border-white/5 max-w-2xl">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl font-display-lg text-[11px] uppercase italic tracking-tighter transition-all relative overflow-hidden ${
                                    activeTab === tab.id 
                                        ? 'bg-primary text-black shadow-lg font-black' 
                                        : 'text-on-surface-variant/60 hover:text-on-surface hover:bg-white/5'
                                }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <AnimatePresence mode="wait">


                        {activeTab === 'tickets' && (
                            <motion.div 
                                key="tickets"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <DeviceTicketsList deviceId={device.id} />
                            </motion.div>
                        )}

                        {activeTab === 'monitoring' && (
                            <motion.div 
                                key="monitoring"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-10"
                            >
                                {step === 1 ? (
                                    <div className="space-y-10">
                                        <div className="p-8 bg-primary/5 border border-primary/20 rounded-2xl relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="flex gap-6">
                                                <div className="w-12 h-12 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-center shrink-0">
                                                    <Shield size={24} className="text-primary" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="font-display-lg text-lg text-primary uppercase italic tracking-tighter">{t('DM_PROTOCOL_AUTH_REQ')}</h4>
                                                    <p className="font-label-caps text-[11px] text-primary/60 uppercase tracking-widest leading-relaxed italic">{t('DM_AUTH_DESCRIPTION')}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-4">
                                                <label className="font-label-caps text-[10px] text-on-surface-variant/40 uppercase tracking-[0.3em] ml-1 italic font-black">{t('DM_COMMUNITY_ID')}</label>
                                                <div className="relative group">
                                                    <input
                                                        type="text"
                                                        value={community}
                                                        onChange={(e) => setCommunity(e.target.value)}
                                                        className="h-16 w-full bg-surface-container-highest/60 border-white/5 font-data-mono text-xs uppercase tracking-[0.2em] px-6 focus:border-primary/50 transition-all rounded-xl shadow-inner"
                                                        placeholder="IRONGID_CORE"
                                                    />
                                                    <Radio className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 pointer-events-none group-focus-within:text-primary transition-colors" />
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <label className="font-label-caps text-[10px] text-on-surface-variant/40 uppercase tracking-[0.3em] ml-1 italic font-black">{t('DM_TEST_SUITE')}</label>
                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={handleTest}
                                                        disabled={connectionStatus === 'testing'}
                                                        className="cyber-button flex-1 h-16 !bg-primary text-black border-primary font-display-lg text-lg uppercase italic tracking-tighter shadow-primary/20"
                                                    >
                                                        {connectionStatus === 'testing' ? <Loader2 size={24} className="animate-spin" /> : <Play size={24} />}
                                                        {t('DM_INIT_HANDSHAKE')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 pt-10">
                                            <DiagnosticStatus label={t('DM_ICMP_ECHO')} status={pingStatus} />
                                            <DiagnosticStatus label={t('DM_SNMP_STREAM')} status={connectionStatus} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                        <div className="flex items-center justify-between border-b border-white/5 pb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-secondary-fixed/10 rounded-xl border border-secondary-fixed/20 flex items-center justify-center text-secondary-fixed">
                                                    <Layers size={20} />
                                                </div>
                                                <h3 className="font-display-lg text-2xl text-on-surface uppercase tracking-tighter italic">{t('DM_INTERFACE_MATRIX')}</h3>
                                            </div>
                                            <div className="font-data-mono text-[11px] text-secondary-fixed uppercase tracking-widest font-black bg-secondary-fixed/5 px-4 py-1 rounded-full border border-secondary-fixed/10">
                                                {t('DM_CHANNELS_ARMED').replace('{count}', String(selectedInterfaces.length))}
                                            </div>
                                        </div>

                                        <div className="glass-panel border-white/5 overflow-hidden shadow-inner bg-surface-container/95">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="bg-surface-container-highest/40 border-b border-white/5">
                                                        <th className="p-5 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.3em] italic">ARM</th>
                                                        <th className="p-5 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.3em] italic">IDX</th>
                                                        <th className="p-5 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.3em] italic">LOGICAL_IDENTIFIER</th>
                                                        <th className="p-5 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.3em] italic">STATUS</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {snmpData?.interfaces.map((iface: any) => (
                                                        <tr
                                                            key={iface.index}
                                                            className={`hover:bg-primary/5 cursor-pointer transition-all group ${selectedInterfaces.includes(iface.index) ? 'bg-primary/5' : ''}`}
                                                            onClick={() => toggleInterface(iface.index)}
                                                        >
                                                            <td className="p-5">
                                                                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${selectedInterfaces.includes(iface.index) ? 'bg-primary border-primary shadow-[0_0_15px_rgba(var(--primary-fixed),0.4)]' : 'border-white/10 group-hover:border-primary/40'}`}>
                                                                    {selectedInterfaces.includes(iface.index) && <CheckCircle size={14} className="text-black" />}
                                                                </div>
                                                            </td>
                                                            <td className="p-5 font-data-mono text-[11px] text-on-surface-variant/60 group-hover:text-primary transition-colors">#{iface.index.toString().padStart(2, '0')}</td>
                                                            <td className="p-5">
                                                                <div className="flex flex-col">
                                                                    <span className="font-display-lg text-[13px] text-on-surface uppercase italic tracking-tight group-hover:text-primary transition-colors">
                                                                        {iface.alias || iface.description}
                                                                    </span>
                                                                    {iface.alias && (
                                                                        <span className="font-data-mono text-[9px] text-on-surface-variant/40 uppercase tracking-widest font-black italic">
                                                                            {iface.description}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-5">
                                                                {iface.operStatus === 1
                                                                    ? <div className="flex items-center gap-3">
                                                                        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-fixed),0.8)]" />
                                                                        <span className="font-data-mono text-[10px] text-primary uppercase font-black italic">{t('DM_UP_STREAMING')}</span>
                                                                      </div>
                                                                    : <div className="flex items-center gap-3 opacity-30">
                                                                        <div className="w-2 h-2 rounded-full bg-on-surface-variant" />
                                                                        <span className="font-data-mono text-[10px] text-on-surface-variant uppercase font-black italic">{t('DM_DOWN_IDLE')}</span>
                                                                      </div>
                                                                }
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-white/5 bg-surface-container/80 backdrop-blur-xl flex justify-between items-center">
                    <div>
                        {step === 2 && activeTab === 'monitoring' && (
                            <button
                                onClick={() => setStep(1)}
                                className="font-label-caps text-[10px] text-on-surface-variant/40 hover:text-primary uppercase tracking-[0.4em] italic transition-all"
                            >
                                ← {t('DM_BACK_TO_AUTH')}
                            </button>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="h-12 px-8 font-label-caps text-[11px] text-on-surface-variant/60 hover:text-on-surface uppercase tracking-[0.4em] transition-all italic"
                        >
                            {t('DM_ABORT_MISSION')}
                        </button>
                        {step === 2 && activeTab === 'monitoring' && (
                            <button
                                onClick={handleSave}
                                className="cyber-button h-12 px-10 !bg-secondary-fixed text-black border-secondary-fixed font-display-lg text-md uppercase italic tracking-tighter shadow-secondary-fixed/20"
                            >
                                <Zap size={18} />
                                {t('DM_ARM_MONITORING')}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function DiagnosticStatus({ label, status }: { label: string, status: string }) {
    const { t } = useLanguage();
    const isTesting = status === 'testing';
    const isSuccess = status === 'success';
    const isError = status === 'error';

    return (
        <div className="flex items-center justify-between p-6 bg-surface-container-highest/20 rounded-2xl border border-white/5 relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-1 h-full transition-all ${isSuccess ? 'bg-primary' : isError ? 'bg-error' : 'bg-white/5'}`} />
            <span className="font-label-caps text-[10px] text-on-surface-variant/60 uppercase tracking-[0.3em] italic font-black">{label}</span>
            <div className="flex items-center gap-4">
                {isTesting && (
                    <>
                        <span className="font-data-mono text-[10px] text-primary animate-pulse uppercase font-black italic">{t('DM_PROBING')}</span>
                        <Loader2 size={16} className="text-primary animate-spin" />
                    </>
                )}
                {isSuccess && (
                    <>
                        <span className="font-data-mono text-[10px] text-primary uppercase font-black italic">{t('DM_RESPONSE_ACK')}</span>
                        <CheckCircle size={16} className="text-primary shadow-primary" />
                    </>
                )}
                {isError && (
                    <>
                        <span className="font-data-mono text-[10px] text-error uppercase font-black italic">{t('DM_NO_CARRIER')}</span>
                        <AlertCircle size={16} className="text-error" />
                    </>
                )}
                {status === 'idle' && (
                    <span className="font-data-mono text-[10px] text-on-surface-variant/20 uppercase font-black italic">{t('DM_AWAITING_INIT')}</span>
                )}
            </div>
        </div>
    );
}

function DeviceTicketsList({ deviceId }: { deviceId: string }) {
    const { t } = useLanguage();
    const { data: tickets = [], isLoading } = trpc.tickets.list.useQuery({ deviceId });

    return (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-center text-primary">
                        <MessageSquare size={20} />
                    </div>
                    <h3 className="font-display-lg text-2xl text-on-surface uppercase tracking-tighter italic">{t('DM_INCIDENT_HISTORY')}</h3>
                </div>
                <div className="font-data-mono text-[11px] text-primary uppercase tracking-widest font-black bg-primary/5 px-4 py-1 rounded-full border border-primary/10">
                    {t('DM_ACTIVE_THREADS').replace('{count}', String(tickets.length))}
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
                    <Loader2 size={40} className="animate-spin text-primary" />
                    <span className="font-label-caps text-[11px] uppercase tracking-[0.5em] italic">{t('DM_RETRIEVING_DATA')}</span>
                </div>
            ) : tickets.length === 0 ? (
                <div className="bg-surface-container-high/10 p-20 rounded-3xl border-2 border-dashed border-white/5 text-center flex flex-col items-center gap-6">
                    <Shield size={48} className="text-on-surface-variant/20" />
                    <div className="space-y-2">
                        <p className="font-display-lg text-lg text-on-surface-variant/40 uppercase italic tracking-tighter">{t('DM_CLEAR_RECORD')}</p>
                        <p className="font-label-caps text-[10px] text-on-surface-variant/20 uppercase tracking-[0.4em] italic">{t('DM_NO_INCIDENTS')}</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tickets.map((ticket: any) => (
                        <div key={ticket.id} className="glass-panel p-6 border-white/5 bg-surface-container/95 hover:bg-primary/5 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <MessageSquare size={48} />
                            </div>
                            <div className="flex justify-between items-start mb-6">
                                <span className="font-data-mono text-[10px] text-primary font-black uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-lg">ID_{ticket.ticketNumber}</span>
                                <span className="font-label-caps text-[9px] text-on-surface-variant/40 uppercase tracking-widest italic">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>
                            <h4 className="font-display-lg text-lg text-on-surface uppercase italic tracking-tight mb-4 group-hover:text-primary transition-colors leading-tight">{ticket.title}</h4>
                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-white/5" />
                                <span className={`font-data-mono text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-md border ${
                                    ticket.status === 'open' ? 'text-error border-error/20 bg-error/5' : 'text-primary border-primary/20 bg-primary/5'
                                }`}>
                                    STATUS_{ticket.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function Layers({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>;
}
