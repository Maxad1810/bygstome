@echo off
cd /d "%~dp0"
node uppdatera.js
if not exist node_modules (
  call npm install
  call npx playwright install chromium
)
where tailscale >nul 2>nul
if errorlevel 1 (
  echo.
  echo Tailscale saknas. Gor sa har en gang:
  echo   1. Installera fran https://tailscale.com/download och logga in.
  echo   2. Se README, avsnittet "Fast gratisadress".
  echo Kor sedan start-fast.bat igen.
  pause
  exit /b
)
set PUBLIC=1
set NO_OPEN=1
set PORT=8080
start "Stomkalkyl-server" cmd /k node server.js
timeout /t 3 >nul
tailscale funnel --bg 8080
echo.
echo Din fasta adress visas nedan (https://...ts.net). Den ar alltid densamma.
echo.
tailscale funnel status
echo.
echo Lamna Stomkalkyl-server-fonstret oppet. Stang det for att stanga appen.
pause
