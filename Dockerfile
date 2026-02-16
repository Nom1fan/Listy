# syntax=docker/dockerfile:1
# Build for linux/amd64 so the image runs on EC2 and builds on Apple Silicon

# Build frontend (use package.json only so Docker uses public npm registry; lockfile may point at private Artifactory)
FROM --platform=linux/amd64 node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN --mount=type=cache,target=/root/.npm npm install
COPY frontend/ ./
RUN npm run build:docker

# Build backend (with frontend static baked in)
FROM --platform=linux/amd64 maven:3.9-eclipse-temurin-17-alpine AS backend
WORKDIR /app

# Download dependencies first (cached as long as pom.xml doesn't change)
COPY backend/pom.xml ./backend/
RUN --mount=type=cache,target=/root/.m2 cd backend && mvn -B dependency:go-offline -q

# Copy source and frontend build, then package
COPY backend/src ./backend/src
COPY --from=frontend /app/frontend/dist/ ./backend/src/main/resources/static/
RUN --mount=type=cache,target=/root/.m2 cd backend && mvn -B package -DskipTests -q

# Runtime
FROM --platform=linux/amd64 eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN adduser -D -u 1000 app && mkdir -p /app/logs /app/uploads && chown -R app:app /app/logs /app/uploads
COPY --from=backend /app/backend/target/*.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
