package com.english.server.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        Jwt jwt,
        Minio minio,
        Alipay alipay,
        Socket socket
) {
    public record Jwt(String secret, Duration accessExpiration, Duration refreshExpiration) {
    }

    public record Minio(
            String endpoint,
            int port,
            String useSsl,
            String accessKey,
            String secretKey,
            String bucket
    ) {
        public boolean sslEnabled() {
            return "1".equals(useSsl) || Boolean.parseBoolean(useSsl);
        }
    }

    public record Alipay(
            String appId,
            String gateway,
            String publicKey,
            String privateKey,
            String notifyUrl
    ) {
    }

    public record Socket(boolean enabled, String host, int port) {
    }
}
