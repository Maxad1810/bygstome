#!/bin/sh
cd "$(dirname "$0")"
node uppdatera.js
[ -f doman.txt ] || { echo "Kör ./setup-doman.sh först."; exit 1; }
[ -d node_modules ] || { npm install && npx playwright install chromium; }
PUBLIC=1 NO_OPEN=1 PORT=8080 node server.js &
SRV=$!; trap 'kill $SRV' INT TERM
echo "Appen finns på https://$(cat doman.txt)"
cloudflared tunnel run --url http://localhost:8080 stomkalkyl
