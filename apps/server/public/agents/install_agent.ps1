param (
    [string]$ServerIP = "",
    [int]$ServerPort = 3001,
    [string]$Community = "",
    [string]$RustDeskHost = "",
    [string]$RustDeskRelay = "",
    [string]$RustDeskKey = "",
    [switch]$InstallAgent = $true
)

$ErrorActionPreference = "Stop"
function Write-Info($msg) { Write-Host "[IronGrid] $msg" -ForegroundColor Cyan }
function Write-Success($msg) { Write-Host "[IronGrid] OK: $msg" -ForegroundColor Green }
function Write-WarningMsg($msg) { Write-Host "[IronGrid] WARN: $msg" -ForegroundColor Yellow }
function Write-ErrorMsg($msg) { Write-Host "[IronGrid] ERROR: $msg" -ForegroundColor Red }
function Write-Step($Step, $Msg) { Write-Host "[IronGrid][$Step] $msg" -ForegroundColor Cyan }
function Read-Default($Prompt, $Default) { $v = Read-Host "$Prompt [$Default]"; if ([string]::IsNullOrWhiteSpace($v)) { return $Default }; return $v }
function Test-IPv4($Value) {
    return ($Value -match '^\d{1,3}(\.\d{1,3}){3}$' -and ($Value.Split('.') | Where-Object { [int]$_ -ge 0 -and [int]$_ -le 255 }).Count -eq 4)
}

if ([string]::IsNullOrWhiteSpace($ServerIP)) { $ServerIP = if ($env:IRONGRID_SERVERIP) { $env:IRONGRID_SERVERIP } else { Read-Default "IPv4 do servidor IronGrid" "troque_ip_servidor" } }
if (-not $PSBoundParameters.ContainsKey('ServerPort') -and $env:IRONGRID_SERVERPORT) { $ServerPort = [int]$env:IRONGRID_SERVERPORT }
if ([string]::IsNullOrWhiteSpace($Community)) { $Community = if ($env:IRONGRID_COMMUNITY) { $env:IRONGRID_COMMUNITY } else { Read-Default "Comunidade SNMP" "IronGrid" } }
if ([string]::IsNullOrWhiteSpace($RustDeskHost)) { $RustDeskHost = if ($env:RUSTDESK_SERVER) { $env:RUSTDESK_SERVER } else { Read-Default "Servidor RustDesk HBBS/rendezvous" $ServerIP } }
if ([string]::IsNullOrWhiteSpace($RustDeskRelay)) { $RustDeskRelay = if ($env:RUSTDESK_RELAY) { $env:RUSTDESK_RELAY } else { Read-Default "Servidor RustDesk relay HBBR" "$($RustDeskHost):21117" } }
if ([string]::IsNullOrWhiteSpace($RustDeskKey)) { $RustDeskKey = if ($env:RUSTDESK_KEY) { $env:RUSTDESK_KEY } else { Read-Default "Chave publica RustDesk HBBS (Enter para deixar vazio)" "" } }

Write-Step "1/6" "Validando parametros recebidos..."
if (-not (Test-IPv4 $ServerIP)) {
    Write-ErrorMsg "Troque o IP do servidor antes de instalar. Use IPv4, exemplo: 192.168.0.133."
    Write-Info "Valor atual recebido: $ServerIP"
    exit 1
}

try { [Uri]::new("http://$ServerIP`:$ServerPort/") | Out-Null } catch { Write-ErrorMsg "Servidor invalido: $ServerIP`:$ServerPort"; exit 1 }
Write-Step "2/6" "Verificando permissao de administrador..."
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (!$currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { Write-ErrorMsg "Execute como ADMINISTRADOR."; exit 1 }

Write-Info "Servidor IronGrid: http://$ServerIP`:$ServerPort"
Write-Info "SNMP: $Community"
Write-Info "RustDesk rendezvous: $RustDeskHost"
Write-Info "RustDesk relay: $RustDeskRelay"
if ($RustDeskKey) { Write-Info "RustDesk key: <informada>" } else { Write-WarningMsg "RustDesk key vazia." }

try {
    Write-Info "Removendo autostart antigo da interface Tray para evitar janelas de prompt piscando..."
    Remove-ItemProperty -Path "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "IronGridAgentUI" -ErrorAction SilentlyContinue
    Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "IronGridAgent" -ErrorAction SilentlyContinue
    Remove-ItemProperty -Path "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "IronGridAgent" -ErrorAction SilentlyContinue
} catch { Write-WarningMsg "Nao foi possivel limpar autostart antigo: $($_.Exception.Message)" }

try {
    Write-Step "3/6" "Configurando SNMP do Windows..."
    $snmpClient = Get-WindowsCapability -Online -Name "SNMP.Client~~~~0.0.1.0"
    if ($snmpClient.State -ne 'Installed') {
        Write-Info "SNMP Client ainda nao instalado. Instalando recurso do Windows..."
        Add-WindowsCapability -Online -Name "SNMP.Client~~~~0.0.1.0"
    } else {
        Write-Info "SNMP Client ja instalado."
    }
    $baseKey = "HKLM:\SYSTEM\CurrentControlSet\Services\SNMP\Parameters"
    $commKey = "$baseKey\ValidCommunities"
    if (!(Test-Path $commKey)) { New-Item -Path $commKey -Force | Out-Null }
    Write-Info "Gravando comunidade SNMP: $Community"
    Set-ItemProperty -Path $commKey -Name $Community -Value 4
    $permKey = "$baseKey\PermittedManagers"
    if (!(Test-Path $permKey)) { New-Item -Path $permKey -Force | Out-Null }
    Write-Info "Permitindo monitoramento pelo servidor: $ServerIP"
    Set-ItemProperty -Path $permKey -Name "1" -Value $ServerIP
    Write-Info "Reiniciando servico SNMP..."
    Restart-Service -Name "SNMP" -Force -ErrorAction SilentlyContinue
    Set-Service -Name "SNMP" -StartupType Automatic -ErrorAction SilentlyContinue
    Write-Success "SNMP configurado."
} catch { Write-WarningMsg "SNMP nao foi configurado automaticamente: $($_.Exception.Message)" }

if ($InstallAgent) {
    Write-Step "4/6" "Preparando download do instalador grafico..."
    $workDir = "$env:TEMP\IronGrid"
    if (!(Test-Path $workDir)) {
        Write-Info "Criando pasta temporaria: $workDir"
        New-Item -Path $workDir -ItemType Directory -Force | Out-Null
    } else {
        Write-Info "Usando pasta temporaria: $workDir"
    }
    $setupUrl = "http://$($ServerIP):$($ServerPort)/downloads/IronGridAgentSetup_$($ServerIP)_v6.exe"
    $setupPath = "$workDir\IronGridAgentSetup_v6.exe"
    try {
        Write-Step "5/6" "Baixando instalador grafico..."
        Write-Info "Origem: $setupUrl"
        Write-Info "Destino: $setupPath"
        Invoke-WebRequest -Uri $setupUrl -OutFile $setupPath -UseBasicParsing
        if (!(Test-Path $setupPath)) { throw "Download finalizou, mas o arquivo nao foi encontrado em $setupPath" }
        $setupSizeMb = [math]::Round((Get-Item $setupPath).Length / 1MB, 2)
        Write-Success "Download concluido: $setupSizeMb MB"
        Write-Step "6/6" "Abrindo instalador grafico..."
        Write-Info "Abrindo instalador grafico. Preencha IP, comunidade, RustDesk e Firewall na tela."
        Start-Process -FilePath $setupPath -Wait
        Write-Info "Limpando novamente autostart antigo da interface Tray..."
        Remove-ItemProperty -Path "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "IronGridAgentUI" -ErrorAction SilentlyContinue
        Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "IronGridAgent" -ErrorAction SilentlyContinue
        Remove-ItemProperty -Path "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "IronGridAgent" -ErrorAction SilentlyContinue
        Write-Success "Instalador grafico finalizado."
    } catch {
        Write-ErrorMsg "Erro ao abrir instalador grafico: $($_.Exception.Message)"
        Write-Info "Confira se o servidor IronGrid esta acessivel pelo Windows em http://$($ServerIP):$($ServerPort)"
        Write-Info "Teste manual: abra http://$($ServerIP):$($ServerPort)/downloads/IronGridAgentSetup_$($ServerIP)_v6.exe no navegador do Windows."
        exit 1
    }
}
Write-Success "Configuracao finalizada."
