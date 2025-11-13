0# Fix Metro/ADB connectivity for React Native on Windows
# - Kills stale Metro/node processes using ports 8081-8090
# - Starts Metro on 8081 in a new PowerShell window
# - Applies adb reverse tcp:8081 tcp:8081 for all connected physical devices
# - Prints connected devices and guidance

function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "[ERROR] $msg" -ForegroundColor Red }

Set-Location -Path (Resolve-Path "$PSScriptRoot\..")

# Detect processes listening on a port
function Get-PidsOnPort([int]$port){
  try {
    $lines = netstat -ano | Select-String ":$port\s+.*LISTENING" -ErrorAction SilentlyContinue
    if (-not $lines) { return @() }
    $pids = @()
    foreach ($l in $lines){
      $parts = ($l.ToString() -split "\s+") | Where-Object { $_ -ne '' }
      $pid = $parts[-1]
      if ($pid -match '^[0-9]+$'){ $pids += [int]$pid }
    }
    return $pids | Select-Object -Unique
  } catch { return @() }
}

# Kill all node.exe or java processes holding those ports
$ports = 8081..8090
$pidsToKill = @()
foreach ($p in $ports){ $pidsToKill += Get-PidsOnPort $p }
$pidsToKill = $pidsToKill | Select-Object -Unique
if ($pidsToKill.Count -gt 0){
  Write-Warn "Encontré procesos usando puertos de Metro ($($ports[0])-$($ports[-1])): $($pidsToKill -join ', ') -> los cerraré."
  foreach($pid in $pidsToKill){
    try { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } catch {}
  }
} else {
  Write-Info "No hay procesos ocupando puertos de Metro."
}

# Start Metro on 8081
Write-Info "Iniciando Metro en puerto 8081..."
Start-Process powershell -ArgumentList "-NoExit","-Command","npx react-native start --port 8081" | Out-Null
Start-Sleep -Seconds 2

# Apply adb reverse for all physical devices
try { $adbOut = (& adb devices) 2>$null } catch { $adbOut = $null }
if (-not $adbOut){
  Write-Warn "ADB no respondió. Asegúrate de tener Android SDK en PATH."
} else {
  $lines = $adbOut -split "`n" | Where-Object { $_ -match "\tdevice$" -and $_ -notmatch "List of devices" }
  if (-not $lines -or $lines.Count -eq 0){
    Write-Warn "No hay dispositivos conectados por ADB. Si usas emulador, ábrelo desde Android Studio."
  } else {
    foreach($ln in $lines){
      $serial = ($ln -split "\s+")[0]
      if ($serial -and ($serial -notmatch '^emulator-')){
        Write-Info "Aplicando adb reverse a $serial en puerto 8081"
        try { & adb -s $serial reverse tcp:8081 tcp:8081 | Out-Null } catch { Write-Warn "No pude aplicar reverse a $serial" }
      }
    }
  }
}

Write-Info "Listo. Ahora ejecuta: npx react-native run-android --port 8081 (o npm run android:oneclick)"