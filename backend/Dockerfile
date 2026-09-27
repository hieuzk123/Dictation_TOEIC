# ========================================================
# Dockerfile: Spring Boot 3 Backend (TOEIC Dictation API)
# Multi-stage build with Eclipse Temurin 21
# ========================================================

# Stage 1: Build stage
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Build application artifact
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Minimal JRE Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Run as non-privileged spring user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy built jar from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Expose backend REST API port
EXPOSE 8080

# Configure JVM container resource limits and flags
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
