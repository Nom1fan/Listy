#!/usr/bin/env bash
# Print your Mac's LAN IP and the URL + CORS export for opening the app on your phone.
set -e
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "???")
echo "Open on your phone (same WiFi):  http://${IP}:5173"
echo ""
echo "Before starting the backend, run:"
echo "  export CORS_ORIGINS=\"http://localhost:5173,http://localhost:3000,http://${IP}:5173\""
echo ""
