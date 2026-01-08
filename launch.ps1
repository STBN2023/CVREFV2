$ErrorActionPreference = "Stop"
$proj = Split-Path -Parent $MyInvocation.MyCommand.Path
$server = Join-Path $proj "server"

# backend hidden
$backend = Start-Process -FilePath "npm" -ArgumentList "run","start" -WorkingDirectory $server -WindowStyle Hidden -PassThru
# frontend hidden
$frontend = Start-Process -FilePath "npm" -ArgumentList "run","dev" -WorkingDirectory $proj -WindowStyle Hidden -PassThru

# attendre que :8080 réponde puis ouvrir le navigateur
for ($i=0; $i -lt 60 -and -not (Test-NetConnection -ComputerName "localhost" -Port 8080 -InformationLevel Quiet); $i++) { Start-Sleep -Seconds 1 }
Start-Process "http://localhost:8080/"

# quand le front se termine, tuer le backend
Wait-Process -Id $frontend.Id
if (-not $backend.HasExited) { Stop-Process -Id $backend.Id -Force }
