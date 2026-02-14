package com.listyyy.backend.auth;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailOtpRepository extends JpaRepository<EmailOtp, String> {
}
