import React, { useState, useEffect } from 'react';
import { 
    Activity, Bell, PieChart, Server, MessageSquare, MapPin, 
    Layers, LayoutGrid, Terminal, Shield, Globe, Clock, 
    Settings as SettingsIcon, ChevronDown, ChevronUp, 
    LogOut, User as UserIcon, Menu, X, Eye, List as ListIcon,
    Database, FileText, Zap, Book, Wrench, Network, Search,
    Monitor as MonitorIcon, Palette, Cpu, Download, TrendingUp, Mail, Key, Share2, Info, BookOpen, HeartHandshake
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalSearch } from './GlobalSearch';
import { useLanguage } from '../context/LanguageContext';
import { ThemeDesigner } from './ThemeDesigner';
import { Logo } from './Logo';
import { trpc } from '../utils/trpc';
import { useHotkeys } from '../hooks/useHotkeys';

export type Tab = 
    'dashboard' | 'devices' | 'topology' | 'customMaps' | 'monitoring' | 
    'inventory' | 'tickets' | 'alerts' | 'reports' | 'settings' | 
    'users' | 'networkMgmt' | 'discovery' | 'audit' | 'knowledge' | 
    'maintenance' | 'bi' | 'config' | 'pdf_reports' | 'system_maintenance' | 
    'graficos' | 'tools' | 'sla_dashboard' | 'ipam' | 'alert_settings' | 
    'cron' | 'agentes' | 'about' | 'manual' | 'contribution' | 'grafana_gen' | 'grafana_list' | 'grafana_tips' | 'grafana_maps' | 'inventory_report';

interface LayoutProps {
    children: React.ReactNode;
    currentTab: Tab;
    onNavigate: (tab: Tab) => void;
    user: { name: string; role: string };
    onLogout: () => void;
}

export function Layout({ children, currentTab, onNavigate, user, onLogout }: LayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024 && currentTab !== 'topology');
    const [isThemeDesignerOpen, setIsThemeDesignerOpen] = useState(false);

    // Automatically close sidebar when entering topology
    useEffect(() => {
        if (currentTab === 'topology') {
            setIsSidebarOpen(false);
        }
    }, [currentTab]);

    // Consultas para obter contagens dos badges em tempo real (atualiza a cada 10s)
    const { data: techStats } = (trpc.dashboard as any).getTechnicalStats.useQuery(undefined, { refetchInterval: 10000 });
    const { data: globalStats } = trpc.dashboard.getGlobalStats.useQuery(undefined, { refetchInterval: 10000 });

    const [expandedGroup, setExpandedGroup] = useState<string | null>('monitoring');

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auto-expand group based on current tab
    useEffect(() => {
        const tabToGroup: Record<string, string> = {
            'dashboard': 'monitoring', 'graficos': 'monitoring', 'audit': 'monitoring', 'alert_settings': 'monitoring',
            'grafana_list': 'grafana', 'grafana_gen': 'grafana', 'grafana_maps': 'grafana', 'grafana_tips': 'grafana',
            'devices': 'inventory', 'inventory': 'inventory', 'topology': 'inventory', 'customMaps': 'inventory', 'ipam': 'inventory',
            'tickets': 'tickets', 'sla_dashboard': 'tickets', 'knowledge': 'tickets', 'maintenance': 'tickets',
            'bi': 'reports', 'inventory_report': 'reports', 'pdf_reports': 'reports',
            'discovery': 'tools', 'config': 'tools', 'system_maintenance': 'tools', 'cron': 'tools',
            'agentes': 'agents', 'about': 'agents', 'manual': 'agents', 'contribution': 'agents'
        };
        
        if (tabToGroup[currentTab]) {
            setExpandedGroup(tabToGroup[currentTab]);
        }
    }, [currentTab]);

    const { t, language, setLanguage } = useLanguage();

    const handleNavigate = (tab: Tab) => {
        onNavigate(tab);
        if (window.innerWidth < 1024) setIsSidebarOpen(false);
    };

    const toggleGroup = (group: string) => {
        setExpandedGroup(prev => prev === group ? null : group);
    };

    // Global Hotkeys for NOC Power Users
    useHotkeys('alt+1', () => handleNavigate('dashboard'));
    useHotkeys('alt+2', () => handleNavigate('devices'));
    useHotkeys('alt+3', () => handleNavigate('topology'));
    useHotkeys('alt+4', () => handleNavigate('customMaps'));
    useHotkeys('alt+a', () => handleNavigate('alert_settings'));
    useHotkeys('alt+t', () => handleNavigate('tickets'));
    useHotkeys('alt+i', () => handleNavigate('inventory'));
    useHotkeys('alt+s', () => handleNavigate('settings'));
    useHotkeys('ctrl+b', () => setIsSidebarOpen(prev => !prev));

    return (
        <div className="flex h-screen bg-background text-on-surface overflow-hidden font-body-md selection:bg-primary-container selection:text-on-primary-container">
            {/* SIDEBAR overlay for mobile */}
            {isSidebarOpen && window.innerWidth < 1024 && (
                <div 
                    className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[105] lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR - Totalmente removido em modo Topology para Fullscreen real */}
            {currentTab !== 'topology' && (
                <motion.aside 
                    initial={false}
                    animate={{ 
                        width: isSidebarOpen ? 280 : 0,
                        opacity: isSidebarOpen ? 1 : 0,
                        display: isSidebarOpen ? "flex" : "none"
                    }}
                    className="fixed lg:relative z-[110] h-full bg-surface-container-lowest border-r border-white/5 flex flex-col overflow-hidden"
                >
                    <div className="px-8 py-8 shrink-0 flex items-center justify-between">
                        <Logo hideText={!isSidebarOpen} size={28} />
                        {window.innerWidth < 1024 && (
                            <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-on-surface-variant">
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    <nav className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 px-4 mt-2 pb-10">
                        <NavGroup 
                            id="monitoring" 
                            label={t('NAV_MONITORING')} 
                            icon={<Eye size={18} />} 
                            isOpen={expandedGroup === 'monitoring'} 
                            onToggle={() => toggleGroup('monitoring')}
                        >
                            <SubNavItem label={t('NAV_DASHBOARD')} icon={<Activity size={14} />} active={currentTab === 'dashboard'} onClick={() => handleNavigate('dashboard')} />
                            <SubNavItem label={t('NAV_GRAFICOS')} icon={<TrendingUp size={14} />} active={currentTab === 'graficos'} onClick={() => handleNavigate('graficos')} />
                            <SubNavItem label={t('NAV_AUDIT')} icon={<Terminal size={14} />} active={currentTab === 'audit'} onClick={() => handleNavigate('audit')} />
                            <SubNavItem 
                                label={t('NAV_ALERT_SETTINGS')} 
                                icon={<Mail size={14} />} 
                                active={currentTab === 'alert_settings'} 
                                onClick={() => handleNavigate('alert_settings')}
                                badge={techStats?.criticalAlertsCount > 0 ? techStats.criticalAlertsCount : undefined}
                                badgeType="error"
                            />
                        </NavGroup>

                        <NavGroup 
                            id="grafana" 
                            label={t('NAV_GRAFANA_AUX')} 
                            icon={<TrendingUp size={18} />} 
                            isOpen={expandedGroup === 'grafana'} 
                            onToggle={() => toggleGroup('grafana')}
                        >
                            <SubNavItem label={t('NAV_GRAFANA_LIST')} icon={<Globe size={14} />} active={currentTab === 'grafana_list'} onClick={() => handleNavigate('grafana_list')} />
                            <SubNavItem label={t('NAV_GRAFANA_GEN')} icon={<Zap size={14} />} active={currentTab === 'grafana_gen'} onClick={() => handleNavigate('grafana_gen')} />
                            <SubNavItem label={t('NAV_GRAFANA_MAPS')} icon={<Share2 size={14} />} active={currentTab === 'grafana_maps'} onClick={() => handleNavigate('grafana_maps')} />
                            <SubNavItem label={t('NAV_GRAFANA_TIPS')} icon={<SettingsIcon size={14} />} active={currentTab === 'grafana_tips'} onClick={() => handleNavigate('grafana_tips')} />
                        </NavGroup>

                        <NavGroup 
                            id="inventory" 
                            label={t('NAV_INVENTORY_GROUP')} 
                            icon={<ListIcon size={18} />} 
                            isOpen={expandedGroup === 'inventory'} 
                            onToggle={() => toggleGroup('inventory')}
                        >
                            <SubNavItem 
                                label={t('NAV_DEVICES')} 
                                icon={<Server size={14} />} 
                                active={currentTab === 'devices'} 
                                onClick={() => handleNavigate('devices')} 
                                badge={(globalStats?.offline ?? 0) > 0 ? globalStats?.offline : undefined}
                                badgeType="warning"
                            />
                            <SubNavItem label={t('NAV_INVENTORY')} icon={<Database size={14} />} active={currentTab === 'inventory'} onClick={() => handleNavigate('inventory')} />
                            <SubNavItem label={t('NAV_TOPOLOGY')} icon={<Network size={14} />} active={(currentTab as string) === 'topology'} onClick={() => handleNavigate('topology' as any)} />
                            <SubNavItem label={t('NAV_CUSTOMMAPS')} icon={<MapPin size={14} />} active={currentTab === 'customMaps'} onClick={() => handleNavigate('customMaps')} />
                            <SubNavItem label={t('NAV_IPAM')} icon={<Globe size={14} />} active={currentTab === 'ipam'} onClick={() => handleNavigate('ipam')} />
                        </NavGroup>

                        <NavGroup 
                            id="tickets" 
                            label={t('NAV_TICKETS')} 
                            icon={<Layers size={18} />} 
                            isOpen={expandedGroup === 'tickets'} 
                            onToggle={() => toggleGroup('tickets')}
                        >
                            <SubNavItem label={t('NAV_TICKETS_CENTRAL')} icon={<MessageSquare size={14} />} active={currentTab === 'tickets'} onClick={() => handleNavigate('tickets')} />
                            <SubNavItem label={t('NAV_SLA_DASHBOARD')} icon={<TrendingUp size={14} />} active={currentTab === 'sla_dashboard'} onClick={() => handleNavigate('sla_dashboard')} />
                            <SubNavItem label={t('NAV_KNOWLEDGE')} icon={<Book size={14} />} active={currentTab === 'knowledge'} onClick={() => handleNavigate('knowledge')} />
                            <SubNavItem label={t('NAV_MAINTENANCE')} icon={<Wrench size={14} />} active={currentTab === 'maintenance'} onClick={() => handleNavigate('maintenance')} />
                        </NavGroup>

                        <NavGroup 
                            id="reports" 
                            label={t('NAV_REPORTS_GROUP')} 
                            icon={<PieChart size={18} />} 
                            isOpen={expandedGroup === 'reports'} 
                            onToggle={() => toggleGroup('reports')}
                        >
                            <SubNavItem label={t('NAV_BI')} icon={<TrendingUp size={14} />} active={currentTab === 'bi'} onClick={() => handleNavigate('bi')} />
                            <SubNavItem label={t('NAV_INVENTORY_REPORT')} icon={<Database size={14} />} active={currentTab === 'inventory_report'} onClick={() => handleNavigate('inventory_report')} />
                            <SubNavItem label={t('NAV_PDF_REPORTS')} icon={<FileText size={14} />} active={currentTab === 'pdf_reports'} onClick={() => handleNavigate('pdf_reports')} />
                        </NavGroup>

                        <NavGroup 
                            id="tools" 
                            label={t('NAV_TOOLS_GROUP')} 
                            icon={<Wrench size={18} />} 
                            isOpen={expandedGroup === 'tools'} 
                            onToggle={() => toggleGroup('tools')}
                        >
                            <SubNavItem label={t('NAV_DISCOVERY')} icon={<Search size={14} />} active={currentTab === 'discovery'} onClick={() => handleNavigate('discovery')} />
                            <SubNavItem label={t('NAV_CONFIG')} icon={<SettingsIcon size={14} />} active={currentTab === 'config'} onClick={() => handleNavigate('config')} />
                            <SubNavItem label={t('NAV_AUDIT')} icon={<Terminal size={14} />} active={currentTab === 'audit'} onClick={() => handleNavigate('audit')} />
                            <SubNavItem label={t('NAV_SYSTEM_MAINTENANCE')} icon={<Cpu size={14} />} active={currentTab === 'system_maintenance'} onClick={() => handleNavigate('system_maintenance')} />
                            <SubNavItem label={t('NAV_CRON')} icon={<Clock size={14} />} active={currentTab === 'cron'} onClick={() => handleNavigate('cron')} />
                        </NavGroup>

                        <NavGroup 
                            id="agents" 
                            label={t('NAV_AGENTS_GROUP')} 
                            icon={<Cpu size={18} />} 
                            isOpen={expandedGroup === 'agents'} 
                            onToggle={() => toggleGroup('agents')}
                        >
                            <SubNavItem label={t('NAV_AGENT_MGMT')} icon={<Download size={14} />} active={currentTab === 'agentes'} onClick={() => handleNavigate('agentes')} />
                            <SubNavItem label={t('NAV_MANUAL')} icon={<BookOpen size={14} />} active={currentTab === 'manual'} onClick={() => handleNavigate('manual')} />
                            <SubNavItem label={t('NAV_SUPPORT_PROJECT')} icon={<HeartHandshake size={14} />} active={currentTab === 'contribution'} onClick={() => handleNavigate('contribution')} />
                            <SubNavItem label="Sobre o sistema" icon={<Info size={14} />} active={currentTab === 'about'} onClick={() => handleNavigate('about')} />
                        </NavGroup>
                    </nav>

                    <div className="p-6 border-t border-white/5 bg-surface-container-low/50">
                        <div className="flex items-center gap-4 p-3 bg-surface-container rounded-xl border border-white/5 shadow-inner">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                                <UserIcon size={18} className="text-primary" />
                            </div>
                            <div className="overflow-hidden flex-1">
                                <p className="font-label-caps text-[10px] sm:text-xs text-on-surface uppercase truncate tracking-tight">{user.name}</p>
                                <p className="font-data-mono text-[8px] sm:text-[9px] text-on-surface-variant uppercase tracking-tighter opacity-60">{user.role}</p>
                            </div>
                            <button onClick={onLogout} className="p-2 text-on-surface-variant hover:text-error transition-all hover:bg-white/5 rounded-lg">
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                </motion.aside>
            )}

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 relative h-full">
                {/* TOP BAR */}
                {currentTab !== 'topology' && (
                    <header className="h-16 shrink-0 flex justify-between items-center px-8 z-30 bg-surface/80 backdrop-blur-xl border-b border-white/10">
                        <div className="flex items-center gap-6">
                            {!isSidebarOpen && (
                                <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-white/5 rounded-lg text-primary transition-all">
                                    <Menu size={24} />
                                </button>
                            )}
                            <h2 className="font-display-lg text-sm sm:text-lg md:text-xl text-primary uppercase tracking-widest truncate">
                                {t(`NAV_${currentTab.toUpperCase()}`)}
                            </h2>
                        </div>
                        
                        <div className="flex items-center gap-8">
                            <div className="hidden xl:block">
                                <GlobalSearch />
                            </div>
                            <div className="flex items-center gap-4">
                                {/* Language Selector */}
                                <div className="flex items-center bg-surface-container-highest/20 p-1 rounded-xl border border-white/5">
                                    {(['PT-BR', 'US', 'ES', 'FR', 'DE'] as const).map((lang) => (
                                        <button
                                            key={lang}
                                            onClick={() => setLanguage(lang)}
                                            className={`px-3 py-1.5 rounded-lg font-display-lg text-[10px] transition-all uppercase tracking-tighter ${
                                                language === lang 
                                                ? 'bg-primary text-black shadow-lg shadow-primary/20 font-black' 
                                                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                                            }`}
                                        >
                                            {lang === 'US' ? 'EN' : lang.split('-')[0]}
                                        </button>
                                    ))}
                                </div>

                                <button className="p-2.5 text-on-surface-variant hover:text-primary transition-all hover:bg-white/5 rounded-lg relative">
                                    <Bell size={20} />
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface shadow-[0_0_10px_rgba(var(--error),0.5)]" />
                                </button>
                                <button onClick={() => setIsThemeDesignerOpen(true)} className="p-2.5 text-on-surface-variant hover:text-primary transition-all hover:bg-white/5 rounded-lg">
                                    <Palette size={20} />
                                </button>
                                <button onClick={() => handleNavigate('settings')} className={`relative overflow-hidden p-2.5 text-on-surface-variant hover:text-primary transition-all hover:bg-white/5 rounded-lg`}>
                                    {currentTab === 'settings' && (
                                        <div className="tron-border-wrap">
                                            <div className="tron-streak-top" />
                                            <div className="tron-streak-top-echo" />
                                            <div className="tron-streak-right" />
                                            <div className="tron-streak-right-echo" />
                                            <div className="tron-streak-bottom" />
                                            <div className="tron-streak-bottom-echo" />
                                            <div className="tron-streak-left" />
                                            <div className="tron-streak-left-echo" />
                                        </div>
                                    )}
                                    <SettingsIcon size={20} />
                                </button>
                            </div>
                        </div>
                    </header>
                )}

                {/* CONTENT */}
                <main className={`flex-1 ${currentTab === 'topology' ? 'overflow-hidden' : 'overflow-auto custom-scrollbar'} bg-background`}>
                    <div className={`
                        ${currentTab === 'topology' ? 'w-full h-full' : 'max-w-[1600px] mx-auto p-gutter min-h-full'} 
                        animate-in fade-in slide-in-from-bottom-4 duration-500
                    `}>
                        {children}
                    </div>
                </main>
                <ThemeDesigner isOpen={isThemeDesignerOpen} onClose={() => setIsThemeDesignerOpen(false)} />
            </div>
        </div>
    );
}

function NavGroup({ id, label, icon, children, isOpen, onToggle }: any) {
    return (
        <div className="mb-2">
            <button 
                onClick={onToggle}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all group ${isOpen ? 'bg-white/5 text-primary' : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'}`}
            >
                <div className="flex items-center gap-4">
                    <span className={`${isOpen ? 'text-primary' : 'opacity-40 group-hover:opacity-100'} transition-all`}>{icon}</span>
                    <span className="font-label-caps text-[11px] uppercase tracking-[0.2em] font-black">{label}</span>
                </div>
                {isOpen ? <ChevronDown size={14} className="opacity-40" /> : <ChevronDown size={14} className="opacity-20 -rotate-90" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden flex flex-col gap-1 mt-1 ml-4 border-l border-white/5"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function NavItem({ label, icon, active, onClick, className = '' }: any) {
    return (
        <button
            onClick={onClick}
            className={`
                relative overflow-hidden flex items-center gap-4 px-6 py-4 transition-all duration-200 group rounded-lg
                ${active 
                    ? 'text-primary bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(var(--primary-fixed),0.2)] animate-pulse' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'}
                ${className}
            `}
        >
            {active && (
                <div className="tron-border-wrap">
                    <div className="tron-streak-top" />
                    <div className="tron-streak-top-echo" />
                    <div className="tron-streak-right" />
                    <div className="tron-streak-right-echo" />
                    <div className="tron-streak-bottom" />
                    <div className="tron-streak-bottom-echo" />
                    <div className="tron-streak-left" />
                    <div className="tron-streak-left-echo" />
                </div>
            )}
            <span className={`${active ? 'text-primary' : 'opacity-40 group-hover:opacity-100'} transition-all`}>
                {icon}
            </span>
            <span className="font-label-caps text-[11px] uppercase tracking-[0.2em] font-black">{label}</span>
        </button>
    );
}

function SubNavItem({ label, icon, active, onClick, badge, badgeType = 'default' }: any) {
    const badgeColors = {
        error: 'bg-error text-white shadow-[0_0_8px_rgba(var(--error),0.4)]',
        warning: 'bg-warning text-black shadow-[0_0_8px_rgba(var(--warning),0.4)]',
        default: 'bg-primary/20 text-primary border border-primary/30'
    };

    return (
        <button
            onClick={onClick}
            className={`
                relative overflow-hidden flex items-center gap-4 px-6 py-2.5 transition-all duration-200 group w-full
                ${active 
                    ? 'text-primary' 
                    : 'text-on-surface-variant/60 hover:text-on-surface'}
            `}
        >
            {active && (
                <div className="tron-border-wrap">
                    <div className="tron-streak-top" />
                    <div className="tron-streak-top-echo" />
                    <div className="tron-streak-right" />
                    <div className="tron-streak-right-echo" />
                    <div className="tron-streak-bottom" />
                    <div className="tron-streak-bottom-echo" />
                    <div className="tron-streak-left" />
                    <div className="tron-streak-left-echo" />
                </div>
            )}
            {active && <div className="absolute left-0 w-1 h-4 bg-primary rounded-full" />}
            <span className={`${active ? 'text-primary' : 'opacity-30 group-hover:opacity-100'} transition-all`}>
                {icon}
            </span>
            <span className="font-label-caps text-[10px] uppercase tracking-widest truncate flex-1 text-left">{label}</span>
            {badge !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${badgeColors[badgeType as keyof typeof badgeColors]}`}>
                    {badge > 99 ? '99+' : badge}
                </span>
            )}
        </button>
    );
}
