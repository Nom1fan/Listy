package com.example.demo.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PhoneOtpRepository phoneOtpRepository;
    private final OtpRequestLogRepository otpRequestLogRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final SmsService smsService;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Value("${listy.otp.ttl-minutes:5}")
    private int otpTtlMinutes;

    @Value("${listy.otp.rate-limit-per-phone-per-hour:5}")
    private int rateLimitPerPhonePerHour;

    @Transactional
    public LoginResult register(RegisterRequest req) {
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
        return buildLoginResult(user);
    }

    @Transactional
    public LoginResult login(TokenRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));
        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }
        return buildLoginResult(user);
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
    public LoginResult verifyPhoneOtp(PhoneVerifyRequest req) {
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
        return buildLoginResult(user);
    }

    public Optional<User> findUserById(UUID id) {
        return userRepository.findById(id);
    }

    @Transactional
    public AuthResponse updateDisplayName(User user, String displayName) {
        if (displayName == null || displayName.isBlank()) {
            throw new IllegalArgumentException("Display name is required");
        }
        if (displayName.length() > 255) {
            throw new IllegalArgumentException("Display name too long");
        }
        user.setDisplayName(displayName.trim());
        user = userRepository.save(user);
        String token = jwtService.generateToken(user);
        return toAuthResponse(user, token);
    }

    /**
     * Use a valid refresh token to issue a new access token (and rotate the refresh token).
     */
    @Transactional
    public LoginResult refresh(String refreshTokenValue) {
        RefreshToken rt = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));
        if (rt.getExpiresAt().isBefore(Instant.now())) {
            refreshTokenRepository.delete(rt);
            throw new IllegalArgumentException("Refresh token expired");
        }
        User user = rt.getUser();
        // Rotate: delete old token, issue new one
        refreshTokenRepository.delete(rt);
        return buildLoginResult(user);
    }

    /**
     * Revoke a specific refresh token (logout from one device).
     */
    @Transactional
    public void revokeRefreshToken(String refreshTokenValue) {
        refreshTokenRepository.deleteByToken(refreshTokenValue);
    }

    /**
     * Revoke all refresh tokens for a user (logout everywhere).
     */
    @Transactional
    public void revokeAllRefreshTokens(UUID userId) {
        refreshTokenRepository.deleteAllByUserId(userId);
    }

    // ---- internal helpers ----

    private LoginResult buildLoginResult(User user) {
        String accessToken = jwtService.generateToken(user);
        String refreshTokenValue = generateRefreshTokenValue();
        Instant expiresAt = Instant.now().plusMillis(jwtProperties.getRefreshExpirationMs());
        refreshTokenRepository.save(RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiresAt(expiresAt)
                .build());
        return new LoginResult(toAuthResponse(user, accessToken), refreshTokenValue);
    }

    private String generateRefreshTokenValue() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
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
