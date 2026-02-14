package com.listyyy.backend.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface EmailOtpRepository extends JpaRepository<EmailOtp, String> {

    /** Atomically delete the OTP only if email AND code match. Returns 1 if consumed, 0 if not. */
    @Modifying
    @Query("DELETE FROM EmailOtp o WHERE o.email = :email AND o.code = :code")
    int deleteByEmailAndCode(String email, String code);
}
