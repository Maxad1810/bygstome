@echo off
cd /d "%~dp0"
node uppdatera.js
if not exist node_modules (
  call npm install
  call npx playwright install chromium
)
where cloudflared >nul 2>nul
if errorlevel 1 (
  echo.
  echo Cloudflare-tunneln saknas. Installera den en gang:
  echo   winget install Cloudflare.cloudflared
  echo Oppna sedan ett nytt fonster och kor start-publik.bat igen.
  pause
  exit /b
)
set PUBLIC=1
set NO_OPEN=1
set PORT=8080
start "Stomkalkyl-server" cmd /k node server.js
timeout /t 3 >nul
echo.
echo Leta efter adressen som slutar pa trycloudflare.com nedan. Den ar din publika adress.
echo.
cloudflared tunnel --url http://localhost:8080
pause
