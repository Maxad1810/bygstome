#!/bin/sh
cd "$(dirname "$0")"
[ -d node_modules ] || { npm install && npx playwright install chromium; }
node server.js
