import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '../utils/trpc';
import { StatusWidget } from './StatusWidget';
import { MetricChart } from './MetricChart';
import {
    Cpu,
    Wifi,
    Database,
    Activity,
    AlertCircle,
    Shield,
    Users,
    MapPin,
    Clock,
    TrendingUp,
    ShieldAlert,
    Terminal,
    HeartPulse,
    ShieldCheck,
    DollarSign,
    Zap,
    Scale,
    Server as ServerIcon,
    FileText
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Formata números grandes com sufixos compactos
 * Exemplos: 1500 -> 1.5K, 412195 -> 412.2K, 2500000 -> 2.5M
 */
function formatNumber(num: number): string {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
}


export function Dashboard() {
    const { t } = useLanguage();
    const [profile, setProfile] = useState<'technical' | 'executive' | 'strategic'>('technical');

    return (
        <div className="space-y-gutter animate-in fade-in duration-700 pt-4">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h1 className="font-display-lg text-display-lg text-primary uppercase tracking-tighter mb-1">{t('NAV_DASHBOARD')}</h1>
                    <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse status-glow-success"></span>
                        <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">{t('REAL_TIME_INTELLIGENCE')}</p>
                    </div>
                </div>

                {/* Profile Selector */}
                <div className="flex flex-wrap bg-surface-container-high p-1 rounded-lg border border-white/5 backdrop-blur-xl w-full sm:w-auto">
                    <ProfileTab active={profile === 'technical'} onClick={() => setProfile('technical')} label={t('TECHNICAL')} icon={Activity} />
                    <ProfileTab active={profile === 'executive'} onClick={() => setProfile('executive')} label={t('EXECUTIVE')} icon={Shield} />
                    <ProfileTab active={profile === 'strategic'} onClick={() => setProfile('strategic')} label={t('STRATEGIC')} icon={TrendingUp} />
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={profile}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    {profile === 'technical' && <TechnicalView />}
                    {profile === 'executive' && <ExecutiveView />}
                    {profile === 'strategic' && <StrategicView />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function ProfileTab({ active, onClick, label, icon: Icon }: any) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded font-label-caps text-label-caps uppercase tracking-wider transition-all flex items-center gap-2 relative ${active ? 'text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'}`}
        >
            {active && (
                <motion.div 
                    layoutId="profile-tab-active"
                    className="absolute inset-0 bg-primary rounded shadow-lg -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}
            <Icon size={14} className={active ? 'text-on-primary-container' : 'opacity-60'} /> {label}
        </button>
    );
}

// --- VISÃO TÉCNICA (Monitoramento de Infra e Performance) ---
/**
 * Visão Técnica - Focada em métricas de performance e infraestrutura crítica.
 * @private
 */
function TechnicalView() {
    const { t } = useLanguage();
    const { data: serverStats } = trpc.dashboard.getServerStats.useQuery(undefined, { refetchInterval: 3000 });
    const { data: globalStats } = trpc.dashboard.getGlobalStats.useQuery(undefined, { refetchInterval: 10000 });
    const { data: techStats } = (trpc.dashboard as any).getTechnicalStats.useQuery(undefined, { refetchInterval: 3000 });
    const { data: maintenanceStatus } = (trpc as any).system.getMaintenanceStatus.useQuery(undefined, { refetchInterval: 3000 });

    const [realTimeData, setRealTimeData] = useState<any[]>([]);
    const [realTimeCpuData, setRealTimeCpuData] = useState<any[]>([]);

    useEffect(() => {
        if (serverStats) {
            const now = new Date();
            const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            setRealTimeData(prev => [...prev, {
                time: timeStr,
                value: Number(((serverStats.network.rx_sec + serverStats.network.tx_sec) * 8 / 1000 / 1000).toFixed(1))
            }].slice(-30));
            
            setRealTimeCpuData(prev => [...prev, {
                time: timeStr,
                value: Number(serverStats.cpu.load.toFixed(1))
            }].slice(-30));
        }
    }, [serverStats]);

    return (
        <div className="space-y-gutter">
            {/* Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                <StatusCard 
                    label={t('DB_SYSTEM_STATUS')} 
                    value={t('DB_HEALTHY')} 
                    status={t('DB_ALL_NODES_OK')} 
                    color="secondary-fixed" 
                    icon={<Activity size={48} />} 
                    glow="status-glow-success"
                />
                <StatusCard 
                    label={t('DB_ACTIVE_NODES')} 
                    value={`${globalStats?.online || 0}`} 
                    total={`/${globalStats?.total || 0}`}
                    progress={(globalStats?.online || 0) / (globalStats?.total || 1) * 100}
                    color="primary" 
                    icon={<ServerIcon size={48} />} 
                />
                <StatusCard 
                    label={t('DB_CRITICAL_ALERTS')} 
                    value={techStats?.criticalAlertsCount.toString() || '0'} 
                    status={t('DB_ACTION_REQ')} 
                    color="error" 
                    icon={<AlertCircle size={48} />} 
                    glow="status-glow-error"
                />
            </div>

            {/* Graphs Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
                <div className="glass-panel p-gutter">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-label-caps text-label-caps text-primary uppercase tracking-widest">{t('DB_THROUGHPUT')}</h3>
                        <span className="font-data-mono text-[10px] text-secondary-fixed">{t('DB_LIVE')}: {realTimeData[realTimeData.length - 1]?.value || 0} MB/S</span>
                    </div>
                    <div className="h-48">
                        <MetricChart data={realTimeData} color="#00daf3" unit=" MB/S" />
                    </div>
                </div>

                <div className="glass-panel p-gutter">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-label-caps text-label-caps text-primary uppercase tracking-widest">{t('DB_CPU')}</h3>
                        <span className="font-data-mono text-[10px] text-primary-fixed">{t('DB_CORE_LOAD')}: {serverStats?.cpu.load.toFixed(1) || 0}%</span>
                    </div>
                    <div className="h-48">
                         <MetricChart data={realTimeCpuData} color="var(--primary-fixed)" unit="%" threshold={85} />
                    </div>
                </div>
            </div>

            {/* Event Log Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
                <div className="lg:col-span-2 glass-panel flex flex-col h-[400px]">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-surface-container-high/30">
                        <div className="flex items-center gap-2">
                            <Terminal size={14} className="text-primary" />
                            <h3 className="font-label-caps text-label-caps uppercase tracking-widest">{t('DB_EVENT_LOG')}</h3>
                        </div>
                        <span className="font-data-mono text-[10px] text-on-surface-variant uppercase">{t('SYNCED_JUST_NOW')}</span>
                    </div>
                    <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left font-data-mono text-[11px]">
                            <thead className="bg-surface-container sticky top-0 text-on-surface-variant/90">
                                <tr>
                                    <th className="px-4 py-2 font-normal uppercase tracking-wider">{t('TIMESTAMP')}</th>
                                    <th className="px-4 py-2 font-normal uppercase tracking-wider">{t('SOURCE')}</th>
                                    <th className="px-4 py-2 font-normal uppercase tracking-wider">{t('EVENT')}</th>
                                    <th className="px-4 py-2 font-normal uppercase tracking-wider text-right">{t('STATUS')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {techStats?.incidentFeed.map((t: any) => (
                                    <tr key={t.id} className="hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-primary/40">
                                        <td className="px-4 py-3 text-on-surface-variant">{t.timestamp || '14:22:01.03'}</td>
                                        <td className="px-4 py-3 uppercase tracking-tight">{t.source || 'NODE-SEC-07'}</td>
                                        <td className="px-4 py-3 truncate max-w-[300px]">{t.title}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${t.status === 'Open' ? 'bg-error/10 text-error border-error/30' : 'bg-secondary-fixed/10 text-secondary-fixed border-secondary-fixed/30'}`}>
                                                {t.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-panel p-gutter flex flex-col justify-between">
                    <div>
                        <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-4 uppercase tracking-widest">{t('DB_QUICK_ACTIONS')}</h3>
                        <div className="space-y-3">
                            <button className="w-full flex items-center justify-between p-4 bg-primary text-on-primary-container rounded shadow-lg hover:brightness-110 transition-all group">
                                <span className="font-label-caps uppercase tracking-wider">{t('DB_SCAN_GRID')}</span>
                                <Activity size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button className="w-full flex items-center justify-between p-4 border border-outline-variant/30 text-on-surface rounded hover:bg-white/5 transition-all">
                                <span className="font-label-caps uppercase tracking-wider">{t('DB_GEN_REPORT')}</span>
                                <Database size={18} />
                            </button>
                            <button className="w-full flex items-center justify-between p-4 border border-outline-variant/30 text-on-surface rounded hover:bg-white/5 transition-all">
                                <span className="font-label-caps uppercase tracking-wider">{t('VIEW_LIVE_MAP')}</span>
                                <MapPin size={18} />
                            </button>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-[10px] font-bold">JD</div>
                                <div className="w-8 h-8 rounded-full border-2 border-background bg-secondary-fixed/20 flex items-center justify-center text-[10px] font-bold">OP</div>
                            </div>
                            <span className="font-data-mono text-[10px] text-on-surface-variant uppercase tracking-widest">{t('OPERATORS_ACTIVE')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusCard({ label, value, status, total, progress, color, icon, glow }: any) {
    const colorMap: any = {
        'primary': 'text-primary',
        'secondary-fixed': 'text-secondary-fixed',
        'error': 'text-error',
    };

    return (
        <div className={`glass-panel p-margin relative overflow-hidden group border-l-2 border-transparent hover:border-${color}/40 transition-all`}>
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorMap[color]}`}>
                {icon}
            </div>
            <p className="font-label-caps text-label-caps text-on-surface-variant mb-2 tracking-widest uppercase">{label}</p>
            <p className={`font-display-lg text-display-lg ${colorMap[color]} tracking-tighter uppercase`}>
                {value}{total && <span className="text-on-surface-variant/30 text-3xl">{total}</span>}
            </p>
            {status && (
                <div className="flex items-center gap-2 mt-4">
                    <span className={`w-2 h-2 rounded-full bg-${color} animate-pulse ${glow}`}></span>
                    <span className="text-[10px] font-data-mono text-on-surface-variant tracking-wider uppercase truncate">{status}</span>
                </div>
            )}
            {progress !== undefined && (
                <div className="mt-6">
                    <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                        <div className={`h-full bg-${color} transition-all duration-1000`} style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-[10px] font-data-mono text-on-surface-variant mt-2 uppercase">{progress.toFixed(1)}% Coverage</p>
                </div>
            )}
        </div>
    );
}

// --- VISÃO DE GESTÃO (KPIs, Ativos e Saúde do Negócio) ---
/**
 * Visão de Gestão - Combina KPIs administrativos e executivos para uma visão consolidada.
 * @private
 */
function ExecutiveView() {
    const { t } = useLanguage();
    const { data: execStats } = (trpc.dashboard as any).getExecutiveStats.useQuery();
    const { data: adminStats } = (trpc.dashboard as any).getAdministrativeStats.useQuery();
    const { data: config } = (trpc.system as any).getSystemCustomization.useQuery();
    const slaGoal = config?.dashSlaGoal || 98.0;

    return (
        <div className="space-y-gutter">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
                <StatusCard 
                    label={t('UPTIME_GLOBAL')} 
                    value={`${execStats?.systemUptime.toFixed(1) || 100}%`} 
                    status={t('SYSTEM_PERFORMANCE')} 
                    color="secondary-fixed" 
                    icon={<Zap size={48} />} 
                />
                <StatusCard 
                    label={t('SLA_COMPLIANCE')} 
                    value={`${execStats?.slaCompliance.toFixed(1) || 0}%`} 
                    status={`${t('GOAL')}: ${slaGoal}%`} 
                    color={(execStats?.slaCompliance || 0) >= slaGoal ? 'primary' : 'error'} 
                    icon={<ShieldCheck size={48} />} 
                />
                <StatusCard 
                    label={t('MANAGED_ASSETS')} 
                    value={execStats?.totalAssets || 0} 
                    status={t('INVENTORY_ACTIVE')} 
                    color="primary" 
                    icon={<ServerIcon size={48} />} 
                />
                <StatusCard 
                    label={t('ACTIVE_TICKETS')} 
                    value={adminStats?.ticketDistribution.reduce((acc: any, curr: any) => acc + curr.count, 0) || 0} 
                    status={t('SERVICE_DESK')} 
                    color="primary" 
                    icon={<FileText size={48} />} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
                {/* Organizational Structure */}
                <div className="glass-panel p-gutter space-y-6">
                    <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">{t('ORGANIZATIONAL_SUMMARY')}</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-surface-container rounded border border-white/5">
                            <div className="flex items-center gap-3">
                                <Users size={20} className="text-primary" />
                                <span className="font-label-caps uppercase tracking-wider">{t('DEPARTMENTS')}</span>
                            </div>
                            <span className="font-display-lg text-2xl text-primary">{adminStats?.orgCounts.depts || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-surface-container rounded border border-white/5">
                            <div className="flex items-center gap-3">
                                <MapPin size={20} className="text-primary" />
                                <span className="font-label-caps uppercase tracking-wider">{t('LOCATIONS')}</span>
                            </div>
                            <span className="font-display-lg text-2xl text-primary">{adminStats?.orgCounts.locations || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Ticket Distribution */}
                <div className="lg:col-span-2 glass-panel p-gutter">
                    <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-8 uppercase tracking-widest">{t('INCIDENT_DISTRIBUTION')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        {adminStats?.ticketDistribution.map((d: any) => (
                            <div key={d.status} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">{d.status}</span>
                                    <span className="font-data-mono text-sm text-primary">{d.count}</span>
                                </div>
                                <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                                    <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${(d.count / (adminStats.ticketDistribution.reduce((acc: any, curr: any) => acc + curr.count, 0) || 1)) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Infrastructure Health Trend */}
            <div className="glass-panel p-gutter">
                <div className="mb-8">
                    <h3 className="font-label-caps text-label-caps text-primary uppercase tracking-widest">{t('HEALTH_TREND_30D')}</h3>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">{t('CONSOLIDATED_HEALTH_SCORE')}</p>
                </div>
                <div className="h-40 flex items-end gap-2 px-4">
                    {[65, 72, 80, 75, 85, 90, 88, 92, 95, 98, 97, 99].map((val, i) => (
                        <div key={i} className="flex-1 group relative">
                            <div className="w-full bg-primary/10 rounded-t border-t border-primary/30 transition-all hover:bg-primary/40" style={{ height: `${val}%` }}>
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-surface-container border border-white/10 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <span className="font-data-mono text-[9px] text-primary">{val}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}



// --- VISÃO ESTRATÉGICA (Gestão de Alto Nível e Conformidade) ---
/**
 * Visão Estratégica - Consolida indicadores de saúde, risco e financeiro.
 * @private
 */
function StrategicView() {
    const { t, language } = useLanguage();
    const { data: healthData } = (trpc as any).reports.getHealthIndicators.useQuery();
    const { data: riskData } = (trpc as any).reports.getRiskAssessment.useQuery();
    const { data: financialData } = (trpc as any).reports.getFinancialReport.useQuery();
    const { data: energyData } = (trpc as any).reports.getEnergyReport.useQuery();

    const currencyCode = language.toUpperCase() === 'PT-BR' ? 'BRL' : (language.toUpperCase() === 'ES' ? 'EUR' : 'USD');
    const currencyLocale = language.toUpperCase() === 'PT-BR' ? 'pt-BR' : (language.toUpperCase() === 'ES' ? 'es-ES' : 'en-US');

    return (
        <div className="space-y-gutter animate-in slide-in-from-bottom-4 duration-700">
            {/* Strategic KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
                <StrategicCard
                    title={t('BACKUP_COMPLIANCE')}
                    value={`${healthData?.backupCompliance || 0}%`}
                    icon={<Database size={24} />}
                    color="primary"
                    desc={t('NODES_WITH_BACKUP')}
                />
                <StrategicCard
                    title={t('RISK_ASSESSMENT')}
                    value={riskData?.matrix.critical > 0 ? t('CRITICAL') : t('STABLE')}
                    icon={<ShieldAlert size={24} />}
                    color={riskData?.matrix.critical > 0 ? "error" : "secondary-fixed"}
                    desc={`${riskData?.matrix.critical || 0} ${t('CRITICAL_RISKS_ID')}`}
                />
                <StrategicCard
                    title={t('TOTAL_ASSET_VALUE')}
                    value={(financialData?.currentAssetValue || 0).toLocaleString(currencyLocale, { style: 'currency', currency: currencyCode })}
                    icon={<DollarSign size={24} />}
                    color="primary"
                    desc={t('CURRENT_DEPRECIATED_VALUE')}
                />
                <StrategicCard
                    title={t('ENERGY_EFFICIENCY')}
                    value={`${(energyData?.totalWatts || 0).toLocaleString()}W`}
                    icon={<Zap size={24} />}
                    color="primary"
                    desc={`${t('ESTIMATED')} ${(energyData?.estimatedMonthlyCost || 0).toLocaleString(currencyLocale, { style: 'currency', currency: currencyCode })} /mo`}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
                {/* Health & Compliance */}
                <div className="glass-panel p-gutter">
                    <h3 className="font-label-caps text-label-caps text-primary mb-8 uppercase tracking-widest flex items-center gap-3">
                        <HeartPulse size={20} /> {t('INFRASTRUCTURE_HEALTH')}
                    </h3>
                    <div className="space-y-8">
                        <ProgressBar label={t('RAM_COMPLIANCE')} value={healthData?.ramCompliance || 0} color="var(--primary)" />
                        <ProgressBar label={t('NETWORK_AVAILABILITY')} value={healthData?.onlineRate || 0} color="var(--secondary-fixed)" />
                        <ProgressBar label={t('POWER_REDUNDANCY')} value={healthData?.upsCompliance || 0} color="var(--primary)" />
                    </div>
                </div>

                {/* Financial Efficiency */}
                <div className="glass-panel p-gutter">
                    <h3 className="font-label-caps text-label-caps text-primary mb-8 uppercase tracking-widest flex items-center gap-3">
                        <Scale size={20} /> {t('ECONOMIC_METRICS')}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 bg-surface-container rounded border border-white/5">
                            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest block mb-1">{t('CAPEX_INVESTMENT')}</span>
                            <span className="font-display-lg text-2xl text-primary">{(financialData?.totalInvested || 0).toLocaleString(currencyLocale, { style: 'currency', currency: currencyCode })}</span>
                        </div>
                        <div className="p-4 bg-surface-container rounded border border-white/5">
                            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest block mb-1">{t('OPEX_MAINTENANCE')}</span>
                            <span className="font-display-lg text-2xl text-error">{(financialData?.totalMaintenance || 0).toLocaleString(currencyLocale, { style: 'currency', currency: currencyCode })}</span>
                        </div>
                    </div>
                    
                    <div className="bg-primary/5 border border-primary/20 rounded p-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <span className="font-label-caps text-[10px] text-primary uppercase tracking-widest block mb-1">{t('INVESTMENT_ROI')}</span>
                                <span className="font-display-lg text-4xl text-primary italic">{(financialData?.roi || 0).toFixed(1)}%</span>
                            </div>
                            <div className="text-right">
                                <span className="font-label-caps text-[10px] text-on-surface-variant block mb-1">{t('LIFECYCLE_STATUS')}</span>
                                <span className="font-headline-md text-primary">{(financialData?.roi || 0) > 50 ? t('OPTIMIZED') : t('DETERIORATING')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StrategicCard({ title, value, icon, color, desc }: any) {
    const colorMap: any = {
        'primary': 'text-primary bg-primary/10 border-primary/20',
        'secondary-fixed': 'text-secondary-fixed bg-secondary-fixed/10 border-secondary-fixed/20',
        'error': 'text-error bg-error/10 border-error/20',
    };

    return (
        <div className="glass-panel p-gutter group hover:border-primary/40 transition-all">
            <div className={`p-3 rounded w-fit mb-6 border ${colorMap[color] || colorMap.primary}`}>
                {icon}
            </div>
            <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-1">{title}</h4>
            <p className="font-display-lg text-3xl text-primary tracking-tighter uppercase mb-2">{value}</p>
            <p className="font-label-caps text-[9px] text-on-surface-variant/60 uppercase tracking-widest">{desc}</p>
        </div>
    );
}

function ProgressBar({ label, value, color }: { label: string, value: number, color: string }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">{label}</span>
                <span className="font-data-mono text-sm" style={{ color }}>{value.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                    className="h-full transition-all duration-1000"
                    style={{ width: `${value}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
}

