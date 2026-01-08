@echo off
cd /d "%~dp0"

echo.
echo ========================================
echo   CV REF - Demarrage
echo ========================================
echo.

REM Lancer le backend dans une nouvelle fenetre
echo [1/2] Backend...
start "Backend-4000" cmd /k "cd /d %~dp0server && node server.js"

REM Attendre 3 secondes
ping 127.0.0.1 -n 4 > nul

REM Lancer le frontend dans une nouvelle fenetre
echo [2/2] Frontend...
start "Frontend-8080" cmd /k "cd /d %~dp0 && npm run dev"

REM Attendre que le frontend demarre
ping 127.0.0.1 -n 6 > nul

REM Ouvrir le navigateur
echo.
echo Ouverture du navigateur...
start http://localhost:8080

echo.
echo ========================================
echo   Backend:  http://localhost:4000
echo   Frontend: http://localhost:8080
echo ========================================
echo.