#!/usr/bin/env bash
# Fetch production app logs from EC2. Uses same .env as deploy.sh.
#
# Usage:
#   ./scripts/fetch-prod-logs.sh [--tail N]
#
# Required in .env: EC2_PEM, EC2_HOST (optional: EC2_USER, EC2_DEPLOY_DIR)
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

TAIL=500
[[ "${1:-}" == "--tail" && -n "${2:-}" ]] && { TAIL="$2"; shift 2; }

if [ -f "$REPO_ROOT/.env" ]; then
  set -a; source "$REPO_ROOT/.env"; set +a
fi

: "${EC2_PEM:?EC2_PEM is required (set in .env)}"
: "${EC2_HOST:?EC2_HOST is required (set in .env)}"

EC2_USER="${EC2_USER:-ubuntu}"
EC2_DEPLOY_DIR="${EC2_DEPLOY_DIR:-/home/${EC2_USER}/listyyy}"

if [[ "$EC2_PEM" != /* ]]; then
  EC2_PEM="$REPO_ROOT/$EC2_PEM"
fi

if [ ! -f "$EC2_PEM" ]; then
  echo "ERROR: PEM file not found at $EC2_PEM"
  exit 1
fi

REMOTE="${EC2_USER}@${EC2_HOST}"
ssh -i "$EC2_PEM" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$REMOTE" \
  "cd $EC2_DEPLOY_DIR && docker compose logs --tail=$TAIL app"
