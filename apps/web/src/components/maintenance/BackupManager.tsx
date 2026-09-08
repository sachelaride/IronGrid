import { trpc } from '../../utils/trpc';
import { Archive, Database, Activity, RefreshCw, X, Download, Loader2, Info, CheckCircle2, AlertTriangle, Cloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * BackupManager - Governança de Redundância e Snapshot de Dados.
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
export function BackupManager() {
    const utils = trpc.useContext();
    const { data: backups, isLoading: isLoadingBackups } = (trpc as any).system.listBackups.useQuery();
    
    const { data: backupStatus } = (trpc as any).system.getSyslogBackupStatus.useQuery(undefined, {
        refetchInterval: (data: any) => data?.isBackingUp ? 3000 : false
    });

    const createBackupMutation = (trpc as any).system.createBackup.useMutation();
    const deleteBackupMutation = (trpc as any).system.deleteBackup.useMutation();
    const restoreBackupMutation = (trpc as any).system.restoreBackup.useMutation();

    const exportSystemDataMutation = (trpc as any).system.exportSystemData.useMutation();
    const importSystemDataMutation = (trpc as any).system.importSystemData.useMutation();

    const handleCreateBackup = async () => {
        await (createBackupMutation as any).mutateAsync();
        (utils as any).system.listBackups.invalidate();
    };

    const handleRestoreBackup = async (filename: string) => {
        if (confirm(`INITIATE_SYSTEM_RESTORE: Do you wish to overwrite current cluster state with snapshot [${filename}]?`)) {
            await (restoreBackupMutation as any).mutateAsync({ filename });
            window.location.reload();
        }
    };

    const handleDeleteBackup = async (filename: string) => {
        if (confirm(`EXTERMINATE_SNAPSHOT: Permanent deletion of [${filename}]?`)) {
            await (deleteBackupMutation as any).mutateAsync({ filename });
            (utils as any).system.listBackups.invalidate();
        }
    };

    const handleExportSystem = async () => {
        try {
            const result = await (exportSystemDataMutation as any).mutateAsync();
            const dataStr = JSON.stringify(result, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `irongrid_full_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e) {
            alert('SYSTEM_EXPORT_FAILURE: Check logs for forensic details.');
        }
    };

    const handleImportSystem = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e: any) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event: any) => {
                try {
                    const json = JSON.parse(event.target.result);
                    if (confirm('CRITICAL_OVERWRITE_WARNING: This action will replace ALL active node data, tickets, and configurations. Proceed with ingestion?')) {
                        await (importSystemDataMutation as any).mutateAsync(json);
                        window.location.reload();
                    }
                } catch (err) {
                    alert('SNAPSHOT_INGESTION_ERROR: ' + (err as any).message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    return (
        <div className="space-y-gutter animate-in fade-in duration-700 pt-4">
            <div className="glass-panel p-10 border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <Archive size={180} className="text-primary" />
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-12 relative z-10">
                    <div className="space-y-3 ml-2">
                        <h3 className="font-display-lg text-3xl text-primary uppercase tracking-tighter italic flex items-center gap-4">
                            <Archive size={28} /> REDUNDANCY_SNAPSHOT_GOVERNANCE
                        </h3>
                        <p className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-[0.3em] italic">Gerenciamento de Snapshots e Redundância do Core Cluster</p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={handleExportSystem}
                            disabled={exportSystemDataMutation.isPending}
                            className="cyber-button px-6 h-11 !bg-surface-container border-white/10 text-on-surface hover:border-primary transition-all flex items-center gap-2"
                        >
                            {exportSystemDataMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                            <span className="font-label-caps text-[9px] uppercase tracking-widest">EXPORT_JSON</span>
                        </button>
                        <button
                            onClick={handleImportSystem}
                            disabled={importSystemDataMutation.isPending}
                            className="cyber-button px-6 h-11 !bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-black transition-all flex items-center gap-2"
                        >
                            {importSystemDataMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                            <span className="font-label-caps text-[9px] uppercase tracking-widest">IMPORT_SNAPSHOT</span>
                        </button>
                        <button
                            onClick={handleCreateBackup}
                            disabled={createBackupMutation.isPending}
                            className="cyber-button px-6 h-11 !bg-primary text-on-primary-container border-primary flex items-center gap-2"
                        >
                            {createBackupMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
                            <span className="font-label-caps text-[9px] uppercase tracking-widest">COMMIT_SQL_BACKUP</span>
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {backupStatus?.isBackingUp && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-8 overflow-hidden"
                        >
                            <div className="p-8 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl flex items-center justify-between relative overflow-hidden group/active">
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 animate-scan pointer-events-none" />
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="p-4 bg-cyan-500/10 rounded-full border border-cyan-500/30 text-cyan-400 animate-pulse">
                                        <Activity size={24} />
                                    </div>
                                    <div>
                                        <p className="font-display-lg text-lg text-cyan-100 uppercase tracking-tight italic">SYSLOG_INGESTION_BACKUP_IN_PROGRESS</p>
                                        <p className="font-label-caps text-[10px] text-cyan-400/60 uppercase tracking-widest mt-1">Asynchronous node archival processing active on core server.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {!backupStatus?.isBackingUp && backupStatus?.lastStatus === 'success' && (
                         <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-8 overflow-hidden"
                        >
                            <div className="p-6 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <CheckCircle2 size={24} className="text-primary" />
                                    <div>
                                        <p className="font-label-caps text-[11px] text-primary uppercase tracking-widest font-black italic">SNAPSHOT_COMMITTED_SUCCESSFULLY</p>
                                        <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest mt-1 opacity-60">The redundancy matrix has been updated with the latest integrity snapshot.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => utils.system.listBackups.invalidate()}
                                    className="font-label-caps text-[10px] text-primary hover:text-on-surface uppercase tracking-[0.3em] transition-colors font-black"
                                >
                                    REFRESH_MATRIX
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {backupStatus?.lastStatus === 'failed' && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-8 overflow-hidden"
                        >
                            <div className="p-6 bg-error/10 border border-error/20 rounded-2xl flex items-center gap-6">
                                <AlertTriangle size={24} className="text-error animate-pulse" />
                                <div>
                                    <p className="font-label-caps text-[11px] text-error uppercase tracking-widest font-black italic">SNAPSHOT_INGESTION_FAILURE</p>
                                    <p className="font-data-mono text-[9px] text-error/60 uppercase tracking-widest mt-1">{backupStatus.lastError}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-4 relative z-10">
                    {isLoadingBackups ? (
                        <div className="flex flex-col items-center justify-center py-32 opacity-40">
                            <Loader2 size={40} className="animate-spin mb-6" />
                            <span className="font-label-caps text-[11px] uppercase tracking-widest italic">Interrogating Redundancy Matrix...</span>
                        </div>
                    ) : backups?.length === 0 ? (
                        <div className="glass-panel p-20 border-white/5 border-dashed flex flex-col items-center justify-center text-center bg-surface-container/5">
                            <Cloud size={64} className="text-on-surface-variant/10 mb-8" />
                            <h3 className="font-display-lg text-2xl text-on-surface-variant/30 uppercase tracking-tighter italic">NULL_REDUNDANCY_STATE</h3>
                            <p className="font-label-caps text-[10px] text-on-surface-variant/20 uppercase tracking-[0.2em] mt-4 italic">No cluster snapshots detected in the core storage hub.</p>
                        </div>
                    ) : (
                        backups?.map((backup: any) => (
                            <div key={backup.filename} className="glass-panel p-6 border-white/5 flex items-center justify-between group/item hover:border-primary/20 transition-all bg-surface-container/95">
                                <div className="flex items-center gap-8">
                                    <div className={`w-14 h-14 rounded-xl border flex items-center justify-center transition-all ${
                                        backup.type === 'syslog' 
                                            ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 group-hover/item:bg-cyan-500/20' 
                                            : 'bg-primary/10 border-primary/20 text-primary group-hover/item:bg-primary/20'
                                    }`}>
                                        <Database size={24} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-4">
                                            <span className={`px-2 py-0.5 rounded font-black text-[8px] uppercase tracking-widest border ${
                                                backup.type === 'syslog' 
                                                    ? 'bg-cyan-900/30 text-cyan-400 border-cyan-500/20' 
                                                    : 'bg-primary/10 text-primary border-primary/20'
                                            }`}>
                                                {backup.type === 'syslog' ? 'SYSLOG_SHARD' : 'CORE_CLUSTER'}
                                            </span>
                                            <span className="font-display-lg text-[15px] text-on-surface uppercase tracking-tight group-hover/item:text-primary transition-colors">{backup.filename}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-data-mono text-[10px] text-on-surface-variant uppercase tracking-widest opacity-60">
                                                VOLUME: {(backup.size / 1024 / 1024).toFixed(2)} MB
                                            </span>
                                            <span className="w-1 h-1 bg-white/10 rounded-full" />
                                            <span className="font-data-mono text-[10px] text-on-surface-variant uppercase tracking-widest opacity-60">
                                                TIMESTAMP: {new Date(backup.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 opacity-0 group-hover/item:opacity-100 transition-all translate-x-4 group-hover/item:translate-x-0">
                                    {backup.type !== 'syslog' && (
                                        <button
                                            onClick={() => handleRestoreBackup(backup.filename)}
                                            className="p-3 bg-primary/10 hover:bg-primary text-primary hover:text-black rounded-lg transition-all border border-primary/20 shadow-lg"
                                            title="RECOVER_SNAPSHOT"
                                        >
                                            <RefreshCw size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteBackup(backup.filename)}
                                        className="p-3 bg-error/10 hover:bg-error text-error hover:text-on-error rounded-lg transition-all border border-error/20 shadow-lg"
                                        title="ERASE_SNAPSHOT"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-12 p-8 bg-white/5 border border-white/5 rounded-2xl flex items-start gap-6 opacity-40 italic">
                    <Info size={20} className="text-primary shrink-0 mt-1" />
                    <div className="space-y-1">
                        <p className="font-label-caps text-[11px] text-primary uppercase tracking-[0.2em] font-black">INFRASTRUCTURE_REDUNDANCY_NOTICE</p>
                        <p className="font-label-caps text-[9px] text-on-surface-variant leading-relaxed uppercase tracking-widest">
                            Snapshots facilitate granular point-in-time recovery for active node matrices and operational policies. For massive Syslog shards, use the asynchronous SQL archival protocol to avoid network latency.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
