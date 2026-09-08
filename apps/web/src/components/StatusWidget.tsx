import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface StatusWidgetProps {
    title: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
    icon: LucideIcon;
    color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info';
}

/**
 * StatusWidget - Tactical Telemetry Block.
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
export function StatusWidget({ title, value, icon: Icon, color = 'primary', trend, trendUp }: StatusWidgetProps) {
    const colorClasses = {
        primary: 'text-primary border-primary/20 bg-primary/5',
        secondary: 'text-secondary-fixed border-secondary-fixed/20 bg-secondary-fixed/5',
        error: 'text-error border-error/20 bg-error/5',
        warning: 'text-warning border-warning/20 bg-warning/5',
        info: 'text-primary-fixed border-primary-fixed/20 bg-primary-fixed/5',
    };

    const glowClasses = {
        primary: 'shadow-[0_0_30px_rgba(var(--primary-fixed),0.1)]',
        secondary: 'shadow-[0_0_30px_rgba(var(--secondary-fixed),0.1)]',
        error: 'shadow-[0_0_30px_rgba(var(--error),0.1)]',
        warning: 'shadow-[0_0_30px_rgba(var(--warning),0.1)]',
        info: 'shadow-[0_0_30px_rgba(var(--primary-fixed),0.1)]',
    };

    return (
        <motion.div 
            whileHover={{ y: -4, scale: 1.02 }}
            className={clsx(
                "glass-panel p-6 flex flex-col gap-6 group relative overflow-hidden transition-all duration-500",
                glowClasses[color]
            )}
        >
            {/* Background Aesthetic */}
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                <Icon size={80} />
            </div>
            
            <div className="flex items-center justify-between">
                <div className={clsx(
                    "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 relative overflow-hidden",
                    colorClasses[color]
                )}>
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Icon size={22} className="relative z-10" />
                </div>
                
                {trend && (
                    <div className={clsx(
                        "px-3 py-1 rounded-full font-data-mono text-[9px] uppercase tracking-[0.2em] font-black italic border transition-colors",
                        trendUp ? "bg-secondary-fixed/10 text-secondary-fixed border-secondary-fixed/20" : "bg-error/10 text-error border-error/20"
                    )}>
                        {trendUp ? '↑' : '↓'} {trend}
                    </div>
                )}
            </div>
            
            <div className="space-y-2 relative z-10">
                <p className="font-label-caps text-[10px] text-on-surface-variant/40 uppercase tracking-[0.4em] italic font-black group-hover:text-on-surface-variant/60 transition-colors">
                    {title}
                </p>
                <div className="flex items-baseline justify-between gap-4">
                    <p className="font-display-lg text-4xl text-on-surface tracking-tighter uppercase italic leading-none group-hover:text-primary transition-colors">
                        {value}
                    </p>
                </div>
            </div>

            {/* Bottom Glow Strip */}
            <div className={clsx(
                "absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-700",
                color === 'primary' ? 'bg-primary' : color === 'secondary' ? 'bg-secondary-fixed' : color === 'error' ? 'bg-error' : 'bg-warning'
            )} />
        </motion.div>
    );
}
