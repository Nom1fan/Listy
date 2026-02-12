#!/usr/bin/env bash
# Import a listy DB dump into the PostgreSQL container on EC2.
# Run this ON THE EC2 INSTANCE from the deploy directory (e.g. ~/listy) that has docker-compose.yml.
# Usage: ./import-db-ec2.sh [path-to-listy-db.sql]
# Example: ./import-db-ec2.sh ./listy-db.sql
set -e
SQL="${1:-./listy-db.sql}"
if [[ ! -f "$SQL" ]]; then
  echo "No dump at $SQL. Copy db/listy-db.sql to this host (e.g. scp from your Mac) then run again."
  exit 1
fi
if ! docker compose version &>/dev/null; then
  echo "Run this script from the directory that contains docker-compose.yml (e.g. ~/listy)."
  exit 1
fi
echo "[1/5] Stopping app so we can replace the database ..."
docker compose stop app

echo "[2/5] Dropping existing listy database ..."
docker compose exec -T db psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS listy;"

echo "[3/5] Creating empty listy database ..."
docker compose exec -T db psql -U postgres -d postgres -c "CREATE DATABASE listy;"

echo "[4/5] Importing $SQL (this may take 1–2 minutes) ..."
# Strip any nonstandard \restrict line that can make psql hang (from some pg_dump wrappers)
grep -v '^\\restrict ' "$SQL" | docker compose exec -T db psql -U postgres -d listy
echo "[4/5] Import finished."

echo "[5/5] Starting app ..."
docker compose start app

echo "Done. Your data is loaded."
