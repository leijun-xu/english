package com.english.server.auth;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.english.server.config.AppProperties;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

@Service
public class JwtTokenService {
    private final Algorithm algorithm;
    private final AppProperties.Jwt properties;

    public JwtTokenService(AppProperties properties) {
        this.properties = properties.jwt();
        this.algorithm = Algorithm.HMAC256(this.properties.secret());
    }

    public Map<String, String> generate(AuthUser user) {
        return Map.of(
                "accessToken", sign(user, "access", properties.accessExpiration().toSeconds()),
                "refreshToken", sign(user, "refresh", properties.refreshExpiration().toSeconds())
        );
    }

    public AuthUser verify(String token) {
        DecodedJWT jwt = JWT.require(algorithm).build().verify(token);
        return new AuthUser(
                jwt.getClaim("userId").asString(),
                jwt.getClaim("name").asString(),
                jwt.getClaim("email").isNull() ? null : jwt.getClaim("email").asString(),
                jwt.getClaim("tokenType").asString()
        );
    }

    private String sign(AuthUser user, String tokenType, long expirationSeconds) {
        var builder = JWT.create()
                .withClaim("userId", user.userId())
                .withClaim("name", user.name())
                .withClaim("tokenType", tokenType)
                .withIssuedAt(Instant.now())
                .withExpiresAt(Instant.now().plusSeconds(expirationSeconds));
        if (user.email() != null) {
            builder.withClaim("email", user.email());
        } else {
            builder.withNullClaim("email");
        }
        return builder.sign(algorithm);
    }
}
