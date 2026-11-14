@echo off
cd /d "%~dp0"
if not exist doman.txt (
  echo Kor setup-doman.bat forst.
  pause
  exit /b
)
set /p H=<doman.txt
if not exist node_modules (
  call npm install
  call npx playwright install chromium
)
set PUBLIC=1
set NO_OPEN=1
set PORT=8080
start "Stomkalkyl-server" cmd /k node server.js
timeout /t 3 >nul
echo.
echo Appen finns pa  https://%H%   (det kan ta nagon minut forsta gangen)
echo Lamna bada fonstren oppna. Stang dem for att stanga appen.
echo.
cloudflared tunnel run --url http://localhost:8080 stomkalkyl
pause
