#!/usr/bin/env bash
# Full release: bump version, export DB, optionally build Windows package,
# build/push Docker image, git commit + tag + push, deploy to EC2.
#
# Usage: ./scripts/release.sh [--db] [--skip-windows] [--skip-deploy]
#
# Flags:
#   --db              Include DB dump in EC2 deployment (SCP + import)
#   --skip-windows    Skip Windows package build (faster release)
#   --skip-deploy     Skip EC2 deployment (build and push only)
#
# Config:
#   release.config    LISTY_IMAGE (Docker Hub repo, e.g. mmerhav/listy)
#   .env              EC2_PEM, EC2_HOST (for deployment); JWT_SECRET
#
# Run from repo root.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ZIP="$REPO_ROOT/listy-windows.zip"
VERSION_FILE="$REPO_ROOT/VERSION"

# ── Parse flags ──────────────────────────────────────────────
DEPLOY_DB=false
SKIP_WINDOWS=false
SKIP_DEPLOY=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --db)            DEPLOY_DB=true; shift ;;
    --skip-windows)  SKIP_WINDOWS=true; shift ;;
    --skip-deploy)   SKIP_DEPLOY=true; shift ;;
    *)               echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Load image name from config (copy release.config.example to release.config)
if [ -f "$REPO_ROOT/release.config" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$REPO_ROOT/release.config"
  set +a
fi

# Load .env for deployment settings
if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$REPO_ROOT/.env"
  set +a
fi

# ── 0. Bump minor version ───────────────────────────────────
current=$(cat "$VERSION_FILE")
IFS=. read -r major minor patch <<EOF
$current
EOF
new_version="$major.$((minor + 1)).0"
echo "$new_version" > "$VERSION_FILE"
echo "=== 0. Bump version: $current -> $new_version ==="
# Update pom.xml (project version, not parent)
sed -i.bak "s|<version>${current}-SNAPSHOT</version>|<version>${new_version}-SNAPSHOT</version>|" "$REPO_ROOT/demo/pom.xml" && rm -f "$REPO_ROOT/demo/pom.xml.bak"
# Update package.json
node -e "
const p = require(\"$REPO_ROOT/frontend/package.json\");
p.version = \"$new_version\";
require('fs').writeFileSync(\"$REPO_ROOT/frontend/package.json\", JSON.stringify(p, null, 2) + '\n');
"
echo ""

# ── 1. Export DB ─────────────────────────────────────────────
echo "=== 1. Export DB ==="
if "$SCRIPT_DIR/export-db.sh"; then
  echo "DB exported to db/listy-db.sql"
else
  echo "DB export failed (is PostgreSQL running with a listy DB?). Continuing without DB dump."
fi
echo ""

# ── 2. Build Windows package ────────────────────────────────
if $SKIP_WINDOWS; then
  echo "=== 2. Build Windows package (SKIPPED) ==="
  echo ""
  echo "=== 3. Zip (SKIPPED) ==="
else
  echo "=== 2. Build Windows package ==="
  "$SCRIPT_DIR/package-for-windows.sh"

  echo ""
  echo "=== 3. Zip ==="
  cd "$REPO_ROOT"
  rm -f "$ZIP"
  zip -r "$ZIP" listy-windows -x "*.DS_Store"
  echo "Created $ZIP"
fi
echo ""

# ── 4. Build and push Docker image ──────────────────────────
if [ -n "${LISTY_IMAGE:-}" ]; then
  echo "=== 4. Build and push Docker image ==="
  IMAGE_TAG="${LISTY_IMAGE}:${new_version}"
  echo "Building $IMAGE_TAG ..."
  docker build -t "$IMAGE_TAG" "$REPO_ROOT"
  docker push "$IMAGE_TAG"
  echo "Pushed $IMAGE_TAG"
else
  echo "=== 4. Build and push Docker image (SKIPPED -- set LISTY_IMAGE in release.config) ==="
fi
echo ""

# ── 5. Git commit, tag, push ────────────────────────────────
echo "=== 5. Git commit and tag ==="
cd "$REPO_ROOT"
git add VERSION demo/pom.xml frontend/package.json
if [ -f db/listy-db.sql ]; then git add db/listy-db.sql; fi
git commit -m "Release $new_version"
git tag "v$new_version"
git push && git push --tags
echo "Committed and tagged v$new_version"
echo ""

# ── 6. Deploy to EC2 ────────────────────────────────────────
if ! $SKIP_DEPLOY && [ -n "${EC2_PEM:-}" ] && [ -n "${EC2_HOST:-}" ]; then
  echo "=== 6. Deploy to EC2 ==="
  DEPLOY_ARGS="--version $new_version"
  if $DEPLOY_DB; then DEPLOY_ARGS="$DEPLOY_ARGS --db"; fi
  "$SCRIPT_DIR/deploy.sh" $DEPLOY_ARGS
elif $SKIP_DEPLOY; then
  echo "=== 6. Deploy to EC2 (SKIPPED) ==="
else
  echo "=== 6. Deploy to EC2 (SKIPPED -- set EC2_PEM and EC2_HOST in .env) ==="
fi
echo ""

# ── Summary ──────────────────────────────────────────────────
echo "========================================================"
echo "  Release $new_version complete!"
if ! $SKIP_WINDOWS; then
  echo "  Windows:  listy-windows.zip ready"
fi
if [ -n "${LISTY_IMAGE:-}" ]; then
  echo "  Docker:   ${LISTY_IMAGE}:${new_version} pushed"
fi
if ! $SKIP_DEPLOY && [ -n "${EC2_PEM:-}" ] && [ -n "${EC2_HOST:-}" ]; then
  echo "  EC2:      deployed to $EC2_HOST"
fi
echo "========================================================"
