package com.english.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class EnglishServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EnglishServerApplication.class, args);
    }
}
