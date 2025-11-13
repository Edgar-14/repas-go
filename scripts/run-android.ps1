# Uso: ejecuta este script y él detecta si hay dispositivo físico o emulador, elige puerto libre para Metro,
# aplica 'adb reverse' al puerto correcto cuando hay dispositivo físico, y fuerza la instalación en el
# dispositivo/emulador disponible para evitar seriales obsoletos.

# Colores para la salida
function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "[ERROR] $msg" -ForegroundColor Red }

# Helpers
function Test-PortBusy($port) {
  try {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    return $null -ne $conn
  } catch {
    # Fallback con netstat si Get-NetTCPConnection no está disponible
    $net = netstat -ano | Select-String ":$port\s+.*LISTENING" -ErrorAction SilentlyContinue
    return $net -ne $null
  }
}

function Get-FreePort([int]$start = 8081) {
  $p = $start
  for ($i=0; $i -lt 20; $i++) {
    if (-not (Test-PortBusy $p)) { return $p }
    $p++
  }
  return $start
}

function Get-AndroidDevices() {
  $result = @{ Physical=@(); Emulators=@(); All=@() }
  try {
    $adbOut = (& adb devices) 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $adbOut) { return $result }
    $lines = $adbOut -split "`n" | Where-Object { $_ -match "\tdevice$" -and $_ -notmatch "List of devices" }
    foreach ($ln in $lines) {
      $serial = ($ln -split "\s+")[0]
      if (-not [string]::IsNullOrWhiteSpace($serial)) {
        $result.All += $serial
        if ($serial -match '^emulator-') { $result.Emulators += $serial } else { $result.Physical += $serial }
      }
    }
  } catch {}
  return $result
}

# Ir a la raíz del repo (el script está en scripts/)
Set-Location -Path (Resolve-Path "$PSScriptRoot\..")

# 0) Elegir puerto para Metro
$metroPort = Get-FreePort 8081
if ($metroPort -ne 8081) {
  Write-Warn "El puerto 8081 está en uso. Usaré el puerto $metroPort para Metro y adb reverse."
}

# 1) Detectar dispositivos disponibles (al inicio)
$devices = Get-AndroidDevices
$targetSerial = $null
if ($devices.Physical.Count -gt 0) {
  $targetSerial = $devices.Physical[0]
  Write-Info "Dispositivo físico detectado: $targetSerial"
} elseif ($devices.Emulators.Count -gt 0) {
  $targetSerial = $devices.Emulators[0]
  Write-Info "Emulador detectado: $targetSerial"
} else {
  Write-Warn "No se detectan dispositivos/emuladores por ahora. Continuaré y dejaré que la CLI intente lanzar en el primero disponible."
}

# 2) Iniciar Metro en una nueva ventana con el puerto elegido
Write-Info "Iniciando Metro bundler en puerto $metroPort..."
Start-Process powershell -ArgumentList "-NoExit","-Command","npx react-native start --port $metroPort" | Out-Null
Start-Sleep -Seconds 2

# 3) Si hay dispositivo físico, aplicar adb reverse al puerto elegido (revalida antes de aplicar)
$applyReverse = $false
if ($devices.Physical.Count -gt 0) { $applyReverse = $true }
if ($applyReverse) {
  # Revalidar que el serial sigue conectado
  $now = Get-AndroidDevices
  if ($now.Physical -notcontains $targetSerial) {
    if ($now.Physical.Count -gt 0) { $targetSerial = $now.Physical[0] } else { $applyReverse = $false }
  }
  if ($applyReverse) {
    Write-Info "Aplicando adb reverse tcp:$metroPort -> tcp:$metroPort para $targetSerial"
    try { & adb -s $targetSerial reverse tcp:$metroPort tcp:$metroPort | Out-Null }
    catch { Write-Warn "Fallo 'adb reverse'. Verifica permisos USB y que la pantalla esté desbloqueada." }
  }
}

# 4) Compilar e instalar
Write-Info "Compilando e instalando la app en Android..."
$npx = "npx"

# Construir argumentos para run-android
$runArgs = @('react-native','run-android','--port',"$metroPort")
if ($targetSerial) { $runArgs += @('--deviceId', "$targetSerial") }

try {
  & $npx @runArgs
} catch {
  Write-Err "Fallo al correr 'react-native run-android'. Revisa SDK/Emulador. Detalle: $($_.Exception.Message)"
  exit 1
}

Write-Info "Proceso finalizado. Si usas dispositivo físico, mantén la pantalla encendida y la app en primer plano para la primera carga."