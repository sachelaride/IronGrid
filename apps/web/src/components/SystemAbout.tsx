import { AlertTriangle, Box, CheckCircle2, HeartHandshake, Info, Lightbulb, Network, Shield } from 'lucide-react';

export function SystemAbout() {
    const items = [
        { label: 'Monitoramento de rede', value: 'SNMP, ping, agentes Windows/Linux, inventario e graficos operacionais' },
        { label: 'Capacidade desta edicao', value: 'Ate 600 dispositivos ativos cadastrados' },
        { label: 'Acesso', value: 'Interface web na porta 3001, Grafana auxiliar e coleta via agentes' },
        { label: 'Suporte', value: 'sachelaride@gmail.com / (67) 9.9859-9051' },
    ];

    const improvements = [
        'Empacotar RustDesk completo no instalador Windows para conexao remota com menos passos.',
        'Adicionar assistente de diagnostico do agente com teste de servico, firewall, SNMP e conectividade.',
        'Criar painel de saude do Docker com status de banco, InfluxDB, Grafana, portas e uso de disco.',
        'Ampliar automacoes de discovery para sugerir comunidades SNMP, interfaces relevantes e mapas.',
    ];

    const dockerLimits = [
        'O Docker facilita a entrega, mas algumas funcoes dependem da rede do host, portas expostas e permissoes do sistema operacional.',
        'Coletas SNMP, syslog e descoberta podem exigir ajustes de firewall, roteamento, UDP e permissao de rede.',
        'Vulnerabilidades reportadas por scanners podem vir da imagem base ou de pacotes do Alpine/Node e serao reduzidas conforme novas bases forem publicadas.',
        'Essas limitacoes podem ser sanadas nas proximas versoes com imagens mais enxutas, hardening e empacotamento separado por perfil.',
    ];

    return (
        <div className="space-y-gutter animate-in fade-in duration-700 pt-4">
            <div className="glass-panel p-10 border-white/5 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-4 text-primary">
                            <Info size={28} />
                            <h2 className="font-display-lg text-4xl text-primary uppercase tracking-tighter">Sobre o sistema</h2>
                        </div>
                        <p className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-[0.22em] leading-relaxed">
                            IronGrid centraliza monitoramento de rede, inventario, alertas, chamados e operacao visual para ambientes de TI.
                        </p>
                    </div>
                    <div className="rounded border border-primary/20 bg-primary/10 px-5 py-3 font-data-mono text-xs text-primary">
                        IRONGRID 12 / NETWORK MONITORING
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {items.map((item) => (
                        <div key={item.label} className="border border-white/5 bg-surface-container/70 rounded p-6 space-y-3">
                            <div className="flex items-center gap-3 text-primary">
                                <CheckCircle2 size={16} />
                                <span className="font-label-caps text-[10px] uppercase tracking-widest">{item.label}</span>
                            </div>
                            <p className="text-sm text-on-surface-variant leading-relaxed">{item.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-gutter">
                <section className="glass-panel p-8 border-white/5 space-y-6 xl:col-span-2">
                    <div className="flex items-center gap-4 text-primary">
                        <Lightbulb size={24} />
                        <h3 className="font-display-lg text-2xl uppercase tracking-tighter">Melhorias sugeridas</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {improvements.map((item) => (
                            <div key={item} className="flex items-start gap-3 rounded border border-white/5 bg-surface-container/60 p-5">
                                <Network size={16} className="text-primary shrink-0 mt-1" />
                                <p className="text-sm text-on-surface-variant leading-relaxed">{item}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="glass-panel p-8 border-primary/20 bg-primary/5 space-y-5">
                    <div className="flex items-center gap-4 text-primary">
                        <HeartHandshake size={24} />
                        <h3 className="font-display-lg text-2xl uppercase tracking-tighter">Contribua com o projeto</h3>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                        Sua contribuicao ajuda a evoluir instaladores, seguranca, dashboards, documentacao e suporte a novos cenarios de rede.
                    </p>
                    <div className="rounded border border-white/5 bg-surface-container/80 p-5 font-data-mono text-xs text-on-surface">
                        PIX: 558252491-68<br />
                        PIX: sachelaride@gmail.com
                    </div>
                </section>
            </div>

            <section className="glass-panel p-8 border-white/5 space-y-6">
                <div className="flex items-center gap-4 text-amber-300">
                    <Box size={24} />
                    <h3 className="font-display-lg text-2xl uppercase tracking-tighter">Limitacoes conhecidas via Docker</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dockerLimits.map((item) => (
                        <div key={item} className="flex items-start gap-3 rounded border border-amber-300/10 bg-amber-300/5 p-5">
                            <AlertTriangle size={16} className="text-amber-300 shrink-0 mt-1" />
                            <p className="text-sm text-on-surface-variant leading-relaxed">{item}</p>
                        </div>
                    ))}
                </div>
                <div className="flex items-start gap-3 rounded border border-primary/10 bg-primary/5 p-5">
                    <Shield size={18} className="text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                        A imagem foi ajustada para atualizar pacotes Alpine durante o build, reduzindo vulnerabilidades corrigiveis disponiveis na base atual.
                    </p>
                </div>
            </section>
        </div>
    );
}
