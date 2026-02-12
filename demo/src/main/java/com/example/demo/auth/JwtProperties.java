package com.example.demo.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "listy.jwt")
@lombok.Getter
@lombok.Setter
public class JwtProperties {

    private String secret = "changeme";
    private long expirationMs = 86400000L;
}
