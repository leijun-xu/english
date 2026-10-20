package com.english.server;

import com.english.server.auth.AuthUser;
import com.english.server.auth.JwtTokenService;
import com.english.server.config.AppProperties;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenServiceTest {
    @Test
    void generatesAccessAndRefreshTokensWithCompatibleClaims() {
        AppProperties properties = new AppProperties(
                new AppProperties.Jwt("test-secret", Duration.ofSeconds(10), Duration.ofDays(7)),
                null,
                null,
                null
        );
        JwtTokenService service = new JwtTokenService(properties);
        AuthUser source = new AuthUser("user-1", "tester", null, null);

        var tokens = service.generate(source);
        AuthUser access = service.verify(tokens.get("accessToken"));
        AuthUser refresh = service.verify(tokens.get("refreshToken"));

        assertThat(access.userId()).isEqualTo("user-1");
        assertThat(access.name()).isEqualTo("tester");
        assertThat(access.email()).isNull();
        assertThat(access.tokenType()).isEqualTo("access");
        assertThat(refresh.tokenType()).isEqualTo("refresh");
    }
}
