#!/usr/bin/env bash
# Stop the current Listy backend (Spring Boot) and start it again via run-backend.sh.
# Use this whenever a backend restart is required (e.g. after DB migrations or config changes).
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
PORT=8080

# Stop: free port 8080 (Java process holds it; mvnw is parent) and kill Maven wrapper
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
pkill -f "mvnw.*spring-boot:run" 2>/dev/null || true

# Wait for port to be free (SIGTERM can take a moment); then force-kill if still in use
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
  echo "Warning: port $PORT still in use. Backend may fail to start."
fi

# Start: run backend in foreground so logs appear in the terminal
./run-backend.sh
