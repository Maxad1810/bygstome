#!/bin/sh
cd "$(dirname "$0")"
node uppdatera.js
[ -d node_modules ] || { npm install && npx playwright install chromium; }
command -v tailscale >/dev/null || { echo "Installera Tailscale först (tailscale.com/download) och logga in. Se README."; exit 1; }
PUBLIC=1 NO_OPEN=1 PORT=8080 node server.js &
SRV=$!
sleep 2
tailscale funnel --bg 8080
echo; echo "Din fasta adress (https://...ts.net):"; tailscale funnel status
echo; echo "Tryck Ctrl+C för att stänga appen."
trap 'kill $SRV; tailscale funnel reset' INT TERM
wait $SRV
