import { useState } from 'react';
import {
    Settings, Clock, Bell,
    Shield, ChevronRight, LayoutGrid, Terminal, Sliders
} from 'lucide-react';
import { SLAManager } from './SLAManager';
import { OrganizationHub } from './OrganizationHub';
import { ServiceManagement } from './ServiceManagement';
import { NotificationChannelManager } from './NotificationChannelManager';
import { SyslogManager } from './maintenance/SyslogManager';
import { AlertSettings } from './AlertSettings';
import { SystemCustomization } from './SystemCustomization';
import { TopologySettings } from './TopologySettings';
import { Network } from 'lucide-react';

type ToolTab = 'registration' | 'sla' | 'syslog' | 'notifications' | 'services' | 'monitoring' | 'customization' | 'topology';

export function ToolsHub({ initialTab }: { initialTab?: ToolTab }) {
    const [activeTab, setActiveTab] = useState<ToolTab>(initialTab || 'registration');

    const menuItems = [
        { id: 'registration', label: 'REGISTRY', icon: Settings, desc: 'User & Org Structure' },
        { id: 'sla', label: 'SERVICE LEVELS', icon: Clock, desc: 'SLA & Deadline Policy' },
        { id: 'syslog', label: 'SYSLOG NODE', icon: Terminal, desc: 'Source Config & Activation' },
        { id: 'notifications', label: 'EMAIL CHANNELS', icon: Bell, desc: 'Alert Routing Systems' },
        { id: 'monitoring', label: 'CRITICITY', icon: Bell, desc: 'Alert Levels & Triggers' },
        { id: 'services', label: 'SERVICES', icon: LayoutGrid, desc: 'Groups & Service Matrix' },
        { id: 'customization', label: 'SYSTEM PARAMETERS', icon: Sliders, desc: 'Global Control Tokens' },
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-gutter animate-in fade-in slide-in-from-bottom-4 duration-700 pt-4">
            {/* Internal Navigation Sidebar */}
            <div className="lg:w-80 shrink-0 space-y-gutter">
                <div className="glass-panel p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                    <h2 className="font-display-lg text-xl text-primary uppercase tracking-tighter mb-8 px-2">CENTRAL CONTROL</h2>
                    
                    <div className="space-y-2">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as ToolTab)}
                                className={`w-full flex items-center gap-4 p-4 rounded transition-all group relative overflow-hidden ${activeTab === item.id
                                    ? 'bg-primary text-on-primary-container shadow-lg shadow-primary/20'
                                    : 'text-on-surface-variant hover:bg-white/5'
                                    }`}
                            >
                                <div className={`p-2 rounded transition-colors ${activeTab === item.id ? 'bg-white/20 text-on-primary-container' : 'bg-surface-container text-on-surface-variant group-hover:text-primary'
                                    }`}>
                                    <item.icon size={18} />
                                </div>
                                <div className="text-left flex-1">
                                    <p className="font-label-caps text-[11px] uppercase tracking-wider leading-none">{item.label}</p>
                                    <p className={`font-data-mono text-[9px] mt-1.5 uppercase tracking-widest opacity-40 ${activeTab === item.id ? 'text-on-primary-container/80' : ''}`}>{item.desc}</p>
                                </div>
                                {activeTab === item.id && <ChevronRight size={14} className="text-on-primary-container/50" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Security Status Card */}
                <div className="glass-panel p-8 bg-secondary-fixed/5 border-secondary-fixed/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-fixed/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-secondary-fixed/20 transition-all duration-700"></div>
                    <Shield className="w-10 h-10 mb-6 text-secondary-fixed opacity-40" />
                    <h3 className="font-display-lg text-lg text-secondary-fixed uppercase tracking-tighter leading-none">SECURE NODE</h3>
                    <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.2em] mt-3 leading-relaxed">
                        Access restricted to Level 4 Administrators and authorized Ops personnel only.
                    </p>
                </div>
            </div>

            {/* Dynamic Content Area */}
            <div className="flex-1 min-w-0">
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    {activeTab === 'registration' && <OrganizationHub />}
                    {activeTab === 'sla' && <SLAManager />}
                    {activeTab === 'notifications' && <NotificationChannelManager />}
                    {activeTab === 'services' && <ServiceManagement />}
                    {activeTab === 'syslog' && <SyslogManager />}
                    {activeTab === 'monitoring' && <AlertSettings />}
                    {activeTab === 'customization' && <SystemCustomization />}
                </div>
            </div>
        </div>
    );
}
