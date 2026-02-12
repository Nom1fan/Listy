#!/usr/bin/env bash
# Stop the current Vite dev server and start it again via run-frontend.sh.
# Use this whenever a frontend restart is required (e.g. after vite.config or env changes).
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
# Vite default port (change here if you set server.port in vite.config.ts)
PORT=5173

# Stop: free the Vite port (Node process holds it)
stop_pids_on_port() {
  if ! command -v lsof >/dev/null 2>&1; then return; fi
  local pids
  pids=$(lsof -ti:$PORT 2>/dev/null || true)
  if [ -z "$pids" ]; then return; fi
  for pid in $pids; do
    kill "$pid" 2>/dev/null || true
  done
}

stop_pids_on_port
pkill -f "vite" 2>/dev/null || true

# Wait for port to be free; then force-kill if still in use
for i in 1 2 3 4 5 6 7 8 9 10; do
  if ! command -v lsof >/dev/null 2>&1; then break; fi
  if [ -z "$(lsof -ti:$PORT 2>/dev/null || true)" ]; then
    break
  fi
  if [ "$i" -eq 6 ]; then
    echo "Port $PORT still in use; sending SIGKILL."
    for pid in $(lsof -ti:$PORT 2>/dev/null); do
      kill -9 "$pid" 2>/dev/null || true
    done
  fi
  sleep 1
done

if command -v lsof >/dev/null 2>&1 && [ -n "$(lsof -ti:$PORT 2>/dev/null || true)" ]; then
  echo "Warning: port $PORT still in use. Frontend may fail to start."
fi

# Start: run frontend in foreground so logs appear in the terminal
./run-frontend.sh
