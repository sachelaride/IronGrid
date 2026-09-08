import { useState } from 'react';
import { 
    Settings as SettingsIcon, Bell, Info, Mail, Network, Zap, 
    MapPin, Database, Shield, Globe, Users, Server, Activity
} from 'lucide-react';
import { NotificationChannelManager } from './NotificationChannelManager';
import { MailCollectorSettings } from './MailCollectorSettings';
import { TopologyVisibilitySettings, GrafanaExportManager } from './TopologySettings';
import { 
    OrgHierarchyManager, AssetManager, SnmpCommunityManager, 
    NetworkRangeManager 
} from './OrganizationHub';
import { AlertSettings } from './AlertSettings';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

/**
 * Settings - Central de Governança do Ecossistema IronGrid.
 * Consolidado para incluir todos os protocolos organizacionais.
 */
export function Settings() {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'notifications' | 'mail' | 'topology' | 'grafana' | 'sites' | 'assets' | 'snmp' | 'alerts' | 'map_visibility'>('notifications');
    const [topologyView, setTopologyView] = useState<'ranges' | 'visibility'>('ranges');

    return (
        <div className="space-y-gutter animate-in fade-in duration-500 pb-20 pt-4">
            {/* Page Header */}
            <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl shadow-[0_0_30px_rgba(var(--primary-fixed),0.1)]">
                        <SettingsIcon size={32} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="font-display-lg text-4xl text-primary uppercase tracking-tighter italic">{t('SET_GOVERNANCE')}</h2>
                        <p className="font-label-caps text-[11px] text-on-surface-variant/90 uppercase tracking-[0.3em] mt-1 italic font-black">{t('SET_SUBTITLE')}</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs - Consolidated */}
            <div className="flex flex-wrap bg-surface-container-highest/20 p-2 rounded-2xl border border-white/5 backdrop-blur-3xl gap-2 w-full mb-10 shadow-inner">
                <SettingsTabButton active={activeTab === 'sites'} onClick={() => setActiveTab('sites')} label={t('SET_SITES')} icon={MapPin} />
                <SettingsTabButton active={activeTab === 'topology'} onClick={() => setActiveTab('topology')} label={t('SET_RANGES')} icon={Globe} />
                <SettingsTabButton active={activeTab === 'map_visibility'} onClick={() => setActiveTab('map_visibility')} label={t('SET_VISIBILITY')} icon={Activity} />
                <SettingsTabButton active={activeTab === 'assets'} onClick={() => setActiveTab('assets')} label={t('SET_ASSETS')} icon={Database} />
                <SettingsTabButton active={activeTab === 'snmp'} onClick={() => setActiveTab('snmp')} label={t('SET_SNMP')} icon={Shield} />
                <SettingsTabButton active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} label={t('SET_THRESHOLDS')} icon={Zap} />
                <SettingsTabButton active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} label={t('SET_CHANNELS')} icon={Bell} />
                <SettingsTabButton active={activeTab === 'mail'} onClick={() => setActiveTab('mail')} label={t('SET_MAIL')} icon={Mail} />
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'sites' && <OrgHierarchyManager />}
                    
                    {activeTab === 'topology' && <NetworkRangeManager />}
                    
                    {activeTab === 'map_visibility' && <TopologyVisibilitySettings />}

                    {activeTab === 'assets' && <AssetManager />}
                    {activeTab === 'snmp' && <SnmpCommunityManager />}
                    {activeTab === 'alerts' && <AlertSettings />}

                    {activeTab === 'notifications' && (
                        <section className="glass-panel p-10 border-white/5 shadow-2xl relative overflow-hidden bg-surface-container/95">
                            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                                <Bell size={120} className="text-primary" />
                            </div>
                            <NotificationChannelManager />
                        </section>
                    )}

                    {activeTab === 'mail' && (
                        <section className="glass-panel p-10 border-white/5 shadow-2xl relative overflow-hidden bg-surface-container/95">
                            <MailCollectorSettings />
                        </section>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Intelligence Footer Box */}
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-8 flex gap-8 items-center shadow-[inset_0_0_30px_rgba(var(--primary-fixed),0.05)] mt-12">
                <div className="p-5 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary-fixed),0.1)]">
                    <Info size={32} className="text-primary" />
                </div>
                <div className="space-y-2">
                    <h4 className="font-display-lg text-xl text-primary uppercase tracking-tighter flex items-center gap-2 italic">{t('CENTRALIZED_GOVERNANCE_PROTOCOL')}</h4>
                    <p className="font-label-caps text-[11px] text-on-surface-variant/90 uppercase tracking-widest leading-relaxed max-w-4xl">
                        {t('GOVERNANCE_DESC')}
                    </p>
                </div>
            </div>
        </div>
    );
}

function SettingsTabButton({ active, onClick, label, icon: Icon }: any) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-4 px-6 h-12 rounded-xl font-display-lg text-[11px] transition-all uppercase tracking-tighter italic border
                ${active
                    ? 'bg-primary text-black border-transparent shadow-[0_0_30px_rgba(var(--primary-fixed),0.3)] font-black'
                    : 'text-on-surface-variant/90 border-transparent hover:bg-white/5 hover:text-on-surface'}
            `}
        >
            <Icon size={18} className={active ? 'text-black' : 'opacity-40'} />
            {label}
        </button>
    );
}


