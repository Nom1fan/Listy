package com.listyyy.backend.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface PhoneOtpRepository extends JpaRepository<PhoneOtp, String> {

    /** Atomically delete the OTP only if phone AND code match. Returns 1 if consumed, 0 if not. */
    @Modifying
    @Query("DELETE FROM PhoneOtp o WHERE o.phone = :phone AND o.code = :code")
    int deleteByPhoneAndCode(String phone, String code);
}
