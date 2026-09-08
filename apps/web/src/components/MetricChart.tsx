import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useMemo } from 'react';

interface DataPoint {
    time: string;
    value: number;
}

interface MetricChartProps {
    data: DataPoint[];
    color?: string;
    unit?: string;
    title?: string;
    /** Optional threshold line (e.g. 85 for 85% CPU) */
    threshold?: number;
}

/**
 * Converts an arbitrary color string to a safe SVG gradient ID.
 * Strips characters invalid in XML IDs: spaces, parentheses, hyphens, dots, etc.
 */
function toGradientId(color: string): string {
    return 'grad_' + color.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
}

export function MetricChart({ data, color = '#c3f5ff', unit = '', title, threshold }: MetricChartProps) {
    const gradientId = useMemo(() => toGradientId(color), [color]);

    if (data.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 border border-outline-variant/20 rounded-full flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-on-surface-variant/20">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                </div>
                <p className="font-label-caps text-[9px] text-on-surface-variant/30 uppercase tracking-[0.3em]">
                    Aguardando dados…
                </p>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col">
            {title && <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-4">{title}</h4>}
            <div className="flex-1 min-h-[150px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.22} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis
                            dataKey="time"
                            tick={{ fill: 'rgba(225, 226, 235, 0.35)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tick={{ fill: 'rgba(225, 226, 235, 0.35)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                            tickLine={false}
                            axisLine={false}
                            unit={unit}
                            width={42}
                        />
                        {threshold !== undefined && (
                            <ReferenceLine
                                y={threshold}
                                stroke="rgba(255,180,171,0.5)"
                                strokeDasharray="4 4"
                                strokeWidth={1}
                                label={{ value: `${threshold}${unit}`, fill: 'rgba(255,180,171,0.7)', fontSize: 8, fontFamily: 'JetBrains Mono' }}
                            />
                        )}
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(16, 19, 26, 0.95)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontFamily: 'JetBrains Mono',
                                backdropFilter: 'blur(16px)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                                color: '#e1e2eb',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                            itemStyle={{ color }}
                            cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 }}
                            formatter={(value: number) => [`${value}${unit}`, '']}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            strokeWidth={1.5}
                            fillOpacity={1}
                            fill={`url(#${gradientId})`}
                            animationDuration={600}
                            dot={false}
                            activeDot={{ r: 3, fill: color, stroke: 'rgba(16,19,26,0.8)', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
