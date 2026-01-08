@echo off
chcp 65001 > nul
title CV REF - Lanceur

echo.
echo ╔════════════════════════════════════════════╗
echo ║   Demarrage de l'application CV REF        ║
echo ╚════════════════════════════════════════════╝
echo.

:: Vérifier que Node.js est installé
where node > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installe ou pas dans le PATH
    pause
    exit /b 1
)

:: Obtenir le répertoire du script
set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

echo [INFO] Repertoire racine: %ROOT_DIR%
echo.

:: Vérifier que le dossier server existe
if not exist "%ROOT_DIR%server" (
    echo [ERREUR] Le dossier 'server' n'existe pas
    pause
    exit /b 1
)

:: Vérifier que node_modules existe pour le frontend
if not exist "%ROOT_DIR%node_modules" (
    echo [ATTENTION] node_modules manquant pour le frontend
    echo [INFO] Installation des dependances frontend...
    call npm install
)

:: Vérifier que node_modules existe pour le backend
if not exist "%ROOT_DIR%server\node_modules" (
    echo [ATTENTION] node_modules manquant pour le backend
    echo [INFO] Installation des dependances backend...
    cd /d "%ROOT_DIR%server"
    call npm install
    cd /d "%ROOT_DIR%"
)

echo.
echo [1/2] Demarrage du serveur backend (port 4000)...
start "CV REF - Backend (port 4000)" cmd /k "cd /d "%ROOT_DIR%server" && echo === BACKEND CV REF === && echo. && node server.js"

:: Attendre 3 secondes pour laisser le backend démarrer
echo [INFO] Attente du demarrage du backend...
timeout /t 3 /nobreak > nul

echo [2/2] Demarrage du frontend Vite (port 8080)...
start "CV REF - Frontend (port 8080)" cmd /k "cd /d "%ROOT_DIR%" && echo === FRONTEND CV REF === && echo. && npm run dev"

echo.
echo ╔════════════════════════════════════════════╗
echo ║   Les serveurs demarrent...                ║
echo ║                                            ║
echo ║   Backend:  http://localhost:4000          ║
echo ║   Frontend: http://localhost:8080          ║
echo ╚════════════════════════════════════════════╝
echo.
echo Appuyez sur une touche pour fermer cette fenetre...
pause > nul