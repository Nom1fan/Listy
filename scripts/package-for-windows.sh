#!/usr/bin/env bash
# Build a self-contained folder for Windows: backend + frontend + PostgreSQL in Docker.
# Zip the folder, copy to your Windows PC, install Docker Desktop, then run run.bat.
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT="$REPO_ROOT/listyyy-windows"
# JAR name follows Maven: backend-<version>.jar (version from pom.xml; match SNAPSHOT to skip parent version)
POM_VERSION=$(sed -n 's/.*<version>\([^<]*\-SNAPSHOT\)<\/version>.*/\1/p' "$REPO_ROOT/backend/pom.xml" | head -1)
JAR_NAME="backend-${POM_VERSION}.jar"

echo "Building frontend ..."
cd "$REPO_ROOT/frontend"
npm ci --quiet
npm run build

echo "Building backend (with frontend static) ..."
mkdir -p "$REPO_ROOT/backend/src/main/resources/static"
rm -rf "$REPO_ROOT/backend/src/main/resources/static"
cp -r "$REPO_ROOT/frontend/dist" "$REPO_ROOT/backend/src/main/resources/static"
cd "$REPO_ROOT/backend"
./mvnw -B package -DskipTests -q

echo "Creating Windows package in $OUT ..."
rm -rf "$OUT"
mkdir -p "$OUT/db"
cp "$REPO_ROOT/backend/target/$JAR_NAME" "$OUT/app.jar"
cp "$REPO_ROOT/scripts/windows/Dockerfile" "$OUT/"
cp "$REPO_ROOT/scripts/windows/docker-compose.yml" "$OUT/"
cp "$REPO_ROOT/scripts/windows/run.bat" "$OUT/"
cp "$REPO_ROOT/scripts/windows/README.txt" "$OUT/"
if [[ -f "$REPO_ROOT/db/listyyy-db.sql" ]]; then
  cp "$REPO_ROOT/db/listyyy-db.sql" "$OUT/db/"
  echo "  Included db/listyyy-db.sql (will be imported on first run)."
else
  echo "  No db/listyyy-db.sql found; first run will use an empty DB (Flyway will create schema)."
  # So the db folder is mounted and postgres creates listyyy; app will run Flyway. We need to ensure
  # the app doesn't require an existing dump. Empty db/ is fine - postgres just won't run any init script.
fi

echo "Done. Zip the folder and copy to Windows:"
echo "  cd $REPO_ROOT && zip -r listyyy-windows.zip listyyy-windows"
echo "On Windows: install Docker Desktop, unzip, then double-click run.bat (or: docker compose up)."
