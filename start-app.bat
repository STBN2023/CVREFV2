@echo off
setlocal enabledelayedexpansion

set FRONT_PORT=8080
set BACKEND_DIR=server

REM --- lancer backend ---
start "backend" /min cmd /c "cd %BACKEND_DIR% && npm run start"
for /f "tokens=2 delims==; " %%a in ('wmic process where "windowtitle='backend'" get processid /value ^| find "="') do set BACK_PID=%%a

REM --- lancer frontend ---
start "frontend" /min cmd /c "npm run dev"
for /f "tokens=2 delims==; " %%a in ('wmic process where "windowtitle='frontend'" get processid /value ^| find "="') do set FRONT_PID=%%a

REM --- attendre que le front écoute sur :8080 ---
set COUNT=0
:WAITLOOP
>nul 2>&1 (netstat -ano | findstr :%FRONT_PORT% | find "LISTENING")
if errorlevel 1 (
  if %COUNT% geq 30 (
    echo Timeout en attendant le port %FRONT_PORT%
    goto END
  )
  set /a COUNT+=1
  timeout /t 1 >nul
  goto WAITLOOP
)

REM --- ouvrir navigateur ---
start "" http://localhost:%FRONT_PORT%/

REM --- attendre fin du front ---
:WAITFRONT
tasklist /FI "PID eq %FRONT_PID%" | find "%FRONT_PID%" >nul
if not errorlevel 1 (
  timeout /t 2 >nul
  goto WAITFRONT
)

REM --- tuer backend quand le front s'arrête ---
taskkill /PID %BACK_PID% /F >nul 2>&1

:END
endlocal
exit /b
