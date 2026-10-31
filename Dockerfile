FROM sourcemation/jdk-25

WORKDIR /

COPY . /

RUN sh mvnw clean package

CMD ["java", "-jar", "target/Games-0.1.0.jar"]