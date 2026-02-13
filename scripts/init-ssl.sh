#!/usr/bin/env bash
# First-time SSL certificate setup for listyyy.com on EC2.
#
# Run this ONCE after the first deploy to obtain the initial Let's Encrypt
# certificate.  After that, the certbot container auto-renews.
#
# Prerequisites:
#   - DNS A record for listyyy.com pointing to this server's public IP
#   - Ports 80 and 443 open in the EC2 security group
#   - docker-compose.yml and nginx/ already deployed (deploy.sh does this)
#
# Usage (on EC2):
#   cd ~/listy   # or wherever the deploy dir is
#   ./init-ssl.sh [email]
#
# The email is used by Let's Encrypt for renewal notices (optional but recommended).
set -e

DOMAIN="web.listyyy.com"
EMAIL="${1:-}"
DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "========================================================"
echo "  SSL Setup for $DOMAIN"
echo "========================================================"
echo ""

# ── 1. Create a temporary self-signed cert so Nginx can start ──
echo "[1/4] Creating temporary self-signed certificate ..."
CERT_DIR="$DEPLOY_DIR/certbot-bootstrap"
mkdir -p "$CERT_DIR/live/$DOMAIN"

openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout "$CERT_DIR/live/$DOMAIN/privkey.pem" \
  -out "$CERT_DIR/live/$DOMAIN/fullchain.pem" \
  -subj "/CN=$DOMAIN" 2>/dev/null

echo "   Done."

# ── 2. Start Nginx with the dummy cert ──────────────────────────
echo "[2/4] Starting Nginx with temporary certificate ..."

# Mount the dummy certs into the certbot-certs volume
docker compose down --remove-orphans 2>/dev/null || true

# Create certbot-certs volume and seed it with the dummy cert
docker volume create "${COMPOSE_PROJECT_NAME:-listy}_certbot-certs" 2>/dev/null || true
docker run --rm \
  -v "${COMPOSE_PROJECT_NAME:-listy}_certbot-certs:/etc/letsencrypt" \
  -v "$CERT_DIR:/tmp/certs:ro" \
  alpine sh -c "mkdir -p /etc/letsencrypt/live/$DOMAIN && cp /tmp/certs/live/$DOMAIN/*.pem /etc/letsencrypt/live/$DOMAIN/"

# Start only nginx (not certbot yet — it would try to renew the dummy cert)
docker compose up -d nginx app db
echo "   Waiting for Nginx to be ready ..."
sleep 5

# ── 3. Obtain real certificate from Let's Encrypt ──────────────
echo "[3/4] Requesting Let's Encrypt certificate ..."

# Remove the dummy cert so certbot can create its own
docker run --rm \
  -v "${COMPOSE_PROJECT_NAME:-listy}_certbot-certs:/etc/letsencrypt" \
  alpine sh -c "rm -rf /etc/letsencrypt/live/$DOMAIN /etc/letsencrypt/renewal/$DOMAIN.conf /etc/letsencrypt/archive/$DOMAIN"

EMAIL_FLAG=""
if [ -n "$EMAIL" ]; then
  EMAIL_FLAG="--email $EMAIL"
else
  EMAIL_FLAG="--register-unsafely-without-email"
fi

docker compose run --rm --entrypoint certbot certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$DOMAIN" \
  $EMAIL_FLAG \
  --agree-tos \
  --no-eff-email

echo "   Certificate obtained!"

# ── 4. Reload Nginx with the real cert ─────────────────────────
echo "[4/4] Reloading Nginx and starting certbot auto-renewal ..."
docker compose up -d --force-recreate

# Clean up temporary certs
rm -rf "$CERT_DIR"

echo ""
echo "========================================================"
echo "  SSL setup complete!"
echo "  https://$DOMAIN is now live."
echo "  Certificates will auto-renew via the certbot container."
echo "========================================================"
