package com.example.demo.notification;

import com.example.demo.auth.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/fcm")
@RequiredArgsConstructor
public class FcmController {

    private final FcmTokenRepository fcmTokenRepository;

    @PostMapping("/register")
    public ResponseEntity<Void> register(
            @AuthenticationPrincipal User user,
            @RequestBody FcmRegisterRequest req
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        FcmToken existing = fcmTokenRepository.findByUserId(user.getId()).stream()
                .filter(t -> t.getToken().equals(req.getToken()) || (req.getDeviceId() != null && req.getDeviceId().equals(t.getDeviceId())))
                .findFirst()
                .orElse(null);
        if (existing != null) {
            existing.setToken(req.getToken());
            existing.setDeviceId(req.getDeviceId());
            fcmTokenRepository.save(existing);
        } else {
            FcmToken token = FcmToken.builder()
                    .user(user)
                    .token(req.getToken())
                    .deviceId(req.getDeviceId())
                    .build();
            fcmTokenRepository.save(token);
        }
        return ResponseEntity.ok().build();
    }
}