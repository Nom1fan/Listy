#!/usr/bin/env bash
# Export the listyyy PostgreSQL database to db/listyyy-db.sql (schema + data).
# Commit and push that file to use it on another machine; then run import-db.sh there.
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT="$REPO_ROOT/db/listyyy-db.sql"
mkdir -p "$REPO_ROOT/db"
echo "Exporting listyyy DB to $OUT ..."
pg_dump -U postgres -h localhost -p 5432 --no-owner --no-acl listyyy > "$OUT"
echo "Done. Commit and push db/listyyy-db.sql to use it on another machine."
