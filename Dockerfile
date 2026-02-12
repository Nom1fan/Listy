# Build for linux/amd64 so the image runs on EC2 and builds on Apple Silicon
# Build frontend (use package.json only so Docker uses public npm registry; lockfile may point at private Artifactory)
FROM --platform=linux/amd64 node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Build backend (with frontend static baked in)
FROM --platform=linux/amd64 maven:3.9-eclipse-temurin-17-alpine AS backend
WORKDIR /app
COPY demo/pom.xml ./demo/
COPY demo/src ./demo/src

# Copy frontend build into Spring static resources (contents of dist → static)
COPY --from=frontend /app/frontend/dist/ ./demo/src/main/resources/static/

RUN cd demo && mvn -B package -DskipTests -q

# Runtime
FROM --platform=linux/amd64 eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN adduser -D -u 1000 app && mkdir -p /app/logs && chown -R app:app /app/logs
COPY --from=backend /app/demo/target/*.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
