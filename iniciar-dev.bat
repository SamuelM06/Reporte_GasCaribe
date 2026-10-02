@echo off
REM Inicia el reporte en modo desarrollo (mismo link, F5 para ver cambios).
cd /d %~dp0
set PORT=4321
set HOST=127.0.0.1
echo Abre http://127.0.0.1:4321/ y recarga con F5 tras cada cambio.
npm run dev -- --host 127.0.0.1 --port 4321
