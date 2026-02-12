#!/usr/bin/env bash
# Run Vite dev server (from repo root or any dir).
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/frontend" && npm run dev
