#!/bin/sh
cd "$(dirname "$0")"
command -v cloudflared >/dev/null || { echo "Installera cloudflared först (brew install cloudflared)."; exit 1; }
printf "Skriv din adress, till exempel stomkalkyl.se: "; read H
cloudflared tunnel login && cloudflared tunnel create stomkalkyl && cloudflared tunnel route dns stomkalkyl "$H" && echo "$H" > doman.txt && echo "Klart. Kör ./start-doman.sh"
