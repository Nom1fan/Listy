#!/usr/bin/env bash
# Repair Flyway schema history after a failed migration (e.g. V6 failed due to DB I/O error).
# Override with env: FLYWAY_URL, FLYWAY_USER, FLYWAY_PASSWORD (or pass -Dflyway.url=... to mvnw).
set -e
cd "$(dirname "$0")/.."
DB_URL="${FLYWAY_URL:-jdbc:postgresql://localhost:5432/listy}"
DB_USER="${FLYWAY_USER:-postgres}"
DB_PASS="${FLYWAY_PASSWORD:-postgres}"
./demo/mvnw -q -Dflyway.url="$DB_URL" -Dflyway.user="$DB_USER" -Dflyway.password="$DB_PASS" flyway:repair
echo "Flyway repair done. Restart the backend."
