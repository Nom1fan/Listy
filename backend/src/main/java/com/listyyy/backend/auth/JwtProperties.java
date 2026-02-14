package com.listyyy.backend.auth;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "listyyy.jwt")
@lombok.Getter
@lombok.Setter
@Slf4j
public class JwtProperties {

    private String secret = "changeme";
    private long expirationMs = 3600000L;          // 1 hour (access token)
    private long refreshExpirationMs = 2592000000L; // 30 days (refresh token)
    private String refreshCookieName = "listyyy_refresh";
    private boolean refreshCookieSecure = true;     // false for local HTTP dev

    @PostConstruct
    void validateSecret() {
        if (secret == null || secret.length() < 32 || secret.startsWith("changeme")) {
            log.error("JWT_SECRET is not set or too short (min 32 chars for HS256). "
                    + "Set the JWT_SECRET environment variable before running in production.");
            if (refreshCookieSecure) {
                // refreshCookieSecure=true indicates production — fail fast
                throw new IllegalStateException(
                        "JWT_SECRET must be set to a strong random value (≥32 chars) in production");
            }
            log.warn("Continuing with insecure default JWT secret (development mode only)");
        }
    }
}
