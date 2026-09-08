import { useState, useEffect, useRef } from 'react';
import { Globe, Terminal, Lock, X, ExternalLink, Copy, Check, Zap, Shield, Radio, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NetAccessModalProps {
    device: any;
    onClose: () => void;
    triggerRect?: DOMRect | null;
}

type Protocol = 'http' | 'https' | 'telnet';

const PROTOCOL_DEFAULTS: Record<Protocol, { port: number; label: string; icon: React.ReactNode; color: string }> = {
    http:   { port: 80,  label: 'HTTP',   icon: <Globe    className="h-4 w-4" />, color: 'primary' },
    https:  { port: 443, label: 'HTTPS',  icon: <Lock     className="h-4 w-4" />, color: 'emerald-500' },
    telnet: { port: 23,  label: 'Telnet', icon: <Terminal className="h-4 w-4" />, color: 'secondary-fixed' },
};

/**
 * NetAccessModal - Direct protocol injection gateway.
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
export function NetAccessModal({ device, onClose, triggerRect }: NetAccessModalProps) {
    const [protocol, setProtocol] = useState<Protocol>('http');
    const [port, setPort] = useState(80);
    const [copied, setCopied] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    // Update port when protocol changes
    useEffect(() => {
        setPort(PROTOCOL_DEFAULTS[protocol].port);
    }, [protocol]);

    // Calculate position relative to triggerRect
    useEffect(() => {
        if (!triggerRect) return;

        const spaceBelow = window.innerHeight - triggerRect.bottom;
        const modalHeight = 420; // Expected height
        const modalWidth = 340;  // Expected width
        
        let top = triggerRect.bottom + 12;
        let left = triggerRect.left;

        // If not enough space below, show above
        if (spaceBelow < modalHeight) {
            top = triggerRect.top - modalHeight - 12;
        }

        // Adjust horizontally if it overflows
        if (left + modalWidth > window.innerWidth) {
            left = window.innerWidth - modalWidth - 16;
        }

        setPosition({ top, left });
    }, [triggerRect]);

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const timeout = setTimeout(() => {
            document.addEventListener('mousedown', handler);
        }, 10);
        return () => {
            clearTimeout(timeout);
            document.removeEventListener('mousedown', handler);
        };
    }, [onClose]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    const buildUrl = () => {
        if (protocol === 'telnet') return `telnet://${device.ip}:${port}`;
        const defaultPort = PROTOCOL_DEFAULTS[protocol].port;
        return port === defaultPort
            ? `${protocol}://${device.ip}`
            : `${protocol}://${device.ip}:${port}`;
    };

    const handleOpen = () => {
        window.open(buildUrl(), '_blank', 'noopener,noreferrer');
        onClose();
    };

    const handleCopy = () => {
        const text = protocol === 'telnet'
            ? `telnet ${device.ip} ${port}`
            : buildUrl();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!triggerRect) return null;

    const currentMeta = PROTOCOL_DEFAULTS[protocol];

    return (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                ref={modalRef}
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                onClick={(e) => e.stopPropagation()}
                style={{ 
                    top: `${position.top}px`, 
                    left: `${position.left}px`,
                    width: '340px'
                }}
                className="fixed z-[101] glass-panel p-6 shadow-[0_30px_90px_rgba(0,0,0,0.8)] border-white/10 bg-surface-container/95 backdrop-blur-none overflow-hidden"
            >
                <div className={`absolute top-0 left-0 w-full h-1 bg-${currentMeta.color} shadow-[0_0_15px_rgba(var(--${currentMeta.color === 'primary' ? 'primary-fixed' : currentMeta.color === 'emerald-500' ? 'primary-fixed' : 'secondary-fixed'}),0.5)] transition-all`} />
                
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 bg-${currentMeta.color}/10 rounded-xl border border-${currentMeta.color}/20 flex items-center justify-center relative`}>
                            <div className={`absolute inset-0 bg-${currentMeta.color}/5 animate-pulse rounded-xl`} />
                            <Radio className={`text-${currentMeta.color} relative z-10`} size={24} />
                        </div>
                        <div>
                            <span className="font-label-caps text-[9px] text-on-surface-variant/60 uppercase tracking-[0.3em] italic font-black">REMOTE_GATEWAY</span>
                            <h3 className="font-display-lg text-lg text-on-surface uppercase tracking-tighter italic leading-none truncate max-w-[160px]">
                                {device.name || device.ip}
                            </h3>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl hover:bg-white/5 text-on-surface-variant transition-all border border-transparent hover:border-white/10 flex items-center justify-center"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Protocol matrix */}
                <div className="space-y-4 mb-8">
                    <label className="font-label-caps text-[9px] text-on-surface-variant/40 uppercase tracking-widest ml-1 italic">PROTOCOL_MATRIX</label>
                    <div className="flex gap-2 bg-surface-container-highest/40 p-1.5 rounded-2xl border border-white/5">
                        {(Object.entries(PROTOCOL_DEFAULTS) as [Protocol, typeof PROTOCOL_DEFAULTS[Protocol]][]).map(([key, meta]) => (
                            <button
                                key={key}
                                onClick={() => setProtocol(key)}
                                className={`flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-xl transition-all relative overflow-hidden ${
                                    protocol === key
                                        ? `bg-${meta.color === 'primary' ? 'primary' : meta.color === 'emerald-500' ? 'emerald-500' : 'secondary-fixed'} text-black shadow-lg`
                                        : 'text-on-surface-variant/60 hover:text-on-surface hover:bg-white/5'
                                }`}
                            >
                                {meta.icon}
                                <span className={`font-data-mono text-[9px] font-black uppercase tracking-tighter ${protocol === key ? 'text-black' : ''}`}>{meta.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Port selector */}
                <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between px-1">
                        <label className="font-label-caps text-[9px] text-on-surface-variant/40 uppercase tracking-widest italic">INJECTION_PORT</label>
                        <div className="flex gap-2">
                            {Object.entries(PROTOCOL_DEFAULTS).map(([key, meta]) => (
                                <button
                                    key={key}
                                    onClick={() => setPort(meta.port)}
                                    className={`font-data-mono text-[9px] font-black px-2 py-0.5 rounded-lg border transition-all ${
                                        port === meta.port
                                            ? `border-${meta.color}/40 text-${meta.color} bg-${meta.color}/5`
                                            : 'border-white/5 text-on-surface-variant/40 hover:border-white/10'
                                    }`}
                                >
                                    :{meta.port}
                                </button>
                            ))}
                        </div>
                    </div>
                    <input
                        type="number"
                        value={port}
                        onChange={(e) => setPort(Number(e.target.value))}
                        className="h-12 w-full bg-surface-container-highest/60 border-white/5 font-data-mono text-xs uppercase tracking-[0.2em] px-4 focus:border-primary/50 transition-all rounded-xl shadow-inner"
                    />
                </div>

                {/* Stream preview */}
                <div className="space-y-4 mb-10">
                    <label className="font-label-caps text-[9px] text-on-surface-variant/40 uppercase tracking-widest ml-1 italic">STREAM_ENDPOINT</label>
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center gap-4 relative group">
                        <div className="w-1 h-8 bg-on-surface-variant/10 rounded-full" />
                        <span className="font-data-mono text-[10px] text-on-surface/60 flex-1 truncate italic">
                            {protocol === 'telnet' ? `telnet ${device.ip} ${port}` : buildUrl()}
                        </span>
                        <button 
                            onClick={handleCopy} 
                            className="w-10 h-10 rounded-xl hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-all flex items-center justify-center shrink-0"
                        >
                            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <button
                    onClick={handleOpen}
                    className={`cyber-button w-full h-14 flex items-center justify-center gap-4 !bg-${currentMeta.color === 'primary' ? 'primary' : currentMeta.color === 'emerald-500' ? 'emerald-500' : 'secondary-fixed'} text-black border-transparent font-display-lg text-lg uppercase italic tracking-tighter shadow-xl`}
                >
                    <ExternalLink size={20} />
                    INIT_GATEWAY
                </button>
            </motion.div>
        </div>
    );
}
