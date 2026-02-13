package com.example.demo.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PhoneOtpRepository phoneOtpRepository;
    private final OtpRequestLogRepository otpRequestLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final SmsService smsService;

    @Value("${listy.otp.ttl-minutes:5}")
    private int otpTtlMinutes;

    @Value("${listy.otp.rate-limit-per-phone-per-hour:5}")
    private int rateLimitPerPhonePerHour;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.findByEmail(req.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }
        User user = User.builder()
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .displayName(req.getDisplayName() != null ? req.getDisplayName() : req.getEmail())
                .locale("he")
                .build();
        user = userRepository.save(user);
        String token = jwtService.generateToken(user);
        return toAuthResponse(user, token);
    }

    public AuthResponse login(TokenRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));
        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }
        String token = jwtService.generateToken(user);
        return toAuthResponse(user, token);
    }

    @Transactional
    public void requestPhoneOtp(PhoneRequestOtpRequest req) {
        String phone = PhoneNormalizer.normalize(req.getPhone());
        Instant oneHourAgo = Instant.now().minusSeconds(3600);
        long count = otpRequestLogRepository.countByPhoneSince(phone, oneHourAgo);
        if (count >= rateLimitPerPhonePerHour) {
            throw new IllegalArgumentException("Too many OTP requests. Try again later.");
        }
        String code = String.format("%06d", ThreadLocalRandom.current().nextInt(100_000, 1_000_000));
        Instant expiresAt = Instant.now().plusSeconds(otpTtlMinutes * 60L);
        phoneOtpRepository.save(PhoneOtp.builder()
                .phone(phone)
                .code(code)
                .expiresAt(expiresAt)
                .build());
        otpRequestLogRepository.save(OtpRequestLog.builder().phone(phone).build());
        smsService.sendOtp(phone, code);
    }

    @Transactional
    public AuthResponse verifyPhoneOtp(PhoneVerifyRequest req) {
        String phone = PhoneNormalizer.normalize(req.getPhone());
        Optional<PhoneOtp> opt = phoneOtpRepository.findById(phone);
        if (opt.isEmpty() || !opt.get().getCode().equals(req.getCode())) {
            throw new IllegalArgumentException("Invalid or expired code");
        }
        if (opt.get().getExpiresAt().isBefore(Instant.now())) {
            phoneOtpRepository.delete(opt.get());
            throw new IllegalArgumentException("Code expired");
        }
        phoneOtpRepository.delete(opt.get());
        User user = userRepository.findByPhone(phone).orElseGet(() -> {
            String name = req.getDisplayName() != null && !req.getDisplayName().isBlank()
                    ? req.getDisplayName().trim() : phone;
            User newUser = User.builder()
                    .phone(phone)
                    .displayName(name)
                    .locale("he")
                    .build();
            return userRepository.save(newUser);
        });
        String token = jwtService.generateToken(user);
        return toAuthResponse(user, token);
    }

    public Optional<User> findUserById(UUID id) {
        return userRepository.findById(id);
    }

    @Transactional
    public AuthResponse updateDisplayName(User user, String displayName) {
        if (displayName != null && displayName.length() > 255) {
            throw new IllegalArgumentException("Display name too long");
        }
        user.setDisplayName(displayName != null && !displayName.isBlank() ? displayName.trim() : null);
        user = userRepository.save(user);
        String token = jwtService.generateToken(user);
        return toAuthResponse(user, token);
    }

    private static AuthResponse toAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .phone(user.getPhone())
                .displayName(user.getDisplayName())
                .locale(user.getLocale())
                .build();
    }
}
