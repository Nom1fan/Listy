package com.example.demo.auth;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody TokenRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/phone/request")
    public ResponseEntity<Void> requestPhoneOtp(@Valid @RequestBody PhoneRequestOtpRequest req) {
        authService.requestPhoneOtp(req);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/phone/verify")
    public ResponseEntity<AuthResponse> verifyPhoneOtp(@Valid @RequestBody PhoneVerifyRequest req) {
        return ResponseEntity.ok(authService.verifyPhoneOtp(req));
    }

    @PatchMapping("/me")
    public ResponseEntity<AuthResponse> updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateProfileRequest req
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(authService.updateDisplayName(user, req.getDisplayName()));
    }
}
