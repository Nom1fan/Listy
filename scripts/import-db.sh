#!/usr/bin/env bash
# Import db/listy-db.sql into a fresh listy database.
# On a new machine: install PostgreSQL, create the DB, then run this script.
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SQL="$REPO_ROOT/db/listy-db.sql"
if [[ ! -f "$SQL" ]]; then
  echo "No $SQL found. Run scripts/export-db.sh on the source machine first and commit the file."
  exit 1
fi
echo "Dropping existing listy DB (if any) and creating a fresh one ..."
dropdb -U postgres -h localhost -p 5432 listy 2>/dev/null || true
createdb -U postgres -h localhost -p 5432 listy
echo "Importing $SQL ..."
psql -U postgres -h localhost -p 5432 -d listy -f "$SQL" -q
echo "Done. You can start the backend."
