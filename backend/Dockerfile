FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY . .
# fix Windows line endings on mvnw, then build the jar
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw -q -Dmaven.test.skip=true package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]