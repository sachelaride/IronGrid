import { ReactNode } from 'react';

/**
 * SkeletonLoaders - Glassmorphic skeleton screens for IronGrid Cyber-Dark UI
 */

interface SkeletonProps {
    className?: string;
}

export function SkeletonLine({ className = '' }: SkeletonProps) {
    return (
        <div className={`bg-outline-variant/10 rounded animate-pulse skeleton-pulse ${className}`} />
    );
}

export function SkeletonBlock({ className = '' }: SkeletonProps) {
    return (
        <div className={`bg-outline-variant/10 rounded-xl animate-pulse skeleton-pulse ${className}`} />
    );
}

export function SkeletonCircle({ className = '' }: SkeletonProps) {
    return (
        <div className={`bg-outline-variant/10 rounded-full animate-pulse skeleton-pulse ${className}`} />
    );
}

interface SkeletonCardProps {
    className?: string;
    hasIcon?: boolean;
    hasSubtitle?: boolean;
    lines?: number;
}

export function SkeletonCard({ className = '', hasIcon = true, hasSubtitle = true, lines = 1 }: SkeletonCardProps) {
    return (
        <div className={`glass-panel border border-outline-variant/10 p-5 w-full flex gap-4 ${className}`}>
            {hasIcon && (
                <div className="shrink-0">
                    <SkeletonBlock className="w-12 h-12" />
                </div>
            )}
            <div className="flex-1 space-y-3 py-1">
                <SkeletonLine className="h-4 w-1/3" />
                {hasSubtitle && <SkeletonLine className="h-2 w-1/4 opacity-60" />}
                <div className="space-y-2 pt-2">
                    {Array.from({ length: lines }).map((_, i) => (
                        <SkeletonLine key={i} className={`h-2 ${i % 2 === 0 ? 'w-full' : 'w-5/6'} opacity-40`} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number, columns?: number }) {
    return (
        <div className="w-full glass-panel border border-outline-variant/10 overflow-hidden">
            <div className="flex items-center gap-4 p-4 border-b border-outline-variant/10 bg-surface-container-high/20">
                {Array.from({ length: columns }).map((_, i) => (
                    <SkeletonLine key={i} className={`h-3 flex-1 ${i === 0 ? 'max-w-[200px]' : ''}`} />
                ))}
            </div>
            <div className="divide-y divide-outline-variant/5">
                {Array.from({ length: rows }).map((_, r) => (
                    <div key={r} className="flex items-center gap-4 p-4">
                        {Array.from({ length: columns }).map((_, c) => (
                            <SkeletonLine key={c} className={`h-2 flex-1 opacity-60 ${c === 0 ? 'max-w-[200px]' : ''}`} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
