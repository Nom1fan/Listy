package com.example.demo.auth;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "otp_request_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpRequestLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 20)
    private String phone;

    @Column(length = 320)
    private String email;

    @CreationTimestamp
    @Column(name = "requested_at", nullable = false)
    private Instant requestedAt;
}
