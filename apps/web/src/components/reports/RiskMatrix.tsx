import { AlertTriangle, ShieldAlert, ShieldCheck, Shield } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface RiskMatrixProps {
    data: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
}

export function RiskMatrix({ data }: RiskMatrixProps) {
    const { t } = useLanguage();
    const total = data.critical + data.high + data.medium + data.low;

    const getPercentage = (val: number) => total > 0 ? (val / total) * 100 : 0;

    const items = [
        { label: t('REP_LEVEL_CRITICAL'), count: data.critical, color: 'bg-rose-600', icon: ShieldAlert, textColor: 'text-rose-600' },
        { label: t('REP_LEVEL_HIGH'), count: data.high, color: 'bg-orange-500', icon: AlertTriangle, textColor: 'text-orange-500' },
        { label: t('REP_LEVEL_MEDIUM'), count: data.medium, color: 'bg-amber-500', icon: Shield, textColor: 'text-amber-500' },
        { label: t('REP_LEVEL_LOW'), count: data.low, color: 'bg-emerald-500', icon: ShieldCheck, textColor: 'text-emerald-500' },
    ];

    return (
        <div className="bg-page/50 border border-border rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-black text-main italic uppercase tracking-tight">{t('REP_RISK_MATRIX')}</h3>
                    <p className="text-xs text-secondary font-medium">{t('REP_RISK_DISTRIBUTION')}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-secondary/70 uppercase italic">{t('REP_TOTAL_ASSETS')}</p>
                    <p className="text-2xl font-black text-accent italic">{total}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {items.map((item, idx) => {
                    const Icon = item.icon;
                    const pct = getPercentage(item.count);

                    return (
                        <div key={idx} className="bg-card border border-border p-5 rounded-2xl relative overflow-hidden group">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-2 rounded-xl ${item.textColor} ${item.color.replace('bg-', 'bg-')}/10`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <span className={`text-2xl font-black italic ${item.textColor}`}>{item.count}</span>
                            </div>

                            <p className="text-[10px] font-black text-secondary/70 uppercase tracking-widest mb-2">{item.label}</p>

                            <div className="w-full h-1.5 bg-card rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${item.color} rounded-full`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <p className="text-[10px] font-medium text-secondary mt-2">{pct.toFixed(1)}% {t('REP_TOTAL_DE')}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
