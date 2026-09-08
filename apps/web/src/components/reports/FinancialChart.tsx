import { DollarSign, TrendingDown, Wrench, Briefcase } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface FinancialChartProps {
    totalInvested: number;
    currentValue: number;
    maintenanceCost: number;
    roi: number;
}

export function FinancialChart({ totalInvested, currentValue, maintenanceCost, roi }: FinancialChartProps) {
    const { t, getLocale, getCurrency } = useLanguage();
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat(getLocale(), { style: 'currency', currency: getCurrency() }).format(val);
    };

    const stats = [
        { label: t('REP_FIN_TOTAL_INVESTED'), value: formatCurrency(totalInvested), icon: Briefcase, color: 'text-accent', sub: t('REP_FIN_ACQUISITION_DESC') },
        { label: t('REP_FIN_RESIDUAL_VALUE'), value: formatCurrency(currentValue), icon: TrendingDown, color: 'text-amber-500', sub: t('REP_FIN_DEPRECIATION_DESC') },
        { label: t('REP_FIN_MAINTENANCE_COST'), value: formatCurrency(maintenanceCost), icon: Wrench, color: 'text-rose-500', sub: t('REP_FIN_REPAIR_DESC') },
        { label: t('REP_FIN_ROI_INDEX'), value: `${roi.toFixed(1)}%`, icon: DollarSign, color: 'text-emerald-500', sub: t('REP_FIN_ROI_DESC') },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                    <div key={idx} className="bg-card border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                        <div className="flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`p-2 rounded-xl ${stat.color} bg-current/10`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <h4 className="text-[10px] font-black text-secondary/70 uppercase tracking-widest italic">{stat.label}</h4>
                            </div>

                            <div className="mt-auto">
                                <p className="text-2xl font-black text-main italic mb-1">{stat.value}</p>
                                <p className="text-[10px] font-medium text-secondary">{stat.sub}</p>
                            </div>
                        </div>

                        <div className={`absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity ${stat.color}`}>
                            <Icon className="w-16 h-16" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
