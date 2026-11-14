@echo off
cd /d "%~dp0"
where cloudflared >nul 2>nul
if errorlevel 1 (
  echo Installera Cloudflare-tunneln forst:  winget install Cloudflare.cloudflared
  echo Oppna sedan ett nytt fonster och kor setup-doman.bat igen.
  pause
  exit /b
)
echo.
echo Domanen maste redan ligga hos Cloudflare (se README, avsnittet "Egen doman").
set /p H=Skriv din adress, till exempel stomkalkyl.se eller kalkyl.stomkalkyl.se: 
echo.
echo 1/3  Logga in hos Cloudflare - en webbsida oppnas, valj din doman och godkann.
cloudflared tunnel login
echo 2/3  Skapar tunnel...
cloudflared tunnel create stomkalkyl
echo 3/3  Kopplar %H% till tunneln...
cloudflared tunnel route dns stomkalkyl %H%
> doman.txt echo %H%
echo.
echo Klart. Kor start-doman.bat for att starta appen pa https://%H%
pause
