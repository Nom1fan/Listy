package com.listyyy.backend.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "listyyy.jwt")
@lombok.Getter
@lombok.Setter
public class JwtProperties {

    private String secret = "changeme";
    private long expirationMs = 3600000L;          // 1 hour (access token)
    private long refreshExpirationMs = 2592000000L; // 30 days (refresh token)
    private String refreshCookieName = "listyyy_refresh";
    private boolean refreshCookieSecure = true;     // false for local HTTP dev
}
