@echo off
chcp 65001 > nul

echo.
echo ========================================
echo   Demarrage de l'application CV REF
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] Demarrage du backend...
start "" cmd /k "cd /d %~dp0server && node server.js"

timeout /t 2 /nobreak > nul

echo [2/2] Demarrage du frontend...
start "" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:8080
echo.
exit