FROM gradle:8.7.0-jdk21 AS build
WORKDIR /home/gradle/app

COPY gradlew gradlew
COPY gradle gradle
COPY build.gradle* settings.gradle* ./
RUN chmod +x gradlew
RUN ./gradlew dependencies

COPY src src
RUN ./gradlew clean bootJar -x test --no-daemon -Dorg.gradle.vfs.watch=false --stacktrace --info

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /home/gradle/app/build/libs/*.jar app.jar
ENV LANG=C.UTF-8 LC_ALL=C.UTF-8
ENTRYPOINT ["java","-jar","app.jar"]
