# Build frontend
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Build backend (with frontend static baked in)
FROM maven:3.9-eclipse-temurin-17-alpine AS backend
WORKDIR /app
COPY demo/pom.xml ./demo/
COPY demo/src ./demo/src

# Copy frontend build into Spring static resources (contents of dist → static)
COPY --from=frontend /app/frontend/dist/ ./demo/src/main/resources/static/

RUN cd demo && mvn -B package -DskipTests -q

# Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN adduser -D -u 1000 app
COPY --from=backend /app/demo/target/*.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
