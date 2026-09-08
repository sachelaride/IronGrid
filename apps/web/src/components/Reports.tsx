import { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { trpc } from '../utils/trpc';

export function Reports() {
    const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('1h');
    const [isGenerating, setIsGenerating] = useState(false);

    const generateMutation = (trpc as any).reports.generateDeviceReport.useMutation();

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            const result = await generateMutation.mutateAsync({ timeRange });
            const linkSource = `data:application/pdf;base64,${result.base64}`;
            const downloadLink = document.createElement("a");
            const fileName = `irongrid_report_${new Date().toISOString().split('T')[0]}.pdf`;

            downloadLink.href = linkSource;
            downloadLink.download = fileName;
            downloadLink.click();
        } catch (error) {
            console.error('Error generating report:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-3xl p-5 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-surface-container-highest rounded-xl text-primary shadow-[0_0_20px_rgba(59,130,246,0.12)] rotate-2">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-main italic tracking-tight">Relatórios de Rede</h2>
                        <p className="text-[10px] text-main/70 font-bold uppercase tracking-widest mt-0.5">Gerar extratos PDF da infraestrutura</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-main/40 uppercase tracking-widest px-2 block mb-3">Período do Relatório</label>
                            <div className="flex gap-2 p-1.5 bg-card/70 rounded-2xl border border-border w-fit">
                                {(['1h', '24h', '7d'] as const).map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setTimeRange(range)}
                                        className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${timeRange === range
                                            ? 'bg-sky-200 text-slate-950 border border-sky-300 shadow-inner shadow-sky-100'
                                            : 'text-main/75 hover:text-main/95 hover:bg-card/80'
                                            }`}
                                    >
                                        {range === '1h' ? 'Última Hora' : range === '24h' ? '24 Horas' : '7 Dias'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleDownload}
                                disabled={isGenerating}
                                className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-sky-200 hover:bg-sky-300 text-slate-950 font-black italic rounded-2xl transition-all shadow-lg shadow-sky-200/20 active:scale-95 uppercase tracking-widest text-xs disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Gerando PDF...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        Download Relatório PDF
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="bg-card/80 rounded-2xl p-6 border border-border flex flex-col justify-center shadow-inner">
                        <h3 className="text-sm font-black text-main/90 mb-4 uppercase italic">O que está incluído?</h3>
                        <ul className="text-xs font-bold text-main/60 space-y-3">
                            <li className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary/80"></div>
                                Lista de todos os dispositivos ativos/monitorados
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                Estatísticas detalhadas de status e latência (ping)
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                Uptime do sistema e histórico recente
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                Métricas básicas de tráfego para dispositivos SNMP
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="bg-card/30 border border-dashed border-border rounded-3xl p-6 text-center">
                <p className="text-main/30 text-xs font-bold uppercase tracking-widest max-w-md mx-auto">
                    Relatórios personalizados avançados com gráficos e entrega agendada em breve na Fase 2.
                </p>
            </div>
        </div>
    );
}
