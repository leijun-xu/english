package com.english.server.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {
    @Override
    public void postProcessEnvironment(
            ConfigurableEnvironment environment,
            SpringApplication application
    ) {
        if (environment.getProperty("JDBC_DATABASE_URL") != null) {
            return;
        }
        String databaseUrl = environment.getProperty("DATABASE_URL");
        if (databaseUrl == null || !databaseUrl.startsWith("postgresql://")) {
            return;
        }
        URI uri = URI.create(databaseUrl);
        String host = uri.getHost().contains(":") ? "[" + uri.getHost() + "]" : uri.getHost();
        String query = uri.getRawQuery() == null
                ? ""
                : "?" + uri.getRawQuery().replace("schema=", "currentSchema=");
        String jdbcUrl = "jdbc:postgresql://" + host +
                (uri.getPort() > 0 ? ":" + uri.getPort() : "") + uri.getRawPath() + query;
        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("spring.datasource.url", jdbcUrl);
        if (uri.getRawUserInfo() != null) {
            String[] credentials = uri.getRawUserInfo().split(":", 2);
            properties.put("spring.datasource.username", decode(credentials[0]));
            if (credentials.length > 1) {
                properties.put("spring.datasource.password", decode(credentials[1]));
            }
        }
        environment.getPropertySources().addFirst(
                new MapPropertySource("prismaDatabaseUrl", properties)
        );
    }

    private String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}
