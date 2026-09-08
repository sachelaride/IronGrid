import { trpc } from '../utils/trpc';
import { DollarSign, ShieldAlert, PieChart, BarChart3, Users, Building, TrendingUp, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, PieChart as RePie, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useLanguage } from '../context/LanguageContext';

/**
 * BIDashboard - Executive Intelligence Command Center.
 * Refatorado para a estética Cyber-Dark.
 */
export function BIDashboard() {
    const { t, language } = useLanguage();
    const { data: stats } = (trpc as any).dashboard.getStats.useQuery();
    const { data: maintRecords = [] } = (trpc as any).maintenance.listRecords.useQuery();
    const { data: devicesData = [] } = trpc.scan.getDevices.useQuery({});
    const devices = Array.isArray(devicesData) ? devicesData : (devicesData as any)?.devices ?? [];

    const totalMaintCost = maintRecords.reduce((sum: number, r: any) => sum + (r.cost || 0), 0);

    const deviceTypeStats = devices.reduce((acc: any, d: any) => {
        const type = d.type || 'UNKNOWN';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    const pieData = Object.entries(deviceTypeStats).map(([name, value]) => ({ name, value }));

    const maintByStatus = maintRecords.reduce((acc: any, r: any) => {
        const status = r.status || 'UNDEFINED';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    const barData = Object.entries(maintByStatus).map(([name, value]) => ({ name, value }));

    const COLORS = [
        'var(--primary)',
        'var(--tertiary-fixed)',
        'var(--secondary-fixed)',
        'var(--primary-fixed-dim)',
        'var(--error)',
        'rgba(var(--primary-fixed), 0.5)'
    ];

    return (
        <div className="space-y-gutter animate-in fade-in duration-500 pt-4">
            {/* Executive Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
                <BICard
                    title={t('OPERATIONAL_EXPENDITURE')}
                    value={totalMaintCost.toLocaleString(language === 'PT-BR' ? 'pt-BR' : (language === 'ES' ? 'es-ES' : 'en-US'), { style: 'currency', currency: language === 'PT-BR' ? 'BRL' : (language === 'ES' ? 'EUR' : 'USD') })}
                    icon={<DollarSign className="text-primary" />}
                    trend="+12.4%"
                    isTrendUp={true}
                />
                <BICard
                    title={t('MANAGED_GRID_NODES')}
                    value={devices.length.toString()}
                    icon={<Building className="text-tertiary-fixed" />}
                    trend="+3"
                    isTrendUp={false}
                />
                <BICard
                    title={t('CRITICAL_INCIDENTS_MO')}
                    value={stats?.totalAlerts || '0'}
                    icon={<ShieldAlert className="text-error" />}
                    trend="-15.2%"
                    isTrendUp={false}
                />
                <BICard
                    title={t('SUPPORT_CAPACITY')}
                    value="142.5H"
                    icon={<Users className="text-secondary-fixed" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
                {/* Inventory Composition */}
                <div className="glass-panel p-10 h-[500px] flex flex-col border-white/5">
                    <h3 className="font-display-lg text-xl text-primary uppercase tracking-tighter mb-10 flex items-center gap-4">
                        <PieChart size={24} /> {t('INVENTORY_MATRIX_COMPOSITION')}
                    </h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePie>
                                <Pie
                                    data={pieData}
                                    innerRadius={90}
                                    outerRadius={130}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '10px', textTransform: 'uppercase', fontFamily: 'var(--font-data-mono)' }}
                                    itemStyle={{ color: 'var(--on-surface)' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Legend verticalAlign="bottom" height={40} iconType="square" iconSize={10} wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', fontFamily: 'var(--font-label-caps)', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', paddingTop: '30px' }} />
                            </RePie>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Maintenance Flux */}
                <div className="glass-panel p-10 h-[500px] flex flex-col border-white/5">
                    <h3 className="font-display-lg text-xl text-tertiary-fixed uppercase tracking-tighter mb-10 flex items-center gap-4">
                        <BarChart3 size={24} /> {t('OPERATIONAL_MAINTENANCE_FLUX')}
                    </h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData}>
                                <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--on-surface-variant)" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} dy={10} fontFamily="var(--font-label-caps)" tickFormatter={(v) => v.toUpperCase()} />
                                <YAxis stroke="var(--on-surface-variant)" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} fontFamily="var(--font-data-mono)" />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '10px', textTransform: 'uppercase', fontFamily: 'var(--font-data-mono)' }}
                                />
                                <Bar dataKey="value" fill="var(--primary)" radius={[2, 2, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BICard({ title, value, icon, trend, isTrendUp }: any) {
    return (
        <div className="glass-panel p-8 border-white/5 hover:border-primary/20 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-8">
                <div className="w-14 h-14 bg-surface-container rounded border border-white/5 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 font-label-caps text-[9px] uppercase tracking-widest px-3 py-1 rounded border ${isTrendUp ? 'text-error bg-error/10 border-error/20' : 'text-primary bg-primary/10 border-primary/20'}`}>
                        {isTrendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {trend}
                    </div>
                )}
            </div>
            <h4 className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.2em] mb-3">{title}</h4>
            <div className="font-display-lg text-3xl text-on-surface uppercase tracking-tighter italic">{value}</div>
            
            <div className="absolute bottom-0 left-0 h-0.5 bg-primary/20 group-hover:w-full transition-all w-0" />
        </div>
    );
}
