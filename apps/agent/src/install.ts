import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';
import readline from 'readline';

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

function askQuestion(query: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

export async function uninstallAgent() {
    const isWindows = process.platform === 'win32';
    const targetDir = isWindows ? 'C:\\IronGridAgent' : '/opt/irongrid-agent';
    const daemonDir = path.join(targetDir, 'daemon');
    const serviceName = 'IronGridAgent';
    const wrapperPath = path.join(daemonDir, `${serviceName}.exe`);

    console.log('[Uninstall] Starting cleanup...');

    if (isWindows) {
        // 0. Kill any hanging processes
        console.log('[Uninstall] Killing hanging processes if any...');
        try { execSync(`taskkill /F /FI "PID ne ${process.pid}" /IM IronGridAgent.exe /T`, { stdio: 'pipe' }); } catch (e) { }
        try { execSync('taskkill /F /IM agent-win.exe /T', { stdio: 'pipe' }); } catch (e) { }
        await sleep(500);

        if (fs.existsSync(wrapperPath)) {
            console.log('[Uninstall] Stopping and uninstalling service via wrapper...');
            try { execSync(`"${wrapperPath}" stop`, { stdio: 'pipe' }); } catch (e) { }
            try { execSync(`"${wrapperPath}" uninstall`, { stdio: 'pipe' }); } catch (e) { }
            await sleep(2000);
        }

        console.log('[Uninstall] Forcing cleanup via sc delete (legacy service removal)...');
        try { execSync(`sc stop ${serviceName}`, { stdio: 'pipe' }); } catch (e) { }
        try { execSync(`sc delete ${serviceName}`, { stdio: 'pipe' }); } catch (e) { }

        console.log('[Uninstall] Removing Registry Run keys...');
        try { execSync(`reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "IronGridAgent" /f`, { stdio: 'pipe' }); } catch (e) { }
        try { execSync(`reg delete "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "IronGridAgent" /f`, { stdio: 'pipe' }); } catch (e) { }

        // Loop to wait until the service is actually gone or we timeout
        let isPresent = true;
        for (let i = 0; i < 5; i++) {
            try {
                execSync(`sc query ${serviceName}`, { stdio: 'pipe' });
                console.log(`[Uninstall] Legacy Service still present, waiting... (${i + 1}/5)`);
                await sleep(2000);
            } catch (e) {
                isPresent = false;
                break;
            }
        }

        if (isPresent) {
            console.warn('[Uninstall] WARNING: Service is still "marked for deletion".');
        } else {
            console.log('[Uninstall] Cleanup successfully finished.');
        }

        await sleep(1000);
    } else {
        console.log('[Uninstall] Removing systemd service...');
        try {
            execSync('systemctl stop irongrid-agent');
            execSync('systemctl disable irongrid-agent');
            if (fs.existsSync('/etc/systemd/system/irongrid-agent.service')) {
                fs.unlinkSync('/etc/systemd/system/irongrid-agent.service');
                execSync('systemctl daemon-reload');
            }
        } catch (e) { }
    }
}

export async function installAgent(serverUrl?: string, rustdeskIp?: string, rustdeskKey?: string, rustdeskRelay?: string, skipSnmpPrompt = false) {
    const isWindows = process.platform === 'win32';
    const targetDir = isWindows ? 'C:\\IronGridAgent' : '/opt/irongrid-agent';
    const exeName = isWindows ? 'agent-win.exe' : 'agent-linux';
    const targetExe = path.join(targetDir, exeName);
    const configPath = path.join(targetDir, 'config.json');

    console.log(`[Install] Starting installation to ${targetDir}...`);

    try {
        // 0. Cleanup first
        await uninstallAgent();

        // 1. Create directory
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // 3. Create or Update config.json (Moved up to be available for SNMP logic)
        const currentConfig = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
        const config = {
            serverUrl: serverUrl || currentConfig.serverUrl || 'http://localhost:3001',
            agentId: os.hostname(),
            rustdeskHost: rustdeskIp || currentConfig.rustdeskHost || '',
            rustdeskRelay: rustdeskRelay || currentConfig.rustdeskRelay || '',
            rustdeskKey: rustdeskKey || currentConfig.rustdeskKey || ''
        };
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log(`[Install] Configuration updated with server: ${config.serverUrl}`);

        // 2. Copy current executable
        const currentExe = process.execPath;
        const isPackaged = (process as any).pkg !== undefined;

        if (!isPackaged && (currentExe.toLowerCase().includes('node') || currentExe.toLowerCase().includes('tsx'))) {
            console.warn('[Install] Running in dev mode (node/tsx). Skipping executable copy.');
        } else {
            fs.copyFileSync(currentExe, targetExe);
            console.log(`[Install] Copied executable to ${targetExe}`);

            // 2.1 Configure Firewall (Windows Only)
            if (isWindows) {
                console.log('[Install] Configuring Windows Firewall rules...');
                try {
                    // Allow ICMP (Ping) so the scanner can find us
                    execSync('netsh advfirewall firewall add rule name="IronGrid Agent - ICMP" protocol=icmpv4:8,any dir=in action=allow', { stdio: 'pipe' });
                    // Allow the agent executable
                    execSync(`netsh advfirewall firewall add rule name="IronGrid Agent - App" dir=in action=allow program="${targetExe}" enable=yes`, { stdio: 'pipe' });
                    // Allow SNMP (UDP 161)
                    execSync('netsh advfirewall firewall add rule name="IronGrid Agent - SNMP" protocol=UDP dir=in localport=161 action=allow profile=any', { stdio: 'pipe' });
                    console.log('[Install] Firewall rules configured.');
                } catch (fwErr: any) {
                    console.log(`[Install] Note: Firewall rule already exists or error: ${fwErr.message}`);
                }

                        const snmpAnswer = skipSnmpPrompt ? 'n' : await askQuestion('\n[Install] Deseja instalar e configurar o Protocolo SNMP do Windows automaticamente agora? (S/n): ');
                        if (snmpAnswer.trim().toLowerCase() !== 'n') {
                            console.log('[Install] Verificando Windows SNMP Service...');
                            try {
                                // 1. Tenta instalar caso não exista (Isso exige privilégios de Admin e às vezes internet)
                                console.log('[Install] Ativando recurso SNMP no Windows (Aguarde)...');
                                const installCmd = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Add-WindowsCapability -Online -Name SNMP.Client~~~~0.0.1.0"';
                                execSync(installCmd, { stdio: 'inherit' });

                                // 2. Configura Comunidade 'IronGrid' (4 = READ ONLY)
                                console.log('[Install] Configurando comunidade SNMP: IronGrid');
                                execSync('reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\SNMP\\Parameters\\ValidCommunities" /v IronGrid /t REG_DWORD /d 4 /f', { stdio: 'pipe' });
                                
                                // 3. REMOVE restrições de Managers para garantir que o Servidor consiga descobrir o agente
                                console.log('[Install] Liberando SNMP para qualquer host (Modo Descoberta)...');
                                try {
                                    execSync('reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Services\\SNMP\\Parameters\\PermittedManagers" /f', { stdio: 'pipe' });
                                    execSync('reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\SNMP\\Parameters\\PermittedManagers" /v 1 /t REG_SZ /d localhost /f', { stdio: 'pipe' });
                                    execSync('reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Services\\SNMP\\Parameters\\PermittedManagers" /v 1 /f', { stdio: 'pipe' });
                                } catch(e) { }

                                // 4. Abre o Firewall para SNMP (UDP 161)
                                console.log('[Install] Abrindo porta UDP 161 no Firewall...');
                                try { 
                                    execSync('netsh advfirewall firewall delete rule name="IronGrid - SNMP"', { stdio: 'pipe' });
                                    execSync('netsh advfirewall firewall add rule name="IronGrid - SNMP" protocol=UDP dir=in localport=161 action=allow profile=any', { stdio: 'pipe' }); 
                                } catch(err) {}
                                
                                // 5. Garante que o serviço está no modo Automático e Reinicia
                                console.log('[Install] Reiniciando serviço SNMP...');
                                try { 
                                    execSync('sc config SNMP start= auto', { stdio: 'pipe' });
                                    execSync('powershell.exe -NoProfile -Command "Restart-Service SNMP -ErrorAction SilentlyContinue"', { stdio: 'pipe' }); 
                                } catch(e) {}
                                
                                console.log('\n[Install] SNMP configurado com sucesso! Comunidade: IronGrid');
                            } catch (snmpErr: any) {
                                console.log(`\n[Install] Nao foi possivel completar a instalacao automatica do SNMP: ${snmpErr.message}`);
                            }
                        } else {
                            console.log(`\n[Install] Instalacao do SNMP ignorada pelo usuario.`);
                    }
                }
            }

            // 3. Configure RustDesk (Remote Access)
            console.log('[Install] Configuring RustDesk Remote Access...');
            const rustdeskPath = path.join(targetDir, 'rustdesk.exe');
            if (fs.existsSync(rustdeskPath)) {
                try {
                    // Generate dynamic password
                    const crypto = require('crypto');
                    const rustdeskPassword = crypto.randomBytes(6).toString('hex');
                    
                    const sysProfileDir = 'C:\\Windows\\System32\\config\\systemprofile\\AppData\\Roaming\\RustDesk\\config';
                    if (rustdeskIp || rustdeskKey) {
                        fs.mkdirSync(sysProfileDir, { recursive: true });
                        let fileContents = `rendezvous_server = '${rustdeskIp || ''}'\n`;
                        if (rustdeskRelay) {
                            fileContents += `relay_server = '${rustdeskRelay}'\n`;
                        }
                        if (rustdeskKey) {
                            fileContents += `key = '${rustdeskKey}'\n`;
                        }
                        fs.writeFileSync(path.join(sysProfileDir, 'RustDesk2.toml'), fileContents);
                        console.log(`[Install] RustDesk2.toml configured via CLI arguments: ${rustdeskIp || '<default>'}`);
                    } else {
                        // Fetch RustDesk Server config from API (if available)
                        try {
                            const apiUrl = new URL('/api/public/rustdesk', config.serverUrl).toString();
                            const response = await globalThis.fetch(apiUrl).catch(() => null);
                            if (response && response.ok) {
                                const { host, key } = await response.json();
                                if (host) {
                                    fs.mkdirSync(sysProfileDir, { recursive: true });
                                    const fileContents = `rendezvous_server = '${host}'\n${key ? `key = '${key}'\n` : ''}`;
                                    fs.writeFileSync(path.join(sysProfileDir, 'RustDesk2.toml'), fileContents);
                                    console.log('[Install] RustDesk2.toml configured via API.');
                                }
                            }
                        } catch(e) {
                            console.warn('[Install] Could not fetch RustDesk config from server. Using defaults.');
                        }
                    }

                    // Install as service
                    console.log('[Install] Installing RustDesk service...');
                    execSync(`"${rustdeskPath}" --install`, { stdio: 'ignore' });
                    
                    // Wait a bit for service to start
                    await sleep(2000);
                    
                    // Set dynamic password
                    console.log('[Install] Setting dynamic RustDesk password...');
                    execSync(`"${rustdeskPath}" --password ${rustdeskPassword}`, { stdio: 'ignore' });
                    
                    // Save password to config so inventoryCollector can send it
                    (config as any).rustdeskPassword = rustdeskPassword;
                    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                    
                    console.log('[Install] RustDesk provisioned successfully.');
                } catch (rdErr: any) {
                    console.error('[Install] Failed to provision RustDesk:', rdErr.message);
                }
            } else {
                console.log('[Install] rustdesk.exe not found in installer, skipping RustDesk provisioning.');
            }

        // 4. Register Autostart / Service
        if (isWindows) {
            console.log('[Install] Installing Windows service support and user tray autostart...');
            const serviceName = 'IronGridAgent';
            const daemonDir = path.join(targetDir, 'daemon');
            const wrapperPath = path.join(daemonDir, `${serviceName}.exe`);
            const xmlPath = path.join(daemonDir, `${serviceName}.xml`);
            let serviceCreated = false;

            try {
                if (!fs.existsSync(daemonDir)) {
                    fs.mkdirSync(daemonDir, { recursive: true });
                }

                let sourceWinsw = '';
                try {
                    sourceWinsw = path.join(path.dirname(require.resolve('node-windows')), '..', 'bin', 'winsw', 'winsw.exe');
                } catch (resolveErr) {
                    sourceWinsw = path.resolve(__dirname, '..', '..', '..', 'node_modules', 'node-windows', 'bin', 'winsw', 'winsw.exe');
                }

                if (fs.existsSync(sourceWinsw)) {
                    fs.copyFileSync(sourceWinsw, wrapperPath);
                    console.log(`[Install] Extracted service wrapper: ${wrapperPath}`);

                    const xmlContent = `
<service>
  <id>${serviceName}</id>
  <name>IronGrid Monitor Agent</name>
  <description>IronGrid Agent Service</description>
  <executable>${targetExe}</executable>
  <workingdirectory>${targetDir}</workingdirectory>
  <startmode>Automatic</startmode>
  <log mode="roll"></log>
</service>`.trim();

                    fs.writeFileSync(xmlPath, xmlContent);
                    console.log(`[Install] Generated service config: ${xmlPath}`);

                    try {
                        execSync(`"${wrapperPath}" install`, { stdio: 'inherit' });
                        console.log('[Install] Service installed using winsw wrapper.');
                        serviceCreated = true;
                    } catch (installErr: any) {
                        console.warn('[Install] winsw install failed:', installErr.message);
                    }
                }

                if (!serviceCreated) {
                    try {
                        console.log('[Install] Creating service using sc create fallback...');
                        execSync(`sc create ${serviceName} binPath= "${targetExe}" DisplayName= "IronGrid Monitor Agent" start= auto`, { stdio: 'inherit' });
                        serviceCreated = true;
                    } catch (scErr: any) {
                        console.warn('[Install] sc create failed:', scErr.message);
                    }
                }

                if (serviceCreated) {
                    try {
                        execSync(`sc config ${serviceName} start= auto`, { stdio: 'inherit' });
                        execSync(`sc start ${serviceName}`, { stdio: 'inherit' });
                        console.log('[Install] Windows Service registered and started.');
                    } catch (startErr: any) {
                        console.error(`[Install] Failed to start service: ${startErr.message}`);
                    }
                }
            } catch (err: any) {
                console.error(`[Install] Service registration failed: ${err.message}`);
            }

            try {
                execSync(`reg delete "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "IronGridAgentUI" /f`, { stdio: 'pipe' });
                console.log('[Install] Removed legacy Tray UI autostart to avoid console windows.');
            } catch (uiErr: any) {
                console.log('[Install] No legacy Tray UI autostart found.');
            }
        } else {
            console.log('[Install] Registering Systemd Service...');
            const serviceFile = `[Unit]
Description=IronGrid Monitor Agent
After=network.target

[Service]
Type=simple
ExecStart=${targetExe}
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target`;

            const unitPath = '/etc/systemd/system/irongrid-agent.service';
            try {
                fs.writeFileSync(unitPath, serviceFile);
                execSync('systemctl daemon-reload');
                execSync('systemctl enable irongrid-agent');
                execSync('systemctl start irongrid-agent');
                console.log('[Install] Systemd service registered and started.');
            } catch (err: any) {
                console.error(`[Install] Failed to register Systemd Service: ${err.message}`);
                console.log('[Install] Tip: Run with sudo to register services.');
            }
        }

        console.log('[Install] Installation complete!');
    } catch (error: any) {
        console.error(`[Install] FATAL ERROR: ${error.message}`);
    }

    await askQuestion('\n[Install] Concluido. Pressione ENTER para sair do instalador...');
}
