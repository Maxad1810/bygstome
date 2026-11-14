#!/bin/sh
cd "$(dirname "$0")"
[ -d node_modules ] || { npm install && npx playwright install chromium; }
command -v cloudflared >/dev/null || { echo "Installera cloudflared först (brew install cloudflared eller se developers.cloudflare.com)."; exit 1; }
PUBLIC=1 NO_OPEN=1 PORT=8080 node server.js &
sleep 2
echo "Leta efter adressen som slutar på trycloudflare.com nedan:"
cloudflared tunnel --url http://localhost:8080
kill %1
