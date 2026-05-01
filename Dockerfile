# syntax=docker/dockerfile:1
# Final image: linux/amd64 (EC2). Use `docker build --platform linux/amd64` when building on Apple Silicon.
#
# Frontend uses Bun for installs: npm in Docker reproducibly dies mid-install (~4–8m) with
# "Exit handler never called" on this tree. Bun installs from npm lockfiles.
#
# TLS / corporate MITM: use ./scripts/docker-build-image.sh --ca /path/to/root.pem
# Or build in GitHub Actions (.github/workflows/docker-image.yml) — no CA needed there.
# Manual: docker build --platform linux/amd64 --secret id=npm-ca,src=$HOME/corp-root.pem -t ... .
#
# - Rewrite Artifactory tarball URLs in package-lock.json to registry.npmjs.org.
# - Remove @playwright/test before install (not needed for `vite build`).

FROM oven/bun:1-slim AS frontend
WORKDIR /app/frontend
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV CI=true
COPY frontend/package.json frontend/package-lock.json ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    --mount=type=secret,id=npm-ca,required=false \
    set -eux \
    && if [ -f /run/secrets/npm-ca ] && [ -s /run/secrets/npm-ca ]; then \
         cp /run/secrets/npm-ca /usr/local/share/ca-certificates/npm-custom-ca.crt \
         && update-ca-certificates; \
       fi \
    && bun -e 'const fs=require("fs"); const p=JSON.parse(fs.readFileSync("package.json","utf8")); delete p.devDependencies["@playwright/test"]; fs.writeFileSync("package.json", JSON.stringify(p,null,2)+"\n");' \
    && sed -i 's#https://entplus\.jfrog\.io/artifactory/api/npm/npm-virtual/#https://registry.npmjs.org/#g' package-lock.json \
    && bun install \
    && test -x node_modules/.bin/vite
COPY frontend/ ./
RUN bun run build:docker

# Build backend (with frontend static baked in)
FROM maven:3.9-eclipse-temurin-17-alpine AS backend
WORKDIR /app

# Download dependencies first (cached as long as pom.xml doesn't change)
COPY backend/pom.xml ./backend/
RUN --mount=type=cache,target=/root/.m2 cd backend && mvn -B dependency:go-offline -q

# Copy source and frontend build, then package
COPY backend/src ./backend/src
COPY --from=frontend /app/frontend/dist/ ./backend/src/main/resources/static/
RUN --mount=type=cache,target=/root/.m2 cd backend && mvn -B package -DskipTests -q

# Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN adduser -D -u 1000 app && mkdir -p /app/logs /app/uploads && chown -R app:app /app/logs /app/uploads
COPY --from=backend /app/backend/target/*.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
