@echo off
cd /d "%~dp0"
if not exist node_modules (
  call npm install
  call npx playwright install chromium
)
start "" http://localhost:8080
node server.js
pause
