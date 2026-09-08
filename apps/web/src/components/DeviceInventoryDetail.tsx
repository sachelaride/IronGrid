import { useState } from 'react';
import { createPortal } from 'react-dom';
import { trpc } from '../utils/trpc';
import {
    Cpu, HardDrive, Layout, Package, Shield, MapPin, Building, User,
    DollarSign, TrendingUp, Usb, ShieldCheck, ShieldAlert, ShieldOff,
    BarChart3, Clock, AlertTriangle, CheckCircle2, XCircle, Lock, Unlock, X, Monitor
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface DeviceInventoryDetailProps {
    deviceId: string;
    onClose: () => void;
}

export function DeviceInventoryDetail({ deviceId, onClose }: DeviceInventoryDetailProps) {
    const { t, language } = useLanguage();
    const { data: device, isLoading } = (trpc as any).inventory.getDeviceInventory.useQuery({ deviceId });
    const { data: appUsage } = (trpc as any).reports.getAppUsageReport.useQuery({ deviceId, days: 7 });



    if (isLoading) return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[9999] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-primary font-bold animate-pulse">{t('LOADING_INVENTORY')}</p>
            </div>
        </div>
    );
    if (!device) return (
        <div className="fixed inset-0 bg-slate-950/90 z-[9999] flex items-center justify-center">
            <div className="text-red-400 font-bold">{t('ASSET_NOT_FOUND')}</div>
        </div>
    );

    const hw = device.hardware;
    const security = device.security;
    const agentConnected = device.status === 'ONLINE' && device.agentId;

    const currencyCode = language === 'PT-BR' ? 'BRL' : (language === 'ES' ? 'EUR' : 'USD');
    const currencyLocale = language === 'PT-BR' ? 'pt-BR' : (language === 'ES' ? 'es-ES' : 'en-US');



    const avStatusColor = () => {
        const s = security?.avStatus?.toLowerCase() || '';
        if (s.includes('desatualizado') || s.includes('outdated')) return 'text-amber-400';
        if (s.includes('inativo') || s.includes('inactive') || s.includes('erro') || s.includes('error')) return 'text-red-400';
        if (s.includes('ativo') || s.includes('active')) return 'text-emerald-400';
        return 'text-on-surface-variant/70';
    };

    const AvIcon = () => {
        const s = security?.avStatus?.toLowerCase() || '';
        if (s.includes('desatualizado') || s.includes('outdated')) return <ShieldAlert className="w-5 h-5 text-amber-400" />;
        if (s.includes('inativo') || s.includes('inactive') || s.includes('erro') || s.includes('error')) return <ShieldOff className="w-5 h-5 text-red-400" />;
        if (s.includes('ativo') || s.includes('active')) return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
        return <Shield className="w-5 h-5 text-on-surface-variant/70" />;
    };

    const maxUsage = appUsage?.[0]?.totalMinutes || 1;

    return createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
            <div className="flex min-h-screen items-start justify-center pt-4 px-3 pb-3">
                <div className="glass-panel rounded-[32px] w-full max-w-7xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 shadow-[0_0_100px_rgba(0,0,0,0.5)] border-white/5">
                    
                    {/* Header: Estilo EditDeviceModal */}
                    <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-2xl">
                                <Cpu className="w-7 h-7" />
                            </div>
                            <div className="space-y-0.5">
                                <h2 className="text-2xl font-black text-on-surface uppercase tracking-wider italic">{device.name || device.hostname}</h2>
                                <div className="flex items-center gap-3">
                                    <span className="font-data-mono text-[10px] bg-white/5 px-2 py-0.5 rounded text-primary font-black">{device.ipAddress}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                    <span className="font-label-caps text-[10px] text-on-surface-variant font-black uppercase tracking-widest">{device.type}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                    <div className="flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full ${device.status === 'ONLINE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                                        <span className={`font-data-mono text-[10px] font-black uppercase ${device.status === 'ONLINE' ? 'text-emerald-500' : 'text-red-500'}`}>{device.status}</span>
                                    </div>
                                    {agentConnected && (
                                        <span className="text-[9px] bg-primary text-black px-3 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-lg shadow-primary/20 ml-2 animate-pulse">{t('AGENT_ONLINE')}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {(device as any).rustdeskId && (
                                <div className="flex flex-col items-end mr-4">
                                    <button 
                                        onClick={() => window.open(`rustdesk://${(device as any).rustdeskId}`, '_self')}
                                        className="cyber-button px-6 py-3 rounded-[16px] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 flex items-center gap-2 bg-primary text-black hover:brightness-110 transition-all"
                                    >
                                        <Monitor className="w-4 h-4" /> {t('RUSTDESK_CONNECT') || 'Acesso Remoto'}
                                    </button>
                                    {(device as any).rustdeskPassword && (
                                        <span className="text-[9px] text-on-surface-variant/60 font-data-mono mt-1 pr-1">
                                            Senha: {(device as any).rustdeskPassword}
                                        </span>
                                    )}
                                </div>
                            )}
                            <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group border border-white/5">
                                <X className="h-6 w-6 text-on-surface-variant/70 group-hover:text-on-surface transition-colors" />
                            </button>
                        </div>
                    </div>

                    {/* Body: Grid Layout similar ao Edit */}
                    <div className="p-8 overflow-y-auto scrollbar-hide max-h-[80vh]">
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                            
                            {/* COLUNA ESQUERDA (SIDEBAR) */}
                            <div className="xl:col-span-4 space-y-6">
                                
                                {/* HARDWARE SUMMARY */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-1">{t('HARDWARE_SUMMARY')}</h3>
                                    <div className="bg-surface-container-low/40 rounded-[24px] border border-white/5 p-5 space-y-4 backdrop-blur-sm">
                                        <SpecItem icon={Cpu} label={t('PROCESSOR')} value={hw?.cpuModel || t('UNKNOWN')} />
                                        <SpecItem icon={Monitor} label={t('RAM_MEMORY')} value={hw?.totalMemory ? `${(Number(hw.totalMemory) / (1024 ** 3)).toFixed(1)} GB` : 'N/A'} />
                                        <SpecItem icon={HardDrive} label={t('STORAGE')} value={hw?.totalDisk ? `${(Number(hw.totalDisk) / (1024 ** 3)).toFixed(1)} GB` : 'N/A'} />
                                        <SpecItem icon={Cpu} label={t('VIDEO_CARD')} value={hw?.gpuModel || t('INTEGRATED')} />
                                        <SpecItem icon={Shield} label={t('MOTHERBOARD')} value={hw?.motherboard || 'N/A'} subValue={`S/N: ${hw?.serialNumber || '-'}`} />
                                    </div>
                                </div>

                                {/* SECURITY PANEL */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <ShieldCheck className="w-3 h-3" /> {t('SECURITY_PROTOCOL')}
                                    </h3>
                                    <div className="bg-emerald-500/5 rounded-[24px] border border-emerald-500/10 p-5 space-y-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                                                <AvIcon />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest mb-0.5">{t('ANTIVIRUS')}</p>
                                                <p className="text-xs text-on-surface font-black uppercase italic">{security?.av || t('UNKNOWN')}</p>
                                                <p className={`text-[10px] font-black uppercase ${avStatusColor()}`}>{security?.avStatus || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-white/5 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <p className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest">{t('USB_CONTROL')}</p>
                                                {security?.usbBlocked ? (
                                                    <span className="flex items-center gap-1.5 text-[9px] text-red-500 font-black bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1 uppercase italic">
                                                        <Lock className="w-2.5 h-2.5" /> {t('BLOCKED')}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-[9px] text-emerald-500 font-black bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 uppercase italic">
                                                        <Unlock className="w-2.5 h-2.5" /> {t('UNLOCKED')}
                                                    </span>
                                                )}
                                            </div>




                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* COLUNA DIREITA (CONTENT) */}
                            <div className="xl:col-span-8 space-y-8">
                                
                                {/* TOP APPS & USAGE */}
                                {appUsage && appUsage.length > 0 && (
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <BarChart3 className="w-5 h-5 text-primary" />
                                            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{t('APP_FORENSICS')} ({t('LAST_7_DAYS')})</h3>
                                        </div>
                                        <div className="bg-surface-container-low/40 rounded-[28px] border border-white/5 p-6 backdrop-blur-sm grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                            {appUsage.slice(0, 10).map((app: any, i: number) => (
                                                <div key={app.appName} className="space-y-1.5">
                                                    <div className="flex justify-between items-center px-1">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className="text-[9px] font-black text-primary/40 w-4">{i + 1}.</span>
                                                            <span className="text-[11px] text-on-surface font-black truncate italic">{app.appName}</span>
                                                        </div>
                                                        <span className="text-[9px] text-on-surface-variant/60 font-data-mono flex items-center gap-1.5 ml-2 flex-shrink-0">
                                                            <Clock className="w-2.5 h-2.5" />{app.totalMinutes}m
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min((app.totalMinutes / maxUsage) * 100, 100)}%` }}
                                                            transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 }}
                                                            className="h-full rounded-full shadow-[0_0_10px_rgba(var(--primary-fixed),0.3)]"
                                                            style={{ background: 'var(--primary)' }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* SOFTWARE REPOSITORY */}
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Package className="w-5 h-5 text-primary" />
                                            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                                                {t('SOFTWARE_INVENTORY')}
                                                <span className="ml-3 text-[9px] text-on-surface-variant/40 font-black">({device.software?.length || 0} TOTAL)</span>
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="bg-surface-container-low/40 rounded-[28px] border border-white/5 overflow-hidden backdrop-blur-sm shadow-2xl">
                                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-white/[0.02] text-on-surface-variant uppercase font-black sticky top-0 z-10 border-b border-white/5">
                                                    <tr>
                                                        <th className="px-6 py-4 text-[9px] tracking-widest">{t('IDENTITY')}</th>
                                                        <th className="px-6 py-4 text-[9px] tracking-widest">{t('REVISION')}</th>
                                                        <th className="px-6 py-4 text-[9px] tracking-widest">{t('VENDOR')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {device.software?.length === 0 && (
                                                        <tr>
                                                            <td colSpan={3} className="px-6 py-12 text-center text-on-surface-variant/30 italic uppercase font-black text-[10px] tracking-widest">
                                                                {t('NO_SOFTWARE_DETECTED')}
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {device.software?.map((sw: any) => (
                                                        <tr key={sw.id} className="hover:bg-white/[0.02] transition-colors group">
                                                            <td className="px-6 py-3">
                                                                <span className="text-[11px] text-on-surface font-black group-hover:text-primary transition-colors italic">{sw.name}</span>
                                                            </td>
                                                            <td className="px-6 py-3 text-[10px] font-data-mono text-on-surface-variant/60">{sw.version}</td>
                                                            <td className="px-6 py-3 text-[10px] text-on-surface-variant/40 uppercase tracking-tighter italic">{sw.publisher}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </section>

                                {/* INFRASTRUCTURE DETAILS (Peripherals & Interfaces) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <section className="space-y-4">
                                        <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                            <Usb className="w-3 h-3" /> {t('PERIPHERALS')}
                                        </h3>
                                        <div className="space-y-2">
                                            {device.peripherals?.map((p: any) => (
                                                <div key={p.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center group hover:border-primary/20 transition-all">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-on-surface uppercase italic group-hover:text-primary transition-colors">{p.type}</span>
                                                        <span className="text-[9px] text-on-surface-variant/60 font-bold uppercase">{p.model}</span>
                                                    </div>
                                                    <span className="text-[8px] font-data-mono text-on-surface-variant/30 uppercase tracking-tighter">{p.serialNumber}</span>
                                                </div>
                                            ))}
                                            {device.peripherals?.length === 0 && <p className="text-on-surface-variant/30 italic text-[10px] uppercase font-black tracking-widest ml-1">{t('NO_PERIPHERALS_DETECTED')}</p>}
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1">{t('NETWORK_ADAPTERS')}</h3>
                                        <div className="space-y-2">
                                            {device.networkInterfaces?.map((i: any) => (
                                                <div key={i.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-primary/20 transition-all">
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <span className="text-[10px] font-black text-primary uppercase italic group-hover:brightness-125 transition-all">{i.name}</span>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${i.status === 'up' ? 'bg-emerald-500 animate-pulse' : 'bg-on-surface-variant/20'}`} />
                                                            <span className={`text-[9px] font-black uppercase ${i.status === 'up' ? 'text-emerald-500' : 'text-on-surface-variant/40'}`}>{i.status}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-[9px] font-data-mono text-on-surface-variant/40 flex justify-between items-center">
                                                        <span>{i.macAddress}</span>
                                                        <span className="text-on-surface-variant/60">{(Number(i.speed) / 10 ** 6).toFixed(0)} MBPS</span>
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer: Close Button */}
                    <div className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-end">
                        <button
                            onClick={onClose}
                            className="cyber-button px-12 py-5 rounded-[20px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/20"
                        >
                            {t('CLOSE_PROTOCOL')}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

function SpecItem({ icon: Icon, label, value, subValue }: any) {
    return (
        <div className="flex items-start gap-4 p-1">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-on-surface-variant/40 flex-shrink-0 group-hover:text-primary transition-all">
                <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
                <p className="text-[9px] font-black text-on-surface-variant/30 uppercase tracking-widest leading-none mb-1.5">{label}</p>
                <p className="text-[11px] text-on-surface font-black tracking-tight uppercase italic truncate">{value}</p>
                {subValue && <p className="text-[9px] text-on-surface-variant/40 font-data-mono italic mt-1 tracking-tighter">{subValue}</p>}
            </div>
        </div>
    );
}
