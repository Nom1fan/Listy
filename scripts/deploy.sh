#!/usr/bin/env bash
# Deploy Listyyy to EC2: copy compose file, update remote .env, pull image, restart.
# Can be run standalone or called automatically from release.sh.
#
# Usage:
#   ./scripts/deploy.sh [options]
#
# Options:
#   --db                SCP the DB dump to EC2 and import it
#   --version VERSION   Deploy a specific version (default: read from VERSION file)
#
# Required in .env (at repo root):
#   EC2_PEM    Path to your SSH .pem key
#   EC2_HOST   EC2 public hostname or IP
#
# Optional in .env:
#   EC2_USER        SSH user (default: ubuntu)
#   EC2_DEPLOY_DIR  Remote dir, full path (default: /home/$EC2_USER/listyyy)
#   JWT_SECRET      Propagated to EC2 on first deploy
#
# LISTYYY_IMAGE must be set in release.config (e.g. mmerhav/listyyy).
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Parse flags ──────────────────────────────────────────────
DEPLOY_DB=false
VERSION=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --db)      DEPLOY_DB=true; shift ;;
    --version) VERSION="$2"; shift 2 ;;
    *)         echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ── Load config ──────────────────────────────────────────────
if [ -f "$REPO_ROOT/.env" ]; then
  set -a; source "$REPO_ROOT/.env"; set +a
fi
if [ -f "$REPO_ROOT/release.config" ]; then
  set -a; source "$REPO_ROOT/release.config"; set +a
fi

# ── Interactive setup (prompts on first run, saves for next time) ──
append_env() { # append key=value to .env
  if [ -f "$REPO_ROOT/.env" ]; then
    echo "$1=$2" >> "$REPO_ROOT/.env"
  else
    echo "$1=$2" > "$REPO_ROOT/.env"
  fi
}

if [ -z "${LISTYYY_IMAGE:-}" ]; then
  echo "LISTYYY_IMAGE not configured."
  read -rp "  Docker image name (e.g. your-username/listyyy): " LISTYYY_IMAGE
  if [ -n "$LISTYYY_IMAGE" ]; then
    echo "LISTYYY_IMAGE=$LISTYYY_IMAGE" > "$REPO_ROOT/release.config"
    echo "  Saved to release.config"
  fi
fi

if [ -z "${EC2_PEM:-}" ]; then
  read -rp "EC2_PEM not set. Path to your .pem key file: " EC2_PEM
  [ -n "$EC2_PEM" ] && append_env "EC2_PEM" "$EC2_PEM" && echo "  Saved to .env"
fi

if [ -z "${EC2_HOST:-}" ]; then
  read -rp "EC2_HOST not set. EC2 public hostname or IP: " EC2_HOST
  [ -n "$EC2_HOST" ] && append_env "EC2_HOST" "$EC2_HOST" && echo "  Saved to .env"
fi

if [ -z "${JWT_SECRET:-}" ]; then
  JWT_SECRET=$(openssl rand -base64 32)
  append_env "JWT_SECRET" "$JWT_SECRET"
  echo "  Generated JWT_SECRET and saved to .env"
fi

# ── Validate ─────────────────────────────────────────────────
: "${EC2_PEM:?EC2_PEM is required}"
: "${EC2_HOST:?EC2_HOST is required}"
: "${LISTYYY_IMAGE:?LISTYYY_IMAGE is required}"

EC2_USER="${EC2_USER:-ubuntu}"
EC2_DEPLOY_DIR="${EC2_DEPLOY_DIR:-/home/${EC2_USER}/listyyy}"
VERSION="${VERSION:-$(cat "$REPO_ROOT/VERSION")}"
IMAGE_TAG="${LISTYYY_IMAGE}:${VERSION}"
JWT="${JWT_SECRET}"

# Resolve to absolute path (handles relative paths like key.pem)
if [[ "$EC2_PEM" != /* ]]; then
  EC2_PEM="$REPO_ROOT/$EC2_PEM"
fi

if [ ! -f "$EC2_PEM" ]; then
  echo "ERROR: PEM file not found at $EC2_PEM"
  exit 1
fi

SSH_OPTS="-i $EC2_PEM -o StrictHostKeyChecking=no -o ConnectTimeout=10"
REMOTE="${EC2_USER}@${EC2_HOST}"

echo ""
echo "========================================================"
echo "  Deploying Listyyy $VERSION to $EC2_HOST"
echo "  Image: $IMAGE_TAG"
echo "========================================================"
echo ""

# ── 1. Prepare remote directory ──────────────────────────────
echo "[1/5] Preparing remote directory ($EC2_DEPLOY_DIR) ..."
ssh $SSH_OPTS "$REMOTE" "mkdir -p $EC2_DEPLOY_DIR"

# ── 2. Copy docker-compose + nginx config ───────────────────
echo "[2/5] Copying docker-compose.prod.yml, nginx config, and init-ssl.sh ..."
scp $SSH_OPTS "$REPO_ROOT/docker-compose.prod.yml" "$REMOTE:$EC2_DEPLOY_DIR/docker-compose.yml"
ssh $SSH_OPTS "$REMOTE" "mkdir -p $EC2_DEPLOY_DIR/nginx"
scp $SSH_OPTS "$REPO_ROOT/nginx/default.conf" "$REMOTE:$EC2_DEPLOY_DIR/nginx/default.conf"
scp $SSH_OPTS "$REPO_ROOT/scripts/init-ssl.sh" "$REMOTE:$EC2_DEPLOY_DIR/init-ssl.sh"
ssh $SSH_OPTS "$REMOTE" "chmod +x $EC2_DEPLOY_DIR/init-ssl.sh"

# ── 3. Copy DB dump if requested ────────────────────────────
if $DEPLOY_DB; then
  DB_DUMP="$REPO_ROOT/db/listyyy-db.sql"
  if [ -f "$DB_DUMP" ]; then
    echo "[3/5] Copying DB dump and import script ..."
    scp $SSH_OPTS "$DB_DUMP" "$REMOTE:$EC2_DEPLOY_DIR/listyyy-db.sql"
    scp $SSH_OPTS "$SCRIPT_DIR/import-db-ec2.sh" "$REMOTE:$EC2_DEPLOY_DIR/import-db-ec2.sh"
  else
    echo "[3/5] WARNING: --db requested but $DB_DUMP not found. Run export-db.sh first."
    DEPLOY_DB=false
  fi
else
  echo "[3/5] Skipping DB sync (pass --db to include)"
fi

# ── 4. Update remote .env ───────────────────────────────────
echo "[4/5] Updating remote .env (LISTYYY_IMAGE=$IMAGE_TAG) ..."

# Helper: upsert a KEY=VALUE in the remote .env
upsert_remote_env() {
  local key="$1" value="$2"
  ssh $SSH_OPTS "$REMOTE" "cd $EC2_DEPLOY_DIR && \
    if grep -q '^${key}=' .env 2>/dev/null; then \
      sed -i 's|^${key}=.*|${key}=${value}|' .env; \
    else \
      echo '${key}=${value}' >> .env; \
    fi"
}

# Create .env if it doesn't exist (first deploy)
ssh $SSH_OPTS "$REMOTE" "cd $EC2_DEPLOY_DIR && \
  if [ ! -f .env ]; then \
    touch .env; \
    echo '  (created new .env)'; \
  fi"

upsert_remote_env "LISTYYY_IMAGE" "$IMAGE_TAG"
# JWT_SECRET: only set on first deploy (don't overwrite production secret)
ssh $SSH_OPTS "$REMOTE" "cd $EC2_DEPLOY_DIR && \
  if ! grep -q '^JWT_SECRET=' .env 2>/dev/null; then \
    echo 'JWT_SECRET=$JWT' >> .env; \
    echo '  (set JWT_SECRET)'; \
  fi"
upsert_remote_env "GIPHY_API_KEY" "${GIPHY_API_KEY:-}"
upsert_remote_env "PIXABAY_API_KEY" "${PIXABAY_API_KEY:-}"
upsert_remote_env "DB_PASSWORD" "${DB_PASSWORD:-postgres}"
upsert_remote_env "TWILIO_ACCOUNT_SID" "${TWILIO_ACCOUNT_SID:-}"
upsert_remote_env "TWILIO_AUTH_TOKEN" "${TWILIO_AUTH_TOKEN:-}"
upsert_remote_env "TWILIO_FROM_NUMBER" "${TWILIO_FROM_NUMBER:-}"
upsert_remote_env "MAIL_USERNAME" "${MAIL_USERNAME:-}"
upsert_remote_env "MAIL_PASSWORD" "${MAIL_PASSWORD:-}"

# ── 5. Pull and restart ─────────────────────────────────────
echo "[5/5] Pulling image and restarting services ..."
ssh $SSH_OPTS "$REMOTE" "cd $EC2_DEPLOY_DIR && docker compose pull && docker compose up -d"

# ── 6. Import DB if requested ───────────────────────────────
if $DEPLOY_DB; then
  echo ""
  echo "[+] Waiting for DB container to be ready ..."
  ssh $SSH_OPTS "$REMOTE" "cd $EC2_DEPLOY_DIR && \
    for i in \$(seq 1 30); do \
      if docker compose exec -T db pg_isready -U postgres &>/dev/null; then break; fi; \
      echo '  waiting ...'; sleep 2; \
    done"
  echo "[+] Importing DB dump on EC2 ..."
  ssh $SSH_OPTS "$REMOTE" "cd $EC2_DEPLOY_DIR && chmod +x import-db-ec2.sh && ./import-db-ec2.sh ./listyyy-db.sql"
fi

echo ""
echo "========================================================"
echo "  Deployment complete!"
echo "  Listyyy $VERSION is running at https://web.listyyy.com"
echo ""
echo "  If this is the FIRST deploy with SSL, run on EC2:"
echo "    cd $EC2_DEPLOY_DIR && ./init-ssl.sh your@email.com"
echo "========================================================"
