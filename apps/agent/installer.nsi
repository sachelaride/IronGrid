!include "MUI2.nsh"
!include "nsDialogs.nsh"
!include "LogicLib.nsh"

Name "IronGrid Agent"
OutFile "IronGridAgentSetup.exe"
InstallDir "C:\\IronGridAgent"
RequestExecutionLevel admin

; Variables
Var ServerIP
Var Dialog
Var Lbl1
Var ComboProtocol
Var Lbl2
Var TextIP
Var Lbl3
Var TextPort
Var Lbl4
Var TextRustDeskIP
Var Lbl5
Var Lbl6
Var Lbl7
Var TextCommunity
Var TextRustDeskRelay
Var TextRustDeskKey
Var CheckRustDesk
Var CheckOpenFirewall
Var CheckDisableFirewall
Var SelectedProtocol
Var InputIP
Var InputPort
Var InputCommunity
Var InputRustDeskIP
Var InputRustDeskRelay
Var InputRustDeskKey
Var InputUseRustDesk
Var InputOpenFirewall
Var InputDisableFirewall
Var DefaultIP
Var LogFile

;--------------------------------
; Interface Settings
!define MUI_ABORTWARNING
!define MUI_ICON "assets\IronGrid.ico"
!define MUI_UNICON "assets\IronGrid.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP_NOSTRETCH

;--------------------------------
; WordFunc for string manipulation
!include "WordFunc.nsh"

;--------------------------------
; Pages

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY

; Custom Page for Server IP
Page custom ServerPage ServerPageLeave

!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

;--------------------------------
; Languages
!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_LANGUAGE "PortugueseBR"

;--------------------------------
; Custom Page Function
Function ServerPage
    !insertmacro MUI_HEADER_TEXT "Configuração do Servidor" "Defina o endereço do servidor IronGrid e RustDesk."
    nsDialogs::Create 1018
    Pop $Dialog

    ${If} $Dialog == error
        Abort
    ${EndIf}

    ; Extrair IP do nome do arquivo (ex: IronGridAgentSetup_192.168.0.10.exe)
    ${WordFind} $EXEFILE "_" "-1" $0
    ${If} $0 != $EXEFILE
        ${WordFind} $0 ".exe" "+1" $DefaultIP
    ${Else}
        StrCpy $DefaultIP ""
    ${EndIf}

    ; Protocolo
    ${NSD_CreateLabel} 0 0 25% 12u "Protocolo:"
    Pop $Lbl1
    
    ${NSD_CreateDropList} 0 15u 25% 40u "http"
    Pop $ComboProtocol
    SendMessage $ComboProtocol ${CB_ADDSTRING} 0 "STR:http"
    SendMessage $ComboProtocol ${CB_ADDSTRING} 0 "STR:https"
    SendMessage $ComboProtocol ${CB_SELECTSTRING} -1 "STR:http"

    ; IP ou Hostname
    ${NSD_CreateLabel} 30% 0 45% 12u "Servidor IronGrid (IP):"
    Pop $Lbl2

    ${NSD_CreateText} 30% 15u 45% 12u "$DefaultIP"
    Pop $TextIP

    ; Porta
    ${NSD_CreateLabel} 80% 0 20% 12u "Porta:"
    Pop $Lbl3

    ${NSD_CreateText} 80% 15u 20% 12u "3001"
    Pop $TextPort

    ; Comunidade SNMP
    ${NSD_CreateLabel} 0 40u 40% 12u "Comunidade SNMP monitorada:"
    Pop $Lbl4

    ${NSD_CreateText} 0 55u 40% 12u "IronGrid"
    Pop $TextCommunity

    ; RustDesk enable
    ${NSD_CreateCheckbox} 45% 55u 55% 12u "Configurar RustDesk neste computador"
    Pop $CheckRustDesk
    ${NSD_Check} $CheckRustDesk

    ; Servidor RustDesk (IP)
    ${NSD_CreateLabel} 0 75u 45% 12u "Servidor RustDesk HBBS:"
    Pop $Lbl5

    ${NSD_CreateText} 0 90u 45% 12u "$DefaultIP"
    Pop $TextRustDeskIP

    ; Servidor RustDesk Relay
    ${NSD_CreateLabel} 50% 75u 50% 12u "Servidor RustDesk Relay HBBR:"
    Pop $Lbl6

    ${NSD_CreateText} 50% 90u 50% 12u "$DefaultIP:21117"
    Pop $TextRustDeskRelay

    ; RustDesk Key (optional)
    ${NSD_CreateLabel} 0 110u 100% 12u "Chave publica RustDesk HBBS (opcional):"
    Pop $Lbl7

    ${NSD_CreateText} 0 125u 100% 12u ""
    Pop $TextRustDeskKey

    ${NSD_CreateCheckbox} 0 150u 100% 12u "Abrir regras do Firewall para monitoramento IronGrid (recomendado)"
    Pop $CheckOpenFirewall
    ${NSD_Check} $CheckOpenFirewall

    ${NSD_CreateCheckbox} 0 170u 100% 12u "Desabilitar Firewall do Windows durante monitoramento (nao recomendado)"
    Pop $CheckDisableFirewall
    
    nsDialogs::Show
FunctionEnd

Function ServerPageLeave
    ; Retreive texts from inputs
    ${NSD_GetText} $ComboProtocol $SelectedProtocol
    ${NSD_GetText} $TextIP $InputIP
    ${NSD_GetText} $TextPort $InputPort
    ${NSD_GetText} $TextCommunity $InputCommunity
    ${NSD_GetText} $TextRustDeskIP $InputRustDeskIP
    ${NSD_GetText} $TextRustDeskRelay $InputRustDeskRelay
    ${NSD_GetText} $TextRustDeskKey $InputRustDeskKey
    ${NSD_GetState} $CheckRustDesk $InputUseRustDesk
    ${NSD_GetState} $CheckOpenFirewall $InputOpenFirewall
    ${NSD_GetState} $CheckDisableFirewall $InputDisableFirewall

    ; Verificação anti-vazio para IP
    ${If} $InputIP == ""
        MessageBox MB_ICONSTOP|MB_OK "O campo Servidor IronGrid (IP) eh obrigatorio! Nao pode estar vazio."
        Abort
    ${EndIf}

    ${If} $InputCommunity == ""
        MessageBox MB_ICONSTOP|MB_OK "O campo Comunidade SNMP eh obrigatorio."
        Abort
    ${EndIf}

    ; Formatar URL Completa final
    StrCpy $ServerIP "$SelectedProtocol://$InputIP:$InputPort"
FunctionEnd

;--------------------------------
; Sections

Section "IronGrid Agent (Files)" SecAgent
    SectionIn RO ; Read only, mandatory
    
    SetOutPath "$INSTDIR"
    StrCpy $LogFile "$INSTDIR\install.log"
    FileOpen $9 "$LogFile" w
    FileWrite $9 "IronGrid Agent Installer - inicio$\r$\n"
    FileClose $9
    
    ; Stop and delete existing service to ensure files are not locked
    DetailPrint "Cleaning up old processes and services..."
    FileOpen $9 "$LogFile" a
    FileWrite $9 "Limpando processos e servicos antigos...$\r$\n"
    FileClose $9
    ExecWait `reg delete "HKLM\Software\Microsoft\Windows\CurrentVersion\Run" /v "IronGridAgentUI" /f`
    ExecWait 'taskkill /F /IM agent-win.exe /T'
    ExecWait 'taskkill /F /IM IronGridAgent.exe /T'
    ExecWait 'taskkill /F /IM rustdesk.exe /T'
    ExecWait `sc stop IronGridAgent`
    ExecWait `sc delete IronGridAgent`
    Sleep 2000

    ; Main Agent Binary
    DetailPrint "Installing Agent Binaries..."
    FileOpen $9 "$LogFile" a
    FileWrite $9 "Copiando binarios do agente...$\r$\n"
    FileClose $9
    File "/oname=IronGridAgent.exe" "dist\bin\agent-win.exe"
    
    ; RustDesk Binary (Required for Remote Access)
    SetOutPath "$INSTDIR"
    File "/nonfatal" "/oname=rustdesk.exe" "..\server\public\agents\rustdesk.exe"

    ; Assets (Icons, etc)
    SetOutPath "$INSTDIR\assets"
    File "assets\IronGrid.ico"

    SetOutPath "$INSTDIR"

    ; Create config.json based on input
    DetailPrint "Configuring Agent..."
    FileOpen $9 "$LogFile" a
    FileWrite $9 "Configurando agente para servidor $ServerIP...$\r$\n"
    FileClose $9
    ReadEnvStr $1 COMPUTERNAME
    FileOpen $0 "$INSTDIR\config.json" w
    FileWrite $0 "{"
    FileWrite $0 "$\r$\n"
    FileWrite $0 "  $\"serverUrl$\": $\"$ServerIP$\","
    FileWrite $0 "$\r$\n"
    FileWrite $0 "  $\"agentId$\": $\"$1$\","
    FileWrite $0 "$\r$\n"
    FileWrite $0 "  $\"snmpCommunity$\": $\"$InputCommunity$\","
    FileWrite $0 "$\r$\n"
    FileWrite $0 "  $\"rustdeskHost$\": $\"$InputRustDeskIP$\","
    FileWrite $0 "$\r$\n"
    FileWrite $0 "  $\"rustdeskRelay$\": $\"$InputRustDeskRelay$\","
    FileWrite $0 "$\r$\n"
    FileWrite $0 "  $\"rustdeskKey$\": $\"$InputRustDeskKey$\""
    FileWrite $0 "$\r$\n"
    FileWrite $0 "}"
    FileClose $0

SectionEnd

Section "Instalar Agente (Serviço, Firewall, SNMP)" SecService
    DetailPrint "Configurando SNMP..."
    FileOpen $9 "$INSTDIR\install.log" a
    FileWrite $9 "Configurando SNMP com comunidade $InputCommunity...$\r$\n"
    FileClose $9
    ExecWait `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "try { Add-WindowsCapability -Online -Name SNMP.Client~~~~0.0.1.0 -ErrorAction SilentlyContinue } catch {}"`
    ExecWait `reg add "HKLM\SYSTEM\CurrentControlSet\Services\SNMP\Parameters\ValidCommunities" /v "$InputCommunity" /t REG_DWORD /d 4 /f`
    ExecWait `reg add "HKLM\SYSTEM\CurrentControlSet\Services\SNMP\Parameters\PermittedManagers" /v 1 /t REG_SZ /d "$InputIP" /f`
    ExecWait `sc config SNMP start= auto`
    ExecWait `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Restart-Service SNMP -Force -ErrorAction SilentlyContinue"`

    DetailPrint "Configurando Firewall..."
    FileOpen $9 "$INSTDIR\install.log" a
    FileWrite $9 "Configurando firewall...$\r$\n"
    FileClose $9
    ${If} $InputDisableFirewall == ${BST_CHECKED}
        ExecWait `netsh advfirewall set allprofiles state off`
    ${ElseIf} $InputOpenFirewall == ${BST_CHECKED}
        ExecWait `netsh advfirewall firewall add rule name="IronGrid Agent - App" dir=in action=allow program="$INSTDIR\IronGridAgent.exe" enable=yes profile=any`
        ExecWait `netsh advfirewall firewall add rule name="IronGrid Agent - SNMP" protocol=UDP dir=in localport=161 action=allow profile=any`
        ExecWait `netsh advfirewall firewall add rule name="IronGrid Agent - ICMP" protocol=icmpv4:8,any dir=in action=allow profile=any`
    ${EndIf}

    ${If} $InputUseRustDesk == ${BST_CHECKED}
        DetailPrint "Configurando RustDesk..."
        FileOpen $9 "$INSTDIR\install.log" a
        FileWrite $9 "Configurando RustDesk HBBS=$InputRustDeskIP Relay=$InputRustDeskRelay...$\r$\n"
        FileClose $9
        CreateDirectory "$APPDATA\RustDesk\config"
        FileOpen $0 "$APPDATA\RustDesk\config\RustDesk2.toml" w
        FileWrite $0 "rendezvous_server = '$InputRustDeskIP'$\r$\n"
        FileWrite $0 "relay_server = '$InputRustDeskRelay'$\r$\n"
        FileWrite $0 "key = '$InputRustDeskKey'$\r$\n"
        FileClose $0
        IfFileExists "$INSTDIR\rustdesk.exe" 0 rustdesk_missing
          FileOpen $9 "$INSTDIR\install.log" a
          FileWrite $9 "Instalando RustDesk em modo silencioso...$\r$\n"
          FileClose $9
          ExecWait `"$INSTDIR\rustdesk.exe" --silent-install` $2
          ${If} $2 != 0
            FileOpen $9 "$INSTDIR\install.log" a
            FileWrite $9 "RustDesk --silent-install retornou $2. Tentando --install...$\r$\n"
            FileClose $9
            ExecWait `"$INSTDIR\rustdesk.exe" --install` $2
          ${EndIf}
          FileOpen $9 "$INSTDIR\install.log" a
          FileWrite $9 "Retorno instalacao RustDesk: $2$\r$\n"
          FileClose $9
          Goto rustdesk_done
        rustdesk_missing:
          FileOpen $9 "$INSTDIR\install.log" a
          FileWrite $9 "RustDesk nao instalado: rustdesk.exe nao foi encontrado no pacote.$\r$\n"
          FileClose $9
        rustdesk_done:
    ${EndIf}

    DetailPrint "Instalando e iniciando servico IronGridAgent..."
    FileOpen $9 "$INSTDIR\install.log" a
    FileWrite $9 "Instalando servico IronGridAgent via agente...$\r$\n"
    FileClose $9
    ExecWait `"$INSTDIR\IronGridAgent.exe" --install --server="$ServerIP" --rustdesk="$InputRustDeskIP" --rustdesk-relay="$InputRustDeskRelay" --rustdesk-key="$InputRustDeskKey" --skip-snmp-prompt` $0
    FileOpen $9 "$INSTDIR\install.log" a
    FileWrite $9 "Retorno --install: $0$\r$\n"
    FileClose $9
    ExecWait `sc config IronGridAgent start= auto`
    ExecWait `sc start IronGridAgent` $1
    ExecWait `cmd.exe /C sc query IronGridAgent >> "$INSTDIR\install.log"`
    FileOpen $9 "$INSTDIR\install.log" a
    FileWrite $9 "Retorno sc start: $1$\r$\n"
    FileWrite $9 "Se o servico estiver RUNNING, as metricas CPU/RAM passam a chegar em ate 60 segundos.$\r$\n"
    FileClose $9
    
    ; O agente roda como servico. Nao criar atalho para evitar abertura de janela console.
    ExecShell "open" "$INSTDIR\install.log"
SectionEnd

; Descriptions
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecAgent} "Arquivos principais do Agente."
  !insertmacro MUI_DESCRIPTION_TEXT ${SecService} "Configura os Servicos do Agente (SNMP, Firewall, Telemetria)."
!insertmacro MUI_FUNCTION_DESCRIPTION_END
