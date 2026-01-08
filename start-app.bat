@echo off
echo ========================================
echo   Demarrage de l'application CV REF
echo ========================================
echo.

:: Démarrer le backend dans une nouvelle fenêtre
echo [1/2] Demarrage du serveur backend (port 4000)...
start "Backend CV REF" cmd /k "cd /d %~dp0server && npm start"

:: Attendre 2 secondes pour laisser le backend démarrer
timeout /t 2 /nobreak > nul

:: Démarrer le frontend dans une nouvelle fenêtre
echo [2/2] Demarrage du frontend (Vite)...
start "Frontend CV REF" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ========================================
echo   Les deux serveurs sont en cours de demarrage
echo   - Backend: http://localhost:4000
echo   - Frontend: http://localhost:5173
echo ========================================
echo.
echo Vous pouvez fermer cette fenetre.
pause