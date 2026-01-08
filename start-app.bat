@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo.
echo ========================================
echo   CV REF - Demarrage
echo ========================================
echo.

:: Vérifier Node.js
node -v > nul 2>&1
if errorlevel 1 (
    echo ERREUR: Node.js n'est pas installe
    pause
    exit /b 1
)

:: Lancer le backend dans une nouvelle fenêtre
echo [1/2] Backend...
start "Backend-4000" cmd /k "cd /d "%~dp0server" && node server.js"

:: Attendre 3 secondes
ping 127.0.0.1 -n 4 > nul

:: Lancer le frontend dans une nouvelle fenêtre
echo [2/2] Frontend...
start "Frontend-8080" cmd /k "cd /d "%~dp0" && npm run dev"

:: Attendre que le frontend démarre
ping 127.0.0.1 -n 6 > nul

:: Ouvrir le navigateur
echo.
echo Ouverture du navigateur...
start http://localhost:8080

echo.
echo ========================================
echo   Backend:  http://localhost:4000
echo   Frontend: http://localhost:8080
echo ========================================
echo.