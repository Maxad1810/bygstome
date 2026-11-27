@echo off
cd /d "%~dp0"
node uppdatera.js
if not exist node_modules (
  call npm install
  call npx playwright install chromium
)
node server.js
pause
