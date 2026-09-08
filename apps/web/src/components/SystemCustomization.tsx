import { useState, useEffect } from 'react';
import { trpc } from '../utils/trpc';
import { Settings, Save, Loader2, Info, Building, Clock, Star, CalendarClock, LayoutDashboard, Target, HardDrive, Shield, Activity, Zap } from 'lucide-react';

/**
 * SystemCustomization - Global Operational Parameters & Branding Identity.
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
export function SystemCustomization() {
    const utils = trpc.useContext();
    const { data: config, isLoading } = (trpc.system as any).getSystemCustomization.useQuery();
    const updateMutation = (trpc.system as any).updateSystemCustomization.useMutation({
        onSuccess: () => {
            utils.system.getSystemCustomization.invalidate();
        }
    });

    const [formData, setFormData] = useState({
        companyName: '',
        workingHours: '',
        ticketAutoCloseDays: 15,
        ticketDefaultRating: 4,
        dashSlaGoal: 98,
        dashStorageCritical: 90,
        dashStorageWarning: 80
    });

    useEffect(() => {
        if (config) {
            setFormData({
                companyName: config.companyName || '',
                workingHours: config.workingHours || '',
                ticketAutoCloseDays: config.ticketAutoCloseDays || 15,
                ticketDefaultRating: config.ticketDefaultRating || 4,
                dashSlaGoal: config.dashSlaGoal || 98,
                dashStorageCritical: config.dashStorageCritical || 90,
                dashStorageWarning: config.dashStorageWarning || 80
            });
        }
    }, [config]);

    const handleSave = () => {
        updateMutation.mutate(formData);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-32 glass-panel border-white/5 border-dashed rounded bg-surface-container/5">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
                <p className="font-label-caps text-xs text-on-surface-variant uppercase tracking-[0.4em] italic animate-pulse">Syncing System Parameters...</p>
            </div>
        );
    }

    return (
        <div className="space-y-gutter animate-in fade-in duration-700">
            <div className="flex flex-col gap-3 ml-2">
                <h3 className="font-display-lg text-3xl text-primary uppercase tracking-tighter italic flex items-center gap-4">
                    SYSTEM_GOVERNANCE_PROTOCOL
                </h3>
                <p className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-[0.3em] italic">Global Operational Thresholds & Brand Identity</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                {/* Identidade */}
                <div className="glass-panel p-10 border-white/5 space-y-10 relative overflow-hidden group hover:border-white/10 transition-all">
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                        <Building size={120} className="text-primary" />
                    </div>
                    <div className="flex items-center gap-4 border-b border-white/5 pb-6 relative z-10">
                        <div className="p-3 bg-primary/10 rounded border border-primary/20">
                            <Building className="w-5 h-5 text-primary" />
                        </div>
                        <h4 className="font-label-caps text-sm text-on-surface uppercase tracking-widest italic">BRAND_IDENTITY_CORE</h4>
                    </div>

                    <div className="space-y-8 relative z-10">
                        <div className="space-y-3">
                            <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1 opacity-60">CORPORATION_NAME</label>
                            <input
                                type="text"
                                value={formData.companyName}
                                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                className="w-full h-12 !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase px-4 focus:border-primary transition-all rounded shadow-inner"
                                placeholder="ENTER_CORP_IDENTIFIER"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1 opacity-60">OPERATIONAL_WINDOW</label>
                            <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-40" />
                                <input
                                    type="text"
                                    value={formData.workingHours}
                                    onChange={e => setFormData({ ...formData, workingHours: e.target.value })}
                                    className="w-full h-12 !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase pl-12 pr-4 focus:border-primary transition-all rounded shadow-inner"
                                    placeholder="08:00 - 18:00"
                                />
                            </div>
                            <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest pl-1 italic opacity-40 italic">Utilized for SLA chronometry and escalation behavior.</p>
                        </div>
                    </div>
                </div>

                {/* Comportamento de Chamados */}
                <div className="glass-panel p-10 border-white/5 space-y-10 relative overflow-hidden group hover:border-white/10 transition-all">
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                        <CalendarClock size={120} className="text-primary-fixed-dim" />
                    </div>
                    <div className="flex items-center gap-4 border-b border-white/5 pb-6 relative z-10">
                        <div className="p-3 bg-primary-fixed-dim/10 rounded border border-primary-fixed-dim/20">
                            <CalendarClock className="w-5 h-5 text-primary-fixed-dim" />
                        </div>
                        <h4 className="font-label-caps text-sm text-on-surface uppercase tracking-widest italic">ITSM_AUTOMATION_RULES</h4>
                    </div>

                    <div className="space-y-8 relative z-10">
                        <div className="space-y-4">
                            <div className="flex justify-between items-end px-1">
                                <label className="font-label-caps text-[10px] text-primary-fixed-dim uppercase tracking-widest opacity-60">AUTO_TERMINATION_CYCLE</label>
                                <div className="font-data-mono text-lg text-primary-fixed-dim bg-primary-fixed-dim/10 px-3 py-1 rounded border border-primary-fixed-dim/20">
                                    {formData.ticketAutoCloseDays}D
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <input
                                    type="range"
                                    min="1"
                                    max="60"
                                    value={formData.ticketAutoCloseDays}
                                    onChange={e => setFormData({ ...formData, ticketAutoCloseDays: parseInt(e.target.value) })}
                                    className="flex-1 h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary-fixed-dim"
                                />
                            </div>
                            <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest pl-1 italic opacity-40">Inactive resolved tickets will be terminated after this interval.</p>
                        </div>

                        <div className="space-y-4">
                            <label className="font-label-caps text-[10px] text-primary-fixed-dim uppercase tracking-widest ml-1 opacity-60">DEFAULT_AUTOCLOSE_RATING</label>
                            <div className="flex items-center justify-between bg-surface-container/20 p-6 rounded border border-white/5 shadow-inner">
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setFormData({ ...formData, ticketDefaultRating: star })}
                                            className={`transition-all hover:scale-110 ${star <= formData.ticketDefaultRating
                                                ? 'text-primary-fixed-dim fill-primary-fixed-dim drop-shadow-[0_0_5px_rgba(var(--primary-fixed),0.5)]'
                                                : 'text-white/5 fill-transparent'
                                                }`}
                                        >
                                            <Star size={24} />
                                        </button>
                                    ))}
                                </div>
                                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-black">{formData.ticketDefaultRating}_STARS</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashboard Estratégico */}
                <div className="md:col-span-2 glass-panel p-10 border-white/5 space-y-10 bg-surface-container/95">
                    <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                        <div className="p-3 bg-primary/10 rounded border border-primary/20">
                            <LayoutDashboard className="w-5 h-5 text-primary" />
                        </div>
                        <h4 className="font-label-caps text-sm text-on-surface uppercase tracking-widest italic">MISSION_CONTROL_BI_THRESHOLDS</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="space-y-6">
                            <div className="flex justify-between items-end px-1">
                                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest flex items-center gap-3 opacity-60">
                                    <Target className="w-3.5 h-3.5 text-primary" /> SLA_GOAL_TARGET
                                </label>
                                <div className="font-data-mono text-lg text-primary bg-primary/10 px-3 py-1 rounded border border-primary/20">
                                    {formData.dashSlaGoal}%
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <input
                                    type="range"
                                    min="80"
                                    max="100"
                                    step="0.1"
                                    value={formData.dashSlaGoal}
                                    onChange={e => setFormData({ ...formData, dashSlaGoal: parseFloat(e.target.value) })}
                                    className="flex-1 h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary"
                                />
                            </div>
                            <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest italic opacity-40">Minimum performance objective for executive dashboard metrics.</p>
                        </div>

                        <div className="space-y-6">
                            <label className="font-label-caps text-[10px] text-amber-500 uppercase tracking-widest ml-1 flex items-center gap-3 opacity-80">
                                <Activity className="w-3.5 h-3.5" /> STORAGE_WARNING_LVL
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    min="50"
                                    max="95"
                                    value={formData.dashStorageWarning}
                                    onChange={e => setFormData({ ...formData, dashStorageWarning: parseInt(e.target.value) })}
                                    className="w-full h-12 !bg-surface-container-high border-amber-500/20 font-data-mono text-lg text-amber-500 px-4 focus:border-amber-500 transition-all rounded shadow-inner"
                                />
                                <span className="font-data-mono text-xs text-on-surface-variant">%</span>
                            </div>
                            <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest italic opacity-40">Amber alert trigger threshold for node storage utilization.</p>
                        </div>

                        <div className="space-y-6">
                            <label className="font-label-caps text-[10px] text-error uppercase tracking-widest ml-1 flex items-center gap-3 opacity-80">
                                <Zap className="w-3.5 h-3.5" /> STORAGE_CRITICAL_LVL
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    min="60"
                                    max="99"
                                    value={formData.dashStorageCritical}
                                    onChange={e => setFormData({ ...formData, dashStorageCritical: parseInt(e.target.value) })}
                                    className="w-full h-12 !bg-surface-container-high border-error/20 font-data-mono text-lg text-error px-4 focus:border-error transition-all rounded shadow-inner"
                                />
                                <span className="font-data-mono text-xs text-on-surface-variant">%</span>
                            </div>
                            <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest italic opacity-40">Red alert trigger threshold for node storage utilization.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end pt-8 gap-6">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded flex items-center gap-4 group">
                    <Info className="w-5 h-5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                    <p className="font-label-caps text-[9px] text-on-surface-variant leading-relaxed uppercase tracking-widest italic">
                        PROTOCOL_NOTE: SYSTEM PARAMETER UPDATES MAY REQUIRE A RE-SYNC CYCLE (60S) FOR AGGREGATED CRON TASKS.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="cyber-button px-10 h-16 !bg-primary text-on-primary-container border-primary shadow-[0_0_30px_rgba(var(--primary-fixed),0.2)] flex items-center gap-4"
                >
                    {updateMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                    {updateMutation.isPending ? 'COMMITTING...' : 'COMMIT_SYSTEM_SYNC'}
                </button>
            </div>
        </div>
    );
}
