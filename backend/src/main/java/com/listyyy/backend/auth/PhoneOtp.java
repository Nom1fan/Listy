package com.listyyy.backend.auth;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "phone_otp")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PhoneOtp {

    @Id
    @Column(nullable = false, length = 20)
    private String phone;

    @Column(nullable = false, length = 10)
    private String code;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
}
