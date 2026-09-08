import { useState } from 'react';
import { 
    Download, Monitor, Shield, Terminal, Copy, Check, 
    ArrowRight, AlertCircle, Info, Server, Cpu, Globe, X, Command
} from 'lucide-react';

/**
 * AgentManager - Central de Distribuição de Agentes IronGrid.
 * Modernizado para a estética Cyber-Dark Mission Control.
 */
export function AgentManager() {
    const [serverIp, setServerIp] = useState('');
    const [community, setCommunity] = useState('IronGrid');
    const [serverPort, setServerPort] = useState('3001');
    const [rustDeskHost, setRustDeskHost] = useState('');
    const [rustDeskRelayHost, setRustDeskRelayHost] = useState('');
    const [rustDeskRelayPort, setRustDeskRelayPort] = useState('21117');
    const [rustDeskKey, setRustDeskKey] = useState('');
    const [copied, setCopied] = useState<string | null>(null);

    const safeServerIp = serverIp.trim() || 'IP_SERVIDOR';
    const safeCommunity = community.trim() || 'IronGrid';
    const safeServerPort = serverPort.trim() || '3001';
    const safeRustDeskHost = rustDeskHost.trim() || safeServerIp;
    const safeRustDeskRelayHost = rustDeskRelayHost.trim() || safeRustDeskHost;
    const safeRustDeskRelayPort = rustDeskRelayPort.trim() || '21117';
    const safeRustDeskRelay = `${safeRustDeskRelayHost}:${safeRustDeskRelayPort}`;
    const safeRustDeskKey = rustDeskKey.trim();

    const winCommand = `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; $env:IRONGRID_SERVERIP='${safeServerIp}'; $env:IRONGRID_SERVERPORT='${safeServerPort}'; $env:IRONGRID_COMMUNITY='${safeCommunity}'; $env:RUSTDESK_SERVER='${safeRustDeskHost}'; $env:RUSTDESK_RELAY='${safeRustDeskRelay}'; $env:RUSTDESK_KEY='${safeRustDeskKey}'; iex ((New-Object System.Net.WebClient).DownloadString('http://${safeServerIp}:${safeServerPort}/downloads/install_agent.ps1'))`;
    
    const linuxCommand = `curl -sSL http://${safeServerIp}:${safeServerPort}/downloads/install_agent.sh | sudo bash -s -- "${safeServerIp}" "${safeCommunity}" "${safeServerPort}" "${safeRustDeskHost}" "${safeRustDeskKey}" "${safeRustDeskRelay}"`;

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="space-y-gutter animate-in fade-in duration-700 pt-4">
            {/* Header Area */}
            <div className="glass-panel p-10 border-white/5 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <Download size={160} className="text-primary" />
                </div>
                <div className="flex items-center gap-8 relative z-10">
                    <div className="w-20 h-20 bg-primary/10 rounded border border-primary/20 flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary-fixed),0.1)]">
                        <Download size={32} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="font-display-lg text-4xl text-primary uppercase tracking-tighter">Gestao de agentes</h2>
                        <p className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-[0.3em] mt-1 italic">Distribuicao de agentes para monitoramento, SNMP e acesso remoto</p>
                    </div>
                </div>
            </div>

            {/* Quick Config */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
                <div className="lg:col-span-2 glass-panel p-10 border-white/5 space-y-10">
                    <div className="flex items-center gap-4">
                        <Server size={20} className="text-primary" />
                        <h3 className="font-display-lg text-xl text-on-surface uppercase tracking-tighter">Parametros de instalacao</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        <div className="space-y-3">
                            <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Globe size={12} /> IP ou host do servidor
                            </label>
                            <input 
                                type="text"
                                value={serverIp}
                                onChange={(e) => setServerIp(e.target.value)}
                                className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase"
                                placeholder="IP_SERVIDOR"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Shield size={12} /> Comunidade SNMP
                            </label>
                            <input 
                                type="text"
                                value={community}
                                onChange={(e) => setCommunity(e.target.value)}
                                className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs uppercase"
                                placeholder="IronGrid"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1 flex items-center gap-2"><Server size={12} /> Porta do IronGrid</label>
                            <input type="text" value={serverPort} onChange={(e) => setServerPort(e.target.value)} className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs" placeholder="3001" />
                        </div>
                        <div className="space-y-3">
                            <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1 flex items-center gap-2"><Monitor size={12} /> Servidor RustDesk HBBS</label>
                            <input type="text" value={rustDeskHost} onChange={(e) => setRustDeskHost(e.target.value)} className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs" placeholder="IP_SERVIDOR" />
                        </div>
                        <div className="space-y-3">
                            <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1 flex items-center gap-2"><Monitor size={12} /> IP Relay RustDesk</label>
                            <input type="text" value={rustDeskRelayHost} onChange={(e) => setRustDeskRelayHost(e.target.value)} className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs" placeholder="IP_SERVIDOR" />
                        </div>
                        <div className="space-y-3">
                            <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1 flex items-center gap-2"><Server size={12} /> Porta Relay RustDesk</label>
                            <input type="text" value={rustDeskRelayPort} onChange={(e) => setRustDeskRelayPort(e.target.value)} className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs" placeholder="21117" />
                        </div>
                        <div className="space-y-3 md:col-span-2 xl:col-span-3">
                            <label className="font-label-caps text-[10px] text-primary uppercase tracking-widest ml-1 flex items-center gap-2"><Shield size={12} /> Chave publica RustDesk</label>
                            <input type="text" value={rustDeskKey} onChange={(e) => setRustDeskKey(e.target.value)} className="w-full !bg-surface-container-high border-white/5 font-data-mono text-xs" placeholder="cole aqui a chave publica do hbbs; pode deixar vazio para testar" />
                        </div>
                    </div>
                    <div className="p-6 bg-primary/5 border border-primary/10 rounded flex items-start gap-4">
                        <Info size={18} className="text-primary shrink-0 mt-0.5" />
                        <p className="font-label-caps text-[10px] text-on-surface-variant leading-relaxed uppercase tracking-widest">
                            O instalador grafico permite revisar IP, porta, comunidade SNMP, RustDesk e Firewall antes de instalar.
                        </p>
                    </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 p-10 rounded flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute -bottom-10 -right-10 opacity-5">
                        <Shield size={120} className="text-primary" />
                    </div>
                    <div className="flex items-center gap-4 mb-6 text-primary">
                        <Shield size={28} />
                        <h3 className="font-display-lg text-xl uppercase tracking-tighter">Ingestao segura</h3>
                    </div>
                    <p className="font-label-caps text-[10px] text-on-surface-variant leading-relaxed uppercase tracking-[0.2em] italic">
                        Os scripts automatizam a configuracao SNMP v2c, ajustam o firewall quando possivel e registram o dispositivo no servidor central.
                    </p>
                </div>
            </div>

            {/* Platform Selection */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-gutter">
                {/* Windows Card */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 ml-4">
                        <Monitor size={24} className="text-primary" />
                        <h3 className="font-display-lg text-2xl text-on-surface uppercase tracking-tighter">Dispositivo Windows</h3>
                    </div>
                    
                    <div className="glass-panel p-10 border-white/5 space-y-10 hover:border-primary/20 transition-all group">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h4 className="font-label-caps text-xs text-primary uppercase tracking-widest">Abrir instalador grafico via PowerShell</h4>
                                <span className="font-data-mono text-[9px] text-on-surface-variant bg-white/5 px-2 py-0.5 rounded">Requer administrador</span>
                            </div>
                            
                            <div className="relative group/cmd">
                                <div className="bg-black/40 border border-white/5 rounded p-8 font-data-mono text-[11px] text-primary break-all leading-relaxed shadow-inner max-h-40 overflow-y-auto custom-scrollbar">
                                    <span className="text-on-surface-variant/40 mr-2">$</span> {winCommand}
                                </div>
                                <button 
                                    onClick={() => handleCopy(winCommand, 'win')}
                                    className="absolute top-4 right-4 p-3 bg-white/5 hover:bg-primary hover:text-on-primary-container text-on-surface rounded transition-all border border-white/10 group-hover/cmd:border-primary/30"
                                >
                                    {copied === 'win' ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <a 
                                href={`http://${safeServerIp}:${safeServerPort}/downloads/IronGridAgentSetup_${safeServerIp}_v6.exe`}
                                className="flex items-center justify-between p-6 bg-surface-container/30 border border-white/5 rounded hover:border-primary transition-all group/btn"
                            >
                                <div className="flex items-center gap-4">
                                    <Download size={20} className="text-on-surface-variant group-hover/btn:text-primary transition-colors" />
                                    <span className="font-label-caps text-[11px] text-on-surface uppercase tracking-widest">Baixar instalador grafico [.EXE]</span>
                                </div>
                                <ArrowRight size={16} className="text-on-surface-variant/30 group-hover/btn:text-primary transition-all group-hover/btn:translate-x-1" />
                            </a>
                            <a 
                                href={`http://${safeServerIp}:${safeServerPort}/downloads/install_agent.ps1`}
                                className="flex items-center justify-between p-6 bg-surface-container/30 border border-white/5 rounded hover:border-primary transition-all group/btn"
                            >
                                <div className="flex items-center gap-4">
                                    <Terminal size={20} className="text-on-surface-variant group-hover/btn:text-primary transition-colors" />
                                    <span className="font-label-caps text-[11px] text-on-surface uppercase tracking-widest">Baixar script [.PS1]</span>
                                </div>
                                <ArrowRight size={16} className="text-on-surface-variant/30 group-hover/btn:text-primary transition-all group-hover/btn:translate-x-1" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Linux Card */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 ml-4">
                        <Cpu size={24} className="text-primary-fixed" />
                        <h3 className="font-display-lg text-2xl text-on-surface uppercase tracking-tighter">Dispositivo Linux</h3>
                    </div>
                    
                    <div className="glass-panel p-10 border-white/5 space-y-10 hover:border-primary/20 transition-all group">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h4 className="font-label-caps text-xs text-primary-fixed uppercase tracking-widest">Instalacao via terminal Bash</h4>
                                <span className="font-data-mono text-[9px] text-on-surface-variant bg-white/5 px-2 py-0.5 rounded">Requer root/sudo</span>
                            </div>
                            
                            <div className="relative group/cmd">
                                <div className="bg-black/40 border border-white/5 rounded p-8 font-data-mono text-[11px] text-primary-fixed-dim break-all leading-relaxed shadow-inner max-h-40 overflow-y-auto custom-scrollbar">
                                    <span className="text-on-surface-variant/40 mr-2">#</span> {linuxCommand}
                                </div>
                                <button 
                                    onClick={() => handleCopy(linuxCommand, 'linux')}
                                    className="absolute top-4 right-4 p-3 bg-white/5 hover:bg-primary-fixed-dim hover:text-on-primary-container text-on-surface rounded transition-all border border-white/10 group-hover/cmd:border-primary/30"
                                >
                                    {copied === 'linux' ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5 space-y-6">
                            <a 
                                href={`http://${safeServerIp}:${safeServerPort}/downloads/install_agent.sh`}
                                className="flex items-center justify-between p-6 bg-surface-container/30 border border-white/5 rounded hover:border-primary-fixed transition-all group/btn"
                            >
                                <div className="flex items-center gap-4">
                                    <Command size={20} className="text-on-surface-variant group-hover/btn:text-primary-fixed transition-colors" />
                                    <span className="font-label-caps text-[11px] text-on-surface uppercase tracking-widest">Baixar script [.SH]</span>
                                </div>
                                <ArrowRight size={16} className="text-on-surface-variant/30 group-hover/btn:text-primary-fixed transition-all group-hover/btn:translate-x-1" />
                            </a>
                            
                            <div className="flex items-center gap-4 p-6 bg-primary-fixed/5 border border-primary-fixed/10 rounded">
                                <AlertCircle size={20} className="text-primary-fixed" />
                                <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest leading-relaxed">
                                    Suporte para Debian, Ubuntu, RHEL e CentOS. Execute com permissao sudo/root.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RustDesk Configuration */}
            <div className="glass-panel p-10 border-white/5 space-y-10 hover:border-primary/20 transition-all mt-8">
                <div className="flex items-center gap-4">
                    <Monitor size={24} className="text-primary" />
                    <h3 className="font-display-lg text-2xl text-on-surface uppercase tracking-tighter">Acesso remoto RustDesk</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h4 className="font-label-caps text-xs text-primary uppercase tracking-widest">Chave publica do servidor</h4>
                            <span className="font-data-mono text-[9px] text-on-surface-variant bg-white/5 px-2 py-0.5 rounded">Necessaria para conexao</span>
                        </div>
                        <div className="relative group/cmd">
                            <div className="bg-black/40 border border-white/5 rounded p-8 font-data-mono text-[11px] text-primary break-all leading-relaxed shadow-inner">
                                {safeRustDeskKey || 'Informe a chave publica do hbbs acima'}
                            </div>
                            <button 
                                onClick={() => handleCopy(safeRustDeskKey, 'rd-key')}
                                className="absolute top-1/2 -translate-y-1/2 right-4 p-3 bg-white/5 hover:bg-primary hover:text-on-primary-container text-on-surface rounded transition-all border border-white/10 group-hover/cmd:border-primary/30"
                            >
                                {copied === 'rd-key' ? <Check size={18} /> : <Copy size={18} />}
                            </button>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <h4 className="font-label-caps text-xs text-primary uppercase tracking-widest">Orientacoes de instalacao</h4>
                        <ul className="space-y-4 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest leading-relaxed">
                            <li className="flex items-start gap-3">
                                <ArrowRight size={14} className="text-primary shrink-0 mt-0.5" />
                                <span>O instalador agora recebe IP/porta do IronGrid e tambem servidor, relay e chave publica do RustDesk.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <ArrowRight size={14} className="text-primary shrink-0 mt-0.5" />
                                <span>A chave publica do HBBS pode ser informada acima. Se ficar vazia, o RustDesk pode funcionar apenas em modo padrao/teste, conforme a configuracao local.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <ArrowRight size={14} className="text-primary shrink-0 mt-0.5" />
                                <span>Abra as portas RustDesk 21115-21119 e a porta web IronGrid 3001 entre endpoints e servidor.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Technical Details Footer */}
            <div className="glass-panel p-10 border-white/5 flex flex-wrap gap-16 shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded border border-primary/20 flex items-center justify-center text-primary">
                        <Check size={24} />
                    </div>
                    <div>
                        <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest mb-1">Protocolo de comunicacao</p>
                        <p className="font-display-lg text-lg text-on-surface uppercase tracking-tight">SNMP_V2C / WS_PUSH</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded border border-primary/20 flex items-center justify-center text-primary">
                        <Globe size={24} />
                    </div>
                    <div>
                        <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest mb-1">Portas utilizadas</p>
                        <p className="font-display-lg text-lg text-on-surface uppercase tracking-tight">UDP:161 / TCP:3001</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded border border-primary/20 flex items-center justify-center text-primary">
                        <Monitor size={24} />
                    </div>
                    <div>
                        <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest mb-1">Estado operacional</p>
                        <p className="font-display-lg text-lg text-on-surface uppercase tracking-tight">Monitoramento hibrido ativo</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
