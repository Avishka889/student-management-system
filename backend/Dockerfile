FROM eclipse-temurin:26-jdk AS build
WORKDIR /app
COPY . .
# fix Windows line endings on mvnw, then build the jar
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw -q -Dmaven.test.skip=true package

FROM eclipse-temurin:26-jdk
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:TieredStopAtLevel=1", "-XX:+UseSerialGC", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]