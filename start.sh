#!/bin/sh
cd "$(dirname "$0")"
[ -d node_modules ] || { npm install && npx playwright install chromium; }
(sleep 2; (open http://localhost:8080 || xdg-open http://localhost:8080) >/dev/null 2>&1) &
node server.js
