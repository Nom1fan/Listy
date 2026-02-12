#!/usr/bin/env bash
# Full release: bump minor version, export DB, build Windows package, zip.
# Optionally build and push Docker image if LISTY_IMAGE is set (in release.config or env). Run from repo root.
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ZIP="$REPO_ROOT/listy-windows.zip"
VERSION_FILE="$REPO_ROOT/VERSION"

# Load image name once from config (copy release.config.example to release.config)
if [ -f "$REPO_ROOT/release.config" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$REPO_ROOT/release.config"
  set +a
fi

# Bump minor version (e.g. 0.0.1 -> 0.1.0, 0.1.0 -> 0.2.0)
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

echo "=== 1. Export DB ==="
if "$SCRIPT_DIR/export-db.sh"; then
  echo "DB exported to db/listy-db.sql"
else
  echo "DB export failed (is PostgreSQL running with a listy DB?). Package will have empty DB on first run."
fi

echo ""
echo "=== 2. Build Windows package ==="
"$SCRIPT_DIR/package-for-windows.sh"

echo ""
echo "=== 3. Zip ==="
cd "$REPO_ROOT"
rm -f "$ZIP"
zip -r "$ZIP" listy-windows -x "*.DS_Store"
echo "Created $ZIP"

if [ -n "${LISTY_IMAGE:-}" ]; then
  echo ""
  echo "=== 4. Build and push Docker image ==="
  # LISTY_IMAGE is the repo without tag (e.g. ghcr.io/yourorg/listy); we tag with new_version
  IMAGE_TAG="${LISTY_IMAGE}:${new_version}"
  echo "Building $IMAGE_TAG ..."
  docker build -t "$IMAGE_TAG" .
  docker push "$IMAGE_TAG"
  echo "Pushed $IMAGE_TAG"
fi

echo ""
echo "Release $new_version ready. Copy listy-windows.zip to your Windows PC, unzip, then run run.bat (after installing Docker Desktop)."
if [ -n "${LISTY_IMAGE:-}" ]; then
  echo "Docker image pushed. On EC2 use LISTY_IMAGE=${IMAGE_TAG} with docker-compose.prod.yml."
fi
