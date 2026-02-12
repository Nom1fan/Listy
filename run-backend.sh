#!/usr/bin/env bash
# Run Spring Boot backend with local profile (from repo root or any dir).
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/demo" && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local
