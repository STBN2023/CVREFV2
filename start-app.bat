@echo off
setlocal enabledelayedexpansion

set FRONT_PORT=8080
set BACK_PORT=4000
set BACKEND_DIR=server

echo.
echo ========================================
echo   Demarrage de l'application CV REF
echo ========================================
echo.

REM --- Aller dans le repertoire du script ---
cd /d "%~dp0"

REM --- Verifier que le dossier server existe ---
if not exist "%BACKEND_DIR%" (
    echo [ERREUR] Le dossier '%BACKEND_DIR%' n'existe pas
    pause
    exit /b 1
)

REM --- Lancer backend ---
echo [1/2] Demarrage du backend sur le port %BACK_PORT%...
start "CV-REF-Backend" /min cmd /c "cd /d %~dp0%BACKEND_DIR% && node server.js"

REM --- Petite pause pour laisser le backend demarrer ---
timeout /t 2 /nobreak >nul

REM --- Lancer frontend ---
echo [2/2] Demarrage du frontend sur le port %FRONT_PORT%...
start "CV-REF-Frontend" cmd /c "cd /d %~dp0 && npm run dev"

REM --- Attendre que le front ecoute sur le port ---
echo [INFO] Attente du demarrage du frontend...
set COUNT=0
:WAITLOOP
>nul 2>&1 (netstat -ano | findstr ":%FRONT_PORT%" | findstr "LISTENING")
if errorlevel 1 (
    if %COUNT% geq 60 (
        echo [ERREUR] Timeout en attendant le port %FRONT_PORT%
        goto OPENBROWSER
    )
    set /a COUNT+=1
    timeout /t 1 /nobreak >nul
    goto WAITLOOP
)

:OPENBROWSER
REM --- Ouvrir navigateur ---
echo [INFO] Ouverture du navigateur...
timeout /t 1 /nobreak >nul
start "" "http://localhost:%FRONT_PORT%/"

echo.
echo ========================================
echo   Application demarree !
echo   Backend:  http://localhost:%BACK_PORT%
echo   Frontend: http://localhost:%FRONT_PORT%
echo ========================================
echo.
echo Fermez les fenetres de terminal pour arreter l'application.

endlocal
exit /b