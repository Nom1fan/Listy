package com.listyyy.backend.auth;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PhoneOtpRepository extends JpaRepository<PhoneOtp, String> {
}
