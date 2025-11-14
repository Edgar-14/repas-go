# Script para generar APK de release
# Este es util para pruebas externas o distribucion directa

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Generando APK de Release" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
Set-Location $projectRoot

Write-Host "[1/3] Limpiando builds anteriores..." -ForegroundColor Yellow
Set-Location "$projectRoot\android"
.\gradlew clean

Write-Host ""
Write-Host "[2/3] Generando el APK firmado..." -ForegroundColor Yellow
.\gradlew assembleRelease

Write-Host ""
Write-Host "[3/3] Verificando el archivo generado..." -ForegroundColor Yellow

$apkPath = "$projectRoot\android\app\build\outputs\apk\release\app-release.apk"

if (Test-Path $apkPath) {
    $fileSize = (Get-Item $apkPath).Length / 1MB
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "  APK GENERADO EXITOSAMENTE" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Archivo: $apkPath" -ForegroundColor White
    Write-Host "Tamano: $([math]::Round($fileSize, 2)) MB" -ForegroundColor White
    Write-Host ""
    Write-Host "Puedes instalar este APK directamente en dispositivos Android" -ForegroundColor Cyan
    Write-Host "o compartirlo para pruebas externas." -ForegroundColor Cyan
    Write-Host ""

    # Abrir la carpeta donde esta el APK
    explorer.exe (Split-Path -Parent $apkPath)
} else {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Red
    Write-Host "  ERROR: No se pudo generar el APK" -ForegroundColor Red
    Write-Host "=====================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Revisa los logs arriba para ver el error" -ForegroundColor Yellow
}

Set-Location $projectRoot

