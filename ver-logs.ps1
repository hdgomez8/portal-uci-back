# Script para ver los logs del servidor
# Uso: .\ver-logs.ps1

Write-Host "Verificando como esta corriendo el servidor..." -ForegroundColor Cyan

# Verificar si PM2 esta instalado y hay procesos corriendo
$pm2Installed = Get-Command pm2 -ErrorAction SilentlyContinue
if ($pm2Installed) {
    Write-Host "`nPM2 detectado. Verificando procesos..." -ForegroundColor Yellow
    pm2 list
    
    Write-Host "`nPara ver los logs en tiempo real, ejecuta:" -ForegroundColor Green
    Write-Host "   pm2 logs api" -ForegroundColor White
    Write-Host "   pm2 logs api --lines 100" -ForegroundColor White
    Write-Host "   pm2 logs api --err" -ForegroundColor White
} else {
    Write-Host "`nPM2 no esta instalado." -ForegroundColor Yellow
}

# Verificar si hay procesos de Node corriendo
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "`nProcesos de Node.js detectados:" -ForegroundColor Green
    $nodeProcesses | Format-Table Id, ProcessName, StartTime -AutoSize
    
    Write-Host "`nSi el servidor esta corriendo directamente con Node.js," -ForegroundColor Cyan
    Write-Host "los logs apareceran en la terminal donde se ejecuto." -ForegroundColor Cyan
} else {
    Write-Host "`nNo hay procesos de Node.js corriendo actualmente." -ForegroundColor Yellow
}

Write-Host "`nPara ejecutar el servidor en modo desarrollo y ver los logs:" -ForegroundColor Cyan
Write-Host "   cd back rrhh" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host "   (o npm start para produccion)" -ForegroundColor Gray

Write-Host "`nLos logs incluiran:" -ForegroundColor Cyan
Write-Host "   - Todas las peticiones HTTP (GET, POST, etc.)" -ForegroundColor Gray
Write-Host "   - Logs de descarga de archivos" -ForegroundColor Gray
Write-Host "   - Errores y advertencias" -ForegroundColor Gray
Write-Host "   - Informacion de generacion de PDFs" -ForegroundColor Gray

Write-Host "`nCuando intentes descargar un archivo, veras logs como:" -ForegroundColor Cyan
Write-Host "   Analisis del archivo:" -ForegroundColor Gray
Write-Host "   Ruta: ..." -ForegroundColor Gray
Write-Host "   Magic numbers: ..." -ForegroundColor Gray
Write-Host "   Es PDF: true/false" -ForegroundColor Gray
Write-Host "   Es XLSX: true/false" -ForegroundColor Gray
Write-Host "   Archivo final a enviar: ..." -ForegroundColor Gray
