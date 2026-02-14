#!/usr/bin/env bash
# Run Spring Boot backend with local profile (from repo root or any dir).
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Load select env vars from .env (skip deployment-only vars like JWT_SECRET / EC2_* which
# have different local defaults and would break existing JWT tokens).
if [ -f "$SCRIPT_DIR/.env" ]; then
  while IFS='=' read -r key value || [[ -n "$key" ]]; do
    [[ -z "$key" || "$key" == \#* ]] && continue
    case "$key" in
      GIPHY_*|PIXABAY_*|UNSPLASH_*|TWILIO_*|MAIL_*|CORS_*|UPLOAD_DIR) export "$key=$value" ;;
    esac
  done < "$SCRIPT_DIR/.env"
fi

cd "$SCRIPT_DIR/backend" && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local
