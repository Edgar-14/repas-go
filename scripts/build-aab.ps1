# Script para generar el AAB (Android App Bundle) para Google Play Store
# Este es el formato requerido por Google Play Store

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Generando AAB para Play Store" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
} else {
    explorer.exe (Split-Path -Parent $aabPath)
Write-Host "[1/3] Limpiando builds anteriores..." -ForegroundColor Yellow
Set-Location "$projectRoot\android"
.\gradlew clean

Write-Host ""
Write-Host "[2/3] Generando el Android App Bundle (AAB)..." -ForegroundColor Yellow
.\gradlew bundleRelease

Write-Host ""
Write-Host "[3/3] Verificando el archivo generado..." -ForegroundColor Yellow
    Write-Host "Archivo: $aabPath" -ForegroundColor White
$aabPath = "$projectRoot\android\app\build\outputs\bundle\release\app-release.aab"

if (Test-Path $aabPath) {
    $fileSize = (Get-Item $aabPath).Length / 1MB
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "  AAB GENERADO EXITOSAMENTE" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
if (Test-Path $aabPath) {
$aabPath = "$projectRoot\android\app\build\outputs\bundle\release\app-release.aab"
    Write-Host "Tamano: $([math]::Round($fileSize, 2)) MB" -ForegroundColor White
.\gradlew bundleRelease
    Write-Host "SIGUIENTE PASO:" -ForegroundColor Cyan
    Write-Host "1. Ve a https://play.google.com/console" -ForegroundColor White
    Write-Host "2. Selecciona tu app o crea una nueva" -ForegroundColor White
    Write-Host "3. Ve a 'Pruebas internas' o 'Produccion'" -ForegroundColor White
    Write-Host "4. Crea una nueva version y sube el archivo AAB" -ForegroundColor White
    Write-Host "1. Ve a https://play.google.com/console" -ForegroundColor White

    # Abrir la carpeta donde esta el AAB
    explorer.exe (Split-Path -Parent $aabPath)
} else {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Red
    Write-Host "  ERROR: No se pudo generar el AAB" -ForegroundColor Red
    Write-Host "=====================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Revisa los logs arriba para ver el error" -ForegroundColor Yellow
}

Write-Host "[3/3] Verificando el archivo generado..." -ForegroundColor Yellow
Write-Host "[1/3] Limpiando builds anteriores..." -ForegroundColor Yellow
