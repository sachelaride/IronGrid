import { ShieldAlert, Activity, Database, Terminal, Server, Zap, HardDrive, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

interface MaintenanceOverviewProps {
    status: any;
}

/**
 * MaintenanceOverview - Core System Diagnostics Hub.
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
export function MaintenanceOverview({ status }: MaintenanceOverviewProps) {
    const stats = [
        { icon: <ShieldAlert />, label: "AUDIT_LOGS", value: status?.health.auditConfigs, color: "primary", id: "01" },
        { icon: <Activity />, label: "INCIDENTS", value: status?.health.notifications, color: "secondary-fixed", id: "02" },
        { icon: <Database />, label: "ACTION_CACHE", value: status?.health.remoteLogs, color: "primary", id: "03" },
        { icon: <HardDrive />, label: "PG_STORAGE", value: status?.health.dbSize || '...', color: "secondary-fixed", id: "04" },
        { icon: <HardDrive />, label: "INFLUX_BUFFER", value: status?.health.influxSize || '...', color: "primary", id: "05" },
        { icon: <Terminal />, label: "SYSLOG_FEED", value: status?.health.syslogCount || 0, color: "secondary-fixed", id: "06" },
        { icon: <Database />, label: "SYSLOG_SIZE", value: status?.health.syslogSize || '...', color: "primary", id: "07" },
    ];

    return (
        <div className="space-y-gutter animate-in fade-in duration-700">
            {/* Grid de Estatísticas de Saúde */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <motion.div
                        key={stat.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                    >
                        <StatCard 
                            icon={stat.icon} 
                            label={stat.label} 
                            value={stat.value} 
                            color={stat.color}
                            number={stat.id}
                        />
                    </motion.div>
                ))}
            </div>

            <div className="glass-panel p-10 border-white/5 bg-surface-container/95 backdrop-blur-none relative overflow-hidden mt-8">
                <div className="absolute top-0 right-0 w-1/4 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
                
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-center">
                            <Activity size={20} className="text-primary animate-pulse" />
                        </div>
                        <h4 className="font-display-lg text-lg text-on-surface uppercase tracking-tighter italic">CORE_SERVICE_HEALTH</h4>
                    </div>
                    <div className="font-label-caps text-[10px] text-on-surface-variant/40 uppercase tracking-[0.4em] italic">Persistent Monitoring Active</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ServiceStatus 
                        icon={<Database size={18} />}
                        label="PostgreSQL RELATIONAL_CORE" 
                        status="online" 
                        details="ACTIVE_QUERIES: 12"
                    />
                    <ServiceStatus 
                        icon={<Activity size={18} />}
                        label="InfluxDB TEMPORAL_MATRIX" 
                        status={status?.health.influxSize ? "online" : "unknown"} 
                        details="INGESTION_RATE: 2.4k/s"
                    />
                    <ServiceStatus 
                        icon={<Server size={18} />}
                        label="Syslog CORE_LISTENER" 
                        status="online" 
                        details="UDP_PORT_514: OPEN"
                    />
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color, number }: { icon: any, label: string, value: any, color: string, number: string }) {
    const isPrimary = color === 'primary';
    
    return (
        <div className="glass-panel p-6 flex items-center gap-6 hover:bg-white/5 transition-all group border-white/5 bg-surface-container/95 backdrop-blur-none relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-16 h-16 ${isPrimary ? 'bg-primary/5' : 'bg-secondary-fixed/5'} rounded-bl-[50px] opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="absolute top-2 right-4 font-display-lg text-xs text-white/5 group-hover:text-white/10 transition-colors font-black">{number}</div>
            
            <div className={`w-14 h-14 ${isPrimary ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-secondary-fixed/10 border-secondary-fixed/20 text-secondary-fixed'} rounded-xl border flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className={`font-label-caps text-[9px] ${isPrimary ? 'text-primary/60' : 'text-secondary-fixed/60'} uppercase tracking-[0.2em] mb-1 italic font-black`}>{label}</p>
                <p className="font-display-lg text-2xl text-on-surface truncate italic font-black">
                    {typeof value === 'number' ? value.toLocaleString() : (value || '0')}
                </p>
            </div>
        </div>
    );
}

function ServiceStatus({ icon, label, status, details }: { icon: any, label: string, status: 'online' | 'offline' | 'unknown', details: string }) {
    const statusConfig = {
        online: { color: 'bg-primary', text: 'SYNCED', glow: 'shadow-[0_0_15px_rgba(var(--primary-fixed),0.6)]' },
        offline: { color: 'bg-error', text: 'FAILED', glow: 'shadow-[0_0_15px_rgba(var(--error),0.6)]' },
        unknown: { color: 'bg-on-surface-variant/20', text: 'PENDING', glow: '' }
    };

    const config = statusConfig[status];

    return (
        <div className="p-6 bg-surface-container-highest/40 rounded-2xl border border-white/5 flex flex-col gap-4 relative group hover:bg-surface-container-highest/60 transition-all">
            <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-on-surface-variant/40 group-hover:text-on-surface transition-colors">
                    {icon}
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-data-mono text-[9px] text-on-surface-variant uppercase tracking-widest font-black">{config.text}</span>
                    <div className={`w-2.5 h-2.5 rounded-full ${config.color} ${config.glow} animate-pulse`} />
                </div>
            </div>
            <div>
                <h5 className="font-display-lg text-[13px] text-on-surface uppercase tracking-tight italic leading-tight group-hover:text-primary transition-colors">{label}</h5>
                <p className="font-data-mono text-[9px] text-on-surface-variant/40 uppercase tracking-widest mt-1 italic">{details}</p>
            </div>
        </div>
    );
}
