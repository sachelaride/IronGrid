import { ReactNode } from 'react';
import { LucideIcon, Loader2, X, Search } from 'lucide-react';

/**
 * Design System Components for IronGrid (Cyber-Dark / Mission Control)
 * Tokens migrated to match tailwind.config.js — primary, surface-container, on-surface, outline-variant
 */

// ============================================================================
// FORM CARD - Standardized form container
// ============================================================================
interface FormCardProps {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    iconColor?: string;
    children: ReactNode;
    onClose?: () => void;
    className?: string;
}

export function FormCard({ title, subtitle, icon: Icon, iconColor = 'text-primary', children, onClose, className = '' }: FormCardProps) {
    return (
        <div className={`glass-panel border border-outline-variant/20 rounded-xl p-6 shadow-2xl relative overflow-hidden group ${className}`}>
            {Icon && (
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Icon className={`w-24 h-24 ${iconColor}`} />
                </div>
            )}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-display-lg text-xl text-on-surface uppercase tracking-tight italic">{title}</h3>
                    {subtitle && <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">{subtitle}</p>}
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-on-surface-variant hover:text-on-surface transition-colors p-2 hover:bg-white/5 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
}

// ============================================================================
// LIST CARD - Standardized list item
// ============================================================================
interface ListCardProps {
    icon?: LucideIcon;
    iconColor?: string;
    iconBg?: string;
    title: string;
    subtitle?: string | ReactNode;
    badges?: ReactNode;
    actions?: ReactNode;
    stats?: { label: string; value: string | number }[];
    onClick?: () => void;
    className?: string;
}

export function ListCard({
    icon: Icon,
    iconColor = 'text-primary',
    iconBg = 'bg-primary/10',
    title,
    subtitle,
    badges,
    actions,
    stats,
    onClick,
    className = ''
}: ListCardProps) {
    return (
        <div
            className={`flex items-center justify-between p-5 glass-panel border border-outline-variant/20 group hover:border-primary/30 transition-all shadow-lg ${onClick ? 'cursor-pointer hover:bg-surface-container/95' : ''} ${className}`}
            onClick={onClick}
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                {Icon && (
                    <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center ${iconColor} border border-current/10 shrink-0`}>
                        <Icon className="w-6 h-6" />
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <h4 className="font-display-lg text-on-surface uppercase italic tracking-tight truncate">{title}</h4>
                    {subtitle && (
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {typeof subtitle === 'string' ? (
                                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">{subtitle}</p>
                            ) : subtitle}
                        </div>
                    )}
                    {badges && <div className="flex items-center gap-2 mt-2 flex-wrap">{badges}</div>}
                </div>
            </div>

            {stats && (
                <div className="flex items-center gap-6 mx-6">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="text-right">
                            <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest italic">{stat.label}</p>
                            <p className="font-display-lg text-xl text-primary">{stat.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {actions && (
                <div className="flex items-center gap-1 shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// ACTION BUTTON - Consistent action buttons
// ============================================================================
interface ActionButtonProps {
    icon: LucideIcon;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    tooltip?: string;
    disabled?: boolean;
}

export function ActionButton({
    icon: Icon,
    onClick,
    variant = 'secondary',
    size = 'md',
    tooltip,
    disabled = false
}: ActionButtonProps) {
    const variants = {
        primary: 'text-primary hover:bg-primary/10 border-transparent hover:border-primary/20',
        secondary: 'text-on-surface-variant hover:text-on-surface hover:bg-white/5 border-transparent',
        danger: 'text-error hover:bg-error/10 border-transparent hover:border-error/20',
        success: 'text-secondary-fixed hover:bg-secondary-fixed/10 border-transparent hover:border-secondary-fixed/20'
    };

    const sizes = {
        sm: 'p-1.5',
        md: 'p-2.5',
        lg: 'p-3.5'
    };

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={tooltip}
            className={`${sizes[size]} ${variants[variant]} rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-110 active:scale-95`}
        >
            <Icon className={iconSizes[size]} />
        </button>
    );
}

// ============================================================================
// STATUS BADGE - Status indicators (Design System variant — não conflita com TicketManager)
// ============================================================================
interface DSStatusBadgeProps {
    label: string;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md';
}

export function StatusBadge({ label, variant = 'default', size = 'sm' }: DSStatusBadgeProps) {
    const variants = {
        default: 'bg-outline-variant/20 text-on-surface-variant border-outline-variant/30',
        primary: 'bg-primary/10 text-primary border-primary/20',
        success: 'bg-secondary-fixed/10 text-secondary-fixed border-secondary-fixed/20',
        warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        danger: 'bg-error/10 text-error border-error/20',
        info: 'bg-primary-fixed-dim/10 text-primary-fixed-dim border-primary-fixed-dim/20'
    };

    const sizes = {
        sm: 'text-[8px] px-1.5 py-0.5',
        md: 'text-[10px] px-2 py-1'
    };

    return (
        <span className={`${sizes[size]} ${variants[variant]} rounded font-label-caps uppercase tracking-widest border`}>
            {label}
        </span>
    );
}

// ============================================================================
// EMPTY STATE - Empty list placeholder
// ============================================================================
interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="text-center p-12 space-y-4">
            <div className="w-16 h-16 glass-panel border-outline-variant/20 rounded-xl flex items-center justify-center mx-auto">
                <Icon className="w-8 h-8 text-on-surface-variant/30" />
            </div>
            <div>
                <h3 className="font-display-lg text-lg text-on-surface uppercase italic tracking-tight">{title}</h3>
                {description && <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mt-2">{description}</p>}
            </div>
            {action && (
                <button
                    onClick={action.onClick}
                    className="cyber-button mt-4"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}

// ============================================================================
// SEARCH BAR - Unified search component
// ============================================================================
interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Buscar...', className = '' }: SearchBarProps) {
    return (
        <div className={`relative ${className}`}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full !bg-surface-container border-outline-variant/20 rounded-lg pl-11 pr-4 py-2.5 font-data-mono text-[11px] uppercase tracking-wider placeholder:text-on-surface-variant/30 focus:border-primary-fixed-dim/50 transition-all shadow-inner"
            />
        </div>
    );
}

// ============================================================================
// LOADING STATE - Loading indicator
// ============================================================================
interface LoadingStateProps {
    message?: string;
}

export function LoadingState({ message = 'Carregando...' }: LoadingStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.3em] animate-pulse">{message}</p>
        </div>
    );
}

// ============================================================================
// PRIMARY BUTTON - Main action button
// ============================================================================
interface PrimaryButtonProps {
    children: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    variant?: 'primary' | 'success' | 'danger';
    fullWidth?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function PrimaryButton({
    children,
    onClick,
    disabled = false,
    loading = false,
    variant = 'primary',
    fullWidth = false,
    size = 'md',
    className = ''
}: PrimaryButtonProps) {
    const variants = {
        primary: 'bg-primary text-on-primary-container shadow-primary/20 hover:brightness-110',
        success: 'bg-secondary-fixed text-on-secondary-container shadow-secondary-fixed/20 hover:brightness-110',
        danger: 'bg-error-container text-on-error-container shadow-error/20 hover:brightness-110'
    };

    const sizes = {
        sm: 'py-2 px-4 text-[9px]',
        md: 'py-3 px-6 text-[10px]',
        lg: 'py-4 px-8 text-xs'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`${fullWidth ? 'w-full' : ''} ${sizes[size]} ${variants[variant]} disabled:opacity-40 font-label-caps rounded shadow-lg transition-all active:scale-[0.98] uppercase tracking-widest flex items-center justify-center gap-2 ${className}`}
        >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {children}
        </button>
    );
}
