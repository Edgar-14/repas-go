# Uso: ejecuta este script y él detecta si hay dispositivo físico conectado.
# - Si hay dispositivo físico, aplica `adb reverse` para Metro (8081).
# - Si hay emulador o nada, ejecuta build normal.

# Colors for output
function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "[ERROR] $msg" -ForegroundColor Red }

# Move to repo root (script is in scripts/)
Set-Location -Path (Resolve-Path "$PSScriptRoot\..")

# 0) Detect device type using adb (if available)
$applyReverse = $false
try {
  $adbOutput = (& adb devices) 2>$null
  if ($LASTEXITCODE -eq 0 -and $adbOutput) {
    $deviceLines = $adbOutput -split "`n" | Where-Object { $_ -match "\tdevice$" -and $_ -notmatch "List of devices" }
    $serials = @()
    foreach ($line in $deviceLines) {
      $serial = ($line -split "\s+")[0]
      if ($serial) { $serials += $serial }
    }
    if ($serials.Count -gt 0) {
      $physical = $serials | Where-Object { $_ -notmatch "^emulator-" }
      if ($physical.Count -gt 0) {
        $applyReverse = $true
        Write-Info "Detectado(s) dispositivo(s) físico(s): $($physical -join ', ') -> aplicar 'adb reverse'."
      } else {
        Write-Info "Detectado emulador Android -> no se requiere 'adb reverse'."
      }
    } else {
      Write-Warn "No se detectan dispositivos/emuladores mediante 'adb devices'. Continuando de todas formas..."
    }
  } else {
    Write-Warn "'adb' no disponible o sin salida. Continuando sin detección."
  }
} catch {
  Write-Warn "No se pudo ejecutar 'adb'. Continuando sin detección."
}

# 1) Start Metro bundler in a new PowerShell window
Write-Info "Iniciando Metro bundler..."
Start-Process powershell -ArgumentList "-NoExit","-Command","npm run start" | Out-Null
Start-Sleep -Seconds 2

# 2) Apply adb reverse for physical device if needed
if ($applyReverse) {
  Write-Info "Aplicando adb reverse al puerto 8081 para dispositivo físico..."
  try {
    & adb reverse tcp:8081 tcp:8081 | Out-Null
  } catch {
    Write-Warn "No se pudo ejecutar 'adb reverse'. Asegúrate de tener Android Platform Tools en el PATH."
  }
}

# 3) Build & run the Android app
Write-Info "Compilando e instalando la app en Android..."
# Use npx to ensure local CLI is used
$npx = "npx"

try {
  & $npx react-native run-android
} catch {
  Write-Err "Fallo al correr 'react-native run-android'. Revisa que Android SDK/Emulador estén configurados."
  exit 1
}

Write-Info "Proceso finalizado. Si usas dispositivo físico, mantén la pantalla encendida y la app en primer plano para la primera carga."