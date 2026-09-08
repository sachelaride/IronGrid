import { trpc } from '../utils/trpc';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend
} from 'recharts';
import {
    Activity,
    CheckCircle2,
    AlertCircle,
    Clock,
    BarChart3,
    PieChart as PieChartIcon,
    ArrowUpRight,
    Target,
    Calendar,
    Users as UsersIcon,
    Building2,
    History,
    Loader2
} from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * SLADashboard - Performance & Compliance Monitor.
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
export function SLADashboard() {
    const { t } = useLanguage();
    const [period, setPeriod] = useState({
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const { data: metrics, isLoading } = trpc.tickets.getSLADashboard.useQuery({
        startDate: period.startDate,
        endDate: period.endDate
    });

    if (isLoading) {
        return (
            <div className="flex items-center gap-4 text-on-surface-variant font-label-caps text-[11px] uppercase tracking-[0.3em] pt-8">
                <Loader2 size={18} className="animate-spin text-primary" /> {t('SYNCING_SLA_METRICS') || 'Synchronizing SLA Metrics...'}
            </div>
        );
    }

    if (!metrics) return null;

    const COLORS = [
        'var(--primary)',
        'var(--tertiary-fixed)',
        'var(--secondary-fixed)',
        'var(--error)',
        'var(--primary-fixed-dim)',
        'rgba(var(--primary-fixed), 0.5)'
    ];
    
    const STATUS_COLORS: any = {
        'No Prazo': 'var(--primary)',
        'Atrasado': 'var(--error)'
    };

    return (
        <div className="space-y-gutter animate-in fade-in duration-500 pt-4">
            {/* Period Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-end gap-8 glass-panel p-8 border-white/5 shadow-2xl">
                <div className="flex-1 space-y-4 w-full">
                    <h3 className="font-label-caps text-[10px] text-primary uppercase tracking-widest flex items-center gap-3">
                        <Calendar size={14} /> {t('FILTER_SERVICE_WINDOW')}
                    </h3>
                    <div className="flex items-center gap-6">
                        <div className="flex-1 space-y-2">
                            <label className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest ml-1">{t('START_WINDOW')}</label>
                            <input
                                type="date"
                                value={period.startDate}
                                onChange={(e) => setPeriod({ ...period, startDate: e.target.value })}
                                className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase h-11"
                            />
                        </div>
                        <div className="flex-1 space-y-2">
                            <label className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest ml-1">{t('END_WINDOW')}</label>
                            <input
                                type="date"
                                value={period.endDate}
                                onChange={(e) => setPeriod({ ...period, endDate: e.target.value })}
                                className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase h-11"
                            />
                        </div>
                    </div>
                </div>
                <div className="hidden lg:block text-right">
                    <div className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-2 italic">{t('FILTER_STATUS')}</div>
                    <div className="bg-primary/10 text-primary text-[10px] font-black px-4 py-2 rounded border border-primary/20 uppercase tracking-widest">
                        {t('WINDOW_ACTIVE_TRAVERSAL')}
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-gutter">
                <MetricCard
                    title={t('SLA_COMPLIANCE')}
                    value={`${metrics.complianceRate}%`}
                    subtitle={`${metrics.onTime} ${t('NODES_ON_TIME')}`}
                    icon={<Target className="text-primary" />}
                    trend="+2.5%"
                    isTrendUp={false}
                />
                <MetricCard
                    title={t('TOTAL_THROUGHPUT')}
                    value={metrics.totalResolved + metrics.totalOpen}
                    subtitle={t('AGGREGATED_VOLUME')}
                    icon={<Activity className="text-tertiary-fixed" />}
                />
                <MetricCard
                    title={t('LATENCY_BREACH')}
                    value={metrics.openSLAStatus.find(s => s.name === 'Atrasado')?.value || 0}
                    subtitle={t('IMMEDIATE_ACTION_REQ')}
                    icon={<AlertCircle className="text-error" />}
                    trend="CRITICAL"
                    isTrendUp={true}
                />
                <MetricCard
                    title={t('RESOLVED_UNITS')}
                    value={metrics.totalResolved}
                    subtitle={t('COMMIT_FINALIZED')}
                    icon={<CheckCircle2 className="text-secondary-fixed" />}
                />
                <MetricCard
                    title={t('AVERAGE_LATENCY')}
                    value={`${metrics.avgDelayHours}H`}
                    subtitle={t('POST_EXPIRATION_MTT')}
                    icon={<History className="text-primary-fixed-dim" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
                {/* Tower Distribution */}
                <div className="glass-panel p-10 h-[500px] flex flex-col border-white/5">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h3 className="font-display-lg text-xl text-primary uppercase tracking-tighter flex items-center gap-4">
                                <PieChartIcon size={24} /> {t('SERVICE_TOWER_MATRIX')}
                            </h3>
                            <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest mt-1">{t('SERVICE_VOLUME_DISTRIBUTION_SUB') || 'Volume distribution by operational sector'}</p>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={metrics.volumeByGroup}
                                    innerRadius={90}
                                    outerRadius={130}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {metrics.volumeByGroup.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '10px', textTransform: 'uppercase', fontFamily: 'var(--font-data-mono)' }}
                                    itemStyle={{ color: 'var(--on-surface)' }}
                                />
                                <Legend
                                    verticalAlign="middle"
                                    align="right"
                                    layout="vertical"
                                    iconType="square"
                                    iconSize={10}
                                    formatter={(value) => <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest ml-2">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* MTTR by Priority */}
                <div className="glass-panel p-10 h-[500px] flex flex-col border-white/5">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h3 className="font-display-lg text-xl text-tertiary-fixed uppercase tracking-tighter flex items-center gap-4">
                                <BarChart3 size={24} /> {t('PRIORITY_RESOLUTION_TRAVERSAL')}
                            </h3>
                            <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest mt-1">{t('MTTR_SUBTITLE') || 'Mean Time to Resolution (Hours)'}</p>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.mttrByPriority}>
                                <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="priority"
                                    stroke="var(--on-surface-variant)"
                                    fontSize={9}
                                    fontWeight="bold"
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                    fontFamily="var(--font-label-caps)"
                                    tickFormatter={(val) => val.toUpperCase()}
                                />
                                <YAxis stroke="var(--on-surface-variant)" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} fontFamily="var(--font-data-mono)" />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '10px', textTransform: 'uppercase', fontFamily: 'var(--font-data-mono)' }}
                                />
                                <Bar dataKey="hours" name="MTTR_H" fill="var(--tertiary-fixed)" radius={[2, 2, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Compliance by Dept */}
                <div className="glass-panel p-10 h-[500px] flex flex-col border-white/5">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h3 className="font-display-lg text-xl text-secondary-fixed uppercase tracking-tighter flex items-center gap-4">
                                <Building2 size={24} /> {t('SECTOR_COMPLIANCE_RATIO')}
                            </h3>
                            <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest mt-1">{t('SLA_SECTOR_SUBTITLE') || 'SLA performance by operational unit'}</p>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.complianceByDept} layout="vertical">
                                <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    stroke="var(--on-surface-variant)"
                                    fontSize={9}
                                    fontWeight="bold"
                                    width={120}
                                    fontFamily="var(--font-label-caps)"
                                    tickFormatter={(val) => val.length > 15 ? val.substring(0, 12).toUpperCase() + '...' : val.toUpperCase()}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '10px', textTransform: 'uppercase', fontFamily: 'var(--font-data-mono)' }}
                                    formatter={(value) => [`${value}%`, 'COMPLIANCE_LEVEL']}
                                />
                                <Bar dataKey="rate" radius={[0, 2, 2, 0]} barSize={20}>
                                    {metrics.complianceByDept.map((entry: any, index: number) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.rate >= 90 ? 'var(--primary)' : entry.rate >= 70 ? 'var(--secondary-fixed)' : 'var(--error)'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Meta por Atendente */}
                <div className="glass-panel p-10 h-[500px] flex flex-col border-white/5">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h3 className="font-display-lg text-xl text-primary-fixed-dim uppercase tracking-tighter flex items-center gap-4">
                                <UsersIcon size={24} /> {t('OPERATOR_PERFORMANCE_METRICS')}
                            </h3>
                            <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest mt-1">{t('OPERATOR_EFFICIENCY_SUB') || 'Individual compliance & delivery accuracy'}</p>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.complianceByAttendant}>
                                <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="var(--on-surface-variant)"
                                    fontSize={9}
                                    fontWeight="bold"
                                    fontFamily="var(--font-label-caps)"
                                    tickFormatter={(val) => val.split(' ')[0].toUpperCase()}
                                    dy={10}
                                />
                                <YAxis stroke="var(--on-surface-variant)" fontSize={9} fontWeight="bold" domain={[0, 100]} fontFamily="var(--font-data-mono)" />
                                <Tooltip
                                    contentStyle={{ background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '10px', textTransform: 'uppercase', fontFamily: 'var(--font-data-mono)' }}
                                    formatter={(value) => [`${value}%`, 'EFFICIENCY_RATING']}
                                />
                                <Bar dataKey="rate" fill="var(--primary-fixed-dim)" radius={[2, 2, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Health SLA Status */}
                <div className="glass-panel p-10 h-[450px] flex flex-col lg:col-span-2 border-white/5">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h3 className="font-display-lg text-xl text-primary uppercase tracking-tighter flex items-center gap-4">
                                <Clock size={24} /> {t('ACTIVE_WINDOW_HEALTH_SYNC')}
                            </h3>
                            <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest mt-1">{t('REAL_TIME_STATUS_SUB') || 'Real-time status of active service requests'}</p>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.openSLAStatus} layout="vertical" margin={{ left: 40, right: 40 }}>
                                <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                <XAxis type="number" stroke="var(--on-surface-variant)" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} fontFamily="var(--font-data-mono)" />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    stroke="var(--on-surface-variant)"
                                    fontSize={10}
                                    fontWeight="bold"
                                    tickLine={false}
                                    axisLine={false}
                                    fontFamily="var(--font-label-caps)"
                                    tickFormatter={(v) => v.toUpperCase()}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '10px', textTransform: 'uppercase', fontFamily: 'var(--font-data-mono)' }}
                                />
                                <Bar dataKey="value" name="VOLUME" radius={[0, 2, 2, 0]} barSize={30}>
                                    {metrics.openSLAStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || 'var(--on-surface-variant)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, subtitle, icon, trend, isTrendUp }: any) {
    return (
        <div className="glass-panel p-8 border-white/5 hover:border-primary/20 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-8">
                <div className="w-14 h-14 bg-surface-container rounded border border-white/5 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                {trend && (
                    <span className={`font-label-caps text-[9px] font-black italic px-3 py-1 rounded border flex items-center gap-2 ${isTrendUp ? 'text-error bg-error/10 border-error/20' : 'text-primary bg-primary/10 border-primary/20'}`}>
                        {trend.startsWith('+') && <ArrowUpRight size={12} />} {trend}
                    </span>
                )}
            </div>

            <h4 className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.2em] mb-3">{title}</h4>
            <div className="font-display-lg text-3xl text-on-surface italic tracking-tighter mb-2">{value}</div>
            <p className="font-label-caps text-[9px] text-on-surface-variant/60 uppercase tracking-widest">{subtitle}</p>
            
            <div className="absolute bottom-0 left-0 h-0.5 bg-primary/20 group-hover:w-full transition-all w-0" />
        </div>
    );
}
