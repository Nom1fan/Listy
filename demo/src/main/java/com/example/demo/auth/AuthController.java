package com.example.demo.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtProperties jwtProperties;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req,
                                                  HttpServletResponse response) {
        LoginResult result = authService.register(req);
        setRefreshCookie(response, result.refreshToken());
        return ResponseEntity.ok(result.authResponse());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody TokenRequest req,
                                               HttpServletResponse response) {
        LoginResult result = authService.login(req);
        setRefreshCookie(response, result.refreshToken());
        return ResponseEntity.ok(result.authResponse());
    }

    @PostMapping("/phone/request")
    public ResponseEntity<Void> requestPhoneOtp(@Valid @RequestBody PhoneRequestOtpRequest req) {
        authService.requestPhoneOtp(req);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/phone/verify")
    public ResponseEntity<AuthResponse> verifyPhoneOtp(@Valid @RequestBody PhoneVerifyRequest req,
                                                        HttpServletResponse response) {
        LoginResult result = authService.verifyPhoneOtp(req);
        setRefreshCookie(response, result.refreshToken());
        return ResponseEntity.ok(result.authResponse());
    }

    @PostMapping("/email/request")
    public ResponseEntity<Void> requestEmailOtp(@Valid @RequestBody EmailRequestOtpRequest req) {
        authService.requestEmailOtp(req);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/email/verify")
    public ResponseEntity<AuthResponse> verifyEmailOtp(@Valid @RequestBody EmailVerifyRequest req,
                                                        HttpServletResponse response) {
        LoginResult result = authService.verifyEmailOtp(req);
        setRefreshCookie(response, result.refreshToken());
        return ResponseEntity.ok(result.authResponse());
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request,
                                                 HttpServletResponse response) {
        String refreshToken = extractRefreshToken(request);
        if (refreshToken == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            LoginResult result = authService.refresh(refreshToken);
            setRefreshCookie(response, result.refreshToken());
            return ResponseEntity.ok(result.authResponse());
        } catch (IllegalArgumentException e) {
            clearRefreshCookie(response);
            return ResponseEntity.status(401).build();
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request,
                                        HttpServletResponse response) {
        String refreshToken = extractRefreshToken(request);
        if (refreshToken != null) {
            authService.revokeRefreshToken(refreshToken);
        }
        clearRefreshCookie(response);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/me")
    public ResponseEntity<AuthResponse> updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateProfileRequest req
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(authService.updateDisplayName(user, req.getDisplayName()));
    }

    // ---- cookie helpers ----

    private void setRefreshCookie(HttpServletResponse response, String refreshToken) {
        Cookie cookie = new Cookie(jwtProperties.getRefreshCookieName(), refreshToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(jwtProperties.isRefreshCookieSecure());
        cookie.setPath("/api/auth");
        cookie.setMaxAge((int) (jwtProperties.getRefreshExpirationMs() / 1000));
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(jwtProperties.getRefreshCookieName(), "");
        cookie.setHttpOnly(true);
        cookie.setSecure(jwtProperties.isRefreshCookieSecure());
        cookie.setPath("/api/auth");
        cookie.setMaxAge(0);
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);
    }

    private String extractRefreshToken(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> jwtProperties.getRefreshCookieName().equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }
}
