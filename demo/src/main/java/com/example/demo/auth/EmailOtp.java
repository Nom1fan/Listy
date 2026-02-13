package com.example.demo.auth;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "email_otp")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailOtp {

    @Id
    @Column(nullable = false, length = 320)
    private String email;

    @Column(nullable = false, length = 10)
    private String code;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
}
