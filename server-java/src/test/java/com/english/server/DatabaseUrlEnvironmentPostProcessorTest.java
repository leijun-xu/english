package com.english.server;

import com.english.server.config.DatabaseUrlEnvironmentPostProcessor;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;

class DatabaseUrlEnvironmentPostProcessorTest {
    @Test
    void convertsPrismaUrlAndExtractsEncodedCredentials() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("DATABASE_URL",
                        "postgresql://db-user:p%40ss@localhost:5432/english?schema=public");

        new DatabaseUrlEnvironmentPostProcessor()
                .postProcessEnvironment(environment, new SpringApplication());

        assertThat(environment.getProperty("spring.datasource.url"))
                .isEqualTo("jdbc:postgresql://localhost:5432/english?currentSchema=public");
        assertThat(environment.getProperty("spring.datasource.username")).isEqualTo("db-user");
        assertThat(environment.getProperty("spring.datasource.password")).isEqualTo("p@ss");
    }
}
